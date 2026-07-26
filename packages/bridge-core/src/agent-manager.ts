/**
 * AgentManager — owns per-agent session lifecycle.
 *
 * Multi-runtime: each agent declares `runtime: "claude" | "codex"`. The
 * manager dispatches to the matching `AgentRuntime` from the registry;
 * everything CLI-specific lives in `@raltic/agent-runtime/{claude,codex}`.
 *
 * Things AgentManager owns (stays runtime-agnostic):
 *   - per-agent workspace dir (~/.raltic/agents/<agentId>/)
 *   - `raltic` CLI wrapper writer (PATH-injected)
 *   - session_id persistence on disk
 *   - per-agent message queue + busy serialisation
 *   - HTTP POST /api/v1/agent-activity from event subscriptions
 *   - lifecycle broadcast (idle/error)
 */

import { mkdirSync, existsSync, writeFileSync, readFileSync, readdirSync, rmSync, statSync, unlinkSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "node:module";
import { sanitizeUserVisibleError, type AgentRunSource, type BridgeConnectResponse, type MessageRow } from "@raltic/protocol";
import { buildSystemPrompt } from "./system-prompt.js";
import {
  buildRuntimeRegistry,
  writeAgentsRootSentinel,
  type ActivityEvent,
  type AgentRuntime,
  type DetectedRuntimeSnapshot,
  type PermissionMode,
  type RuntimeId,
  type RuntimeSession,
} from "@raltic/agent-runtime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const shq = (s: string): string => s.replace(/'/g, "'\\''");

/**
 * Locate the `@raltic/cli` executable to wrap (see runtime-agnostic
 * comment in `prepareCliTransport`). Behavior identical to pre-refactor.
 */
function resolveCliEntry():
  | { kind: "compiled"; entry: string }
  | { kind: "ts"; entry: string; tsxPath: string }
  | null {
  const require = createRequire(import.meta.url);
  let cliRoot: string | null = null;
  try {
    const pkgPath = require.resolve("@raltic/cli/package.json");
    cliRoot = dirname(pkgPath);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { bin?: string | Record<string, string> };
    const binSpec = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.raltic;
    if (binSpec) {
      const entry = resolve(cliRoot, binSpec);
      if (existsSync(entry)) return { kind: "compiled", entry };
    }
  } catch { /* fall through */ }
  // A workspace install intentionally has no compiled CLI yet. In that
  // case run the CLI source with the tsx dependency owned by @raltic/cli,
  // not a hoisted copy that may or may not exist beside bridge-core.
  if (cliRoot) {
    const cliEntry = resolve(cliRoot, "src", "index.ts");
    const tsxPath = resolve(cliRoot, "node_modules", "tsx", "dist", "cli.mjs");
    if (existsSync(cliEntry) && existsSync(tsxPath)) {
      return { kind: "ts", entry: cliEntry, tsxPath };
    }
  }
  try {
    const bridgeRoot = resolve(__dirname, "..");
    const cliEntry = resolve(bridgeRoot, "..", "..", "packages", "cli", "src", "index.ts");
    const tsxPath = join(bridgeRoot, "node_modules", "tsx", "dist", "cli.mjs");
    if (existsSync(cliEntry) && existsSync(tsxPath)) {
      return { kind: "ts", entry: cliEntry, tsxPath };
    }
  } catch { /* nothing */ }
  return null;
}

interface AgentSession {
  id: string;
  name: string;
  displayName: string;
  workDir: string;
  systemPrompt: string | null;
  model: string;
  runtime: RuntimeId;
}

interface QueuedMessage {
  userMessage: string;
  runId?: string;
  resolve: () => void;
  reject: (err: Error) => void;
}

interface AgentEntry {
  runtime: AgentRuntime;
  session: RuntimeSession;
  busy: boolean;
  currentRunId?: string;
  currentRunError?: string;
  messageQueue: QueuedMessage[];
  /** Unsubscribe callbacks for the listeners we attached. */
  unsubs: Array<() => void>;
}

interface RunContext {
  runId: string;
  outputMessageId?: string | null;
}

interface AgentManagerOpts {
  apiUrl: string;
  agentsDir: string;
}

const RUN_OUTPUT_PATCH_RETRIES = 5;
const RUN_OUTPUT_PATCH_RETRY_MS = 300;

type ActivityKind = "idle" | "thinking" | "working" | "error";

const PERM_ENV = process.env.RALTIC_BRIDGE_PERMISSION_MODE?.trim();
const PERM_VALID: PermissionMode[] = ["readOnly", "default", "acceptEdits", "bypassPermissions"];

/**
 * Build the env passed to a spawned agent runtime. We DON'T spread
 * `...process.env` because the bridge process can hold operator
 * secrets (SENTRY_DSN, AWS creds from the operator's shell, etc.)
 * that the agent absolutely doesn't need. Each entry below is
 * justified — everything else is intentionally absent.
 */
function buildAgentEnv(opts: {
  agentId: string;
  apiUrl: string;
  agentToken: string;
  ralticBin: string;
  runContextFile: string;
}): Record<string, string> {
  const e: Record<string, string> = {};
  // Filesystem essentials.
  if (process.env.HOME) e.HOME = process.env.HOME;
  if (process.env.USER) e.USER = process.env.USER;
  if (process.env.LANG) e.LANG = process.env.LANG;
  if (process.env.TMPDIR) e.TMPDIR = process.env.TMPDIR;
  // PATH: prefer the embedded raltic CLI dir over the system one so the
  // agent calls our shim instead of any locally-installed `raltic` binary.
  e.PATH = `${opts.ralticBin}:${process.env.PATH ?? "/usr/bin:/bin"}`;
  // Disable colorized output so the parent can parse runtime logs without
  // stripping ANSI codes.
  e.FORCE_COLOR = "0";
  e.NO_COLOR = "1";
  // Identity + auth.
  e.RALTIC_AGENT_ID = opts.agentId;
  e.RALTIC_API_URL = opts.apiUrl;
  e.RALTIC_AGENT_TOKEN = opts.agentToken;
  e.RALTIC_AGENT_RUN_FILE = opts.runContextFile;
  return e;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AgentManager {
  private sessions = new Map<string, AgentSession>();
  private entries = new Map<string, AgentEntry>();
  /** In-flight spawn promises, keyed by agentId. Concurrent
   *  sendToAgent() calls for an agent with no entry yet share the
   *  same spawn — without this they each race spawnForAgent() and
   *  the second .set() orphans the first session (child process kept
   *  alive but unreachable; messages queued onto the wrong entry). */
  private spawning = new Map<string, Promise<AgentEntry>>();
  /** channelId → list of agentIds that should respond to messages in this channel */
  private channelToAgents = new Map<string, string[]>();
  private channelTypes = new Map<string, BridgeConnectResponse["channels"][number]["type"]>();
  private apiUrl: string;
  private agentsDir: string;
  private boot: BridgeConnectResponse | null = null;
  private runtimes = buildRuntimeRegistry();

  constructor(opts: AgentManagerOpts) {
    this.apiUrl = opts.apiUrl;
    this.agentsDir = opts.agentsDir;
    if (!existsSync(opts.agentsDir)) mkdirSync(opts.agentsDir, { recursive: true });
    // Sentinel — terminates Codex's upward AGENTS.md walk at the agents
    // root so a stray ~/AGENTS.md doesn't leak into our agents' prompts.
    writeAgentsRootSentinel(opts.agentsDir);
  }

  setBootContext(boot: BridgeConnectResponse): void {
    this.boot = boot;
    this.channelToAgents.clear();
    this.channelTypes.clear();
    for (const ch of boot.channels) {
      this.channelToAgents.set(ch.id, ch.agentIds);
      this.channelTypes.set(ch.id, ch.type);
    }
    for (const session of this.sessions.values()) this.writeCliTokenFile(session);
  }

  addAgentToChannel(
    channelId: string,
    agentId: string,
    channelType?: BridgeConnectResponse["channels"][number]["type"],
  ): boolean {
    if (!this.sessions.has(agentId)) return false;
    const existing = this.channelToAgents.get(channelId) ?? [];
    if (channelType) this.channelTypes.set(channelId, channelType);
    if (existing.includes(agentId)) return true;
    this.channelToAgents.set(channelId, [...existing, agentId]);
    return true;
  }

  removeAgentFromChannel(channelId: string, agentId: string): void {
    const existing = this.channelToAgents.get(channelId);
    if (!existing) return;
    const next = existing.filter((id) => id !== agentId);
    if (next.length === 0) this.channelToAgents.delete(channelId);
    else this.channelToAgents.set(channelId, next);
  }

  hasAgentsForChannel(channelId: string): boolean {
    return (this.channelToAgents.get(channelId)?.length ?? 0) > 0;
  }

  async initAllAgents(agents: BridgeConnectResponse["agents"]): Promise<void> {
    for (const a of agents) {
      const workDir = join(this.agentsDir, a.id);
      if (!existsSync(workDir)) {
        mkdirSync(workDir, { recursive: true });
        mkdirSync(join(workDir, "notes"), { recursive: true });
        writeFileSync(
          join(workDir, "MEMORY.md"),
          `# ${a.displayName}\n\n## Role\n${a.displayName}\n\n## Key Knowledge\n- No notes saved yet.\n\n## Active Context\n- Workspace initialized at ${new Date().toISOString().split("T")[0]}.\n`,
        );
        console.log(`  [${a.displayName}] workspace created: ${workDir}`);
      }
      const session = {
        id: a.id, name: a.name, displayName: a.displayName,
        workDir, systemPrompt: a.systemPrompt,
        model: a.model,
        runtime: a.runtime ?? "claude",
      };
      this.sessions.set(a.id, session);
      this.writeCliTokenFile(session);
    }
  }

  async reconcileAgents(agents: BridgeConnectResponse["agents"]): Promise<void> {
    const live = new Set(agents.map((a) => a.id));
    for (const agentId of [...this.sessions.keys()]) {
      if (!live.has(agentId)) await this.stopAgent(agentId, "agent no longer managed by this bridge");
    }
    await this.initAllAgents(agents);
  }

  /** Called by Bridge when a human message lands in a channel one of our agents is in. */
  async dispatchInboundMessage(channelId: string, message: MessageRow): Promise<void> {
    const agentIds = this.channelToAgents.get(channelId);
    if (!agentIds || agentIds.length === 0) return;
    const formatted = this.formatInboundForAgent(channelId, message);
    for (const agentId of agentIds) {
      const runId = await this.createRun(agentId, channelId, message);
      try { await this.sendToAgent(agentId, formatted, runId); }
      catch (e) { console.error(`[agent ${agentId}] dispatch failed:`, e); }
    }
  }

  /**
   * Wrap raw inbound text with the structured header the system prompt
   * teaches the agent to expect. Both Claude and Codex parse it the
   * same way — bridge writes UUID as `target=` and the raltic CLI
   * accepts UUIDs directly via `--target "<uuid>"`.
   */
  private formatInboundForAgent(channelId: string, m: MessageRow): string {
    const threadSuffix = m.threadParentId ? `:${m.threadParentId.slice(0, 8)}` : "";
    const target = `${channelId}${threadSuffix}`;
    const msgShort = m.id.slice(0, 8);
    const time = new Date(m.createdAt).toISOString().replace(/\.\d{3}Z$/, "Z");
    const senderShort = `user_${m.senderId.slice(0, 8)}`;
    return `[target=${target} msg=${msgShort} time=${time} type=${m.senderType}] @${senderShort}: ${m.content}`;
  }

  async sendToAgent(agentId: string, userMessage: string, runId?: string): Promise<void> {
    const session = this.sessions.get(agentId);
    if (!session) throw new Error(`agent ${agentId} not initialized`);

    const unavailable = this.runtimeUnavailableReason(session);
    if (unavailable) {
      this.broadcastActivity(agentId, "error", "Runtime unavailable", unavailable.slice(0, 120));
      await this.updateRun(runId, "failed", { error: unavailable });
      throw new Error(unavailable);
    }

    let entry = this.entries.get(agentId);
    if (!entry) {
      // Cache the in-flight spawn promise so concurrent callers await
      // the SAME spawn and observe the SAME entry afterwards. The
      // single-thread JS guarantees no two callers see `spawning.get`
      // return undefined for the same key without also racing to set
      // it; the first writer wins, the rest await.
      let pending = this.spawning.get(agentId);
      if (!pending) {
        pending = (async () => {
          try {
            const fresh = await this.spawnForAgent(agentId, session);
            if (this.sessions.get(agentId) !== session) {
              await this.disposeEntry(fresh, `agent ${agentId} no longer managed by this bridge`);
              throw new Error(`agent ${agentId} no longer managed by this bridge`);
            }
            this.entries.set(agentId, fresh);
            return fresh;
          } finally {
            this.spawning.delete(agentId);
          }
        })();
        this.spawning.set(agentId, pending);
      }
      try {
        entry = await pending;
      } catch (e) {
        await this.updateRun(runId, "failed", {
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
    }

    if (entry.busy) {
      console.log(`  [${session.displayName}] busy, queueing (${userMessage.length} chars; queue ${entry.messageQueue.length + 1})`);
      return new Promise<void>((res, rej) => entry!.messageQueue.push({ userMessage, runId, resolve: res, reject: rej }));
    }

    entry.busy = true;
    void this._sendNow(agentId, session, entry, userMessage, runId);
  }

  private async _sendNow(
    agentId: string, session: AgentSession, entry: AgentEntry, userMessage: string, runId?: string,
  ): Promise<void> {
    console.log(`  [${session.displayName}] forwarding (${userMessage.length} chars)`);
    entry.currentRunId = runId;
    entry.currentRunError = undefined;
    this.writeRunContext(session, runId);
    await this.updateRun(runId, "running");
    this.broadcastActivity(agentId, "working", "Working", "Message received");
    try {
      await entry.session.send(userMessage);
    } catch (e) {
      console.error(`  [${session.displayName}] send failed:`, e);
      this.broadcastActivity(agentId, "error", "Send failed", (e as Error).message.slice(0, 80));
      await this.updateRun(runId, "failed", {
        error: e instanceof Error ? e.message : String(e),
      });
      if (entry.currentRunId === runId) {
        entry.currentRunId = undefined;
        entry.currentRunError = undefined;
        this.clearRunContext(session);
      }
      entry.busy = false;
      this.drainQueue(agentId);
    }
  }

  private drainQueue(agentId: string): void {
    const entry = this.entries.get(agentId);
    const session = this.sessions.get(agentId);
    if (!entry || !session) return;
    const next = entry.messageQueue.shift();
    if (!next) return;
    console.log(`  [${session.displayName}] draining queue (${entry.messageQueue.length} remaining)`);
    entry.busy = true;
    this._sendNow(agentId, session, entry, next.userMessage, next.runId).then(next.resolve, next.reject);
  }

  /** Spawn a new session for an agent via its declared runtime. Handles
   *  detection of the runtime (failure surfaces as an error broadcast),
   *  workspace prep (incl. raltic wrapper + PATH), and event wiring. */
  private async spawnForAgent(agentId: string, session: AgentSession): Promise<AgentEntry> {
    if (!this.boot) throw new Error("boot context not set");

    const runtime = this.runtimes[session.runtime];
    if (!runtime) {
      throw new Error(`unknown runtime "${session.runtime}" for agent ${session.displayName}`);
    }

    const ralticDir = this.prepareCliTransport(agentId, session);
    const systemPrompt = this.buildSystemPromptFor(session);
    const permissionMode = this.effectivePermissionMode(session);

    console.log(`  [${session.displayName}] spawning ${runtime.displayName} (${session.model})`);

    const resumeKey = await this.loadSessionId(session);

    const rs = runtime.spawn({
      workDir: session.workDir,
      systemPrompt,
      model: session.model,
      permissionMode,
      allowedTools: [
        "Read", "Glob", "Grep", "WebSearch", "WebFetch",
        "Bash(raltic message send:*)",
        "Bash(raltic message check:*)",
        "Bash(raltic message read:*)",
        "Bash(raltic message search:*)",
        "Bash(raltic server info:*)",
        "Bash(raltic task list:*)",
        "Bash(raltic task create:*)",
        "Bash(raltic task claim:*)",
        "Bash(raltic task unclaim:*)",
        "Bash(raltic task update:*)",
      ],
      resumeKey,
      // Explicit allowlist instead of `...process.env`. Without this the
      // child agent inherits any secret the bridge process happened to
      // have in its env (SENTRY_DSN, AWS_*, user shell rc exports, etc.).
      // Each entry below has a documented reason — anything else gets
      // deliberately stripped before the runtime spawns its subprocess.
      env: buildAgentEnv({
        agentId,
        apiUrl: this.apiUrl,
        agentToken: this.boot.token,
        ralticBin: ralticDir,
        runContextFile: this.runContextPath(session),
      }),
    });

    const entry: AgentEntry = {
      runtime,
      session: rs,
      busy: false,
      currentRunId: undefined,
      currentRunError: undefined,
      messageQueue: [],
      unsubs: [],
    };

    entry.unsubs.push(rs.on("activity", (ev) => this._onActivity(agentId, session, ev)));
    entry.unsubs.push(rs.on("exit", (code) => {
      console.log(`  [${session.displayName}] runtime exited code=${code}`);
      const error = `runtime exited with code ${code ?? "unknown"}`;
      if (entry.currentRunId) {
        void this.updateRun(entry.currentRunId, "failed", { error });
        entry.currentRunId = undefined;
        entry.currentRunError = undefined;
        this.clearRunContext(session);
      }
      for (const queued of entry.messageQueue) {
        void this.updateRun(queued.runId, "failed", { error });
        queued.reject(new Error(error));
      }
      entry.messageQueue = [];
      // Drop the entry so the next sendToAgent re-spawns fresh.
      if (this.entries.get(agentId) === entry) this.entries.delete(agentId);
    }));

    this.broadcastActivity(agentId, "working", "Working", "Starting…");
    return entry;
  }

  /** Listener for runtime ActivityEvents. Dispatches the API POST and
   *  handles needs_restart by killing + respawning. */
  private _onActivity(agentId: string, session: AgentSession, ev: ActivityEvent): void {
    switch (ev.kind) {
      case "thinking":
        this.broadcastActivity(agentId, "thinking", "Thinking", "");
        return;
      case "working":
        this.broadcastActivity(agentId, "working", ev.label || ev.tool, ev.detail || "");
        return;
      case "text":
        // Both Claude + Codex emit FULL text per frame (replaces:true).
        // Surface as a "thinking" activity with the text in detail —
        // matches pre-refactor behavior where pendingText was flushed
        // with status="thinking".
        if (ev.text.trim()) this.broadcastActivity(agentId, "thinking", "", ev.text);
        return;
      case "turn_complete": {
        if (ev.sessionId) void this.saveSessionId(session, ev.sessionId);
        this.broadcastActivity(agentId, "idle", "Idle", "");
        const entry = this.entries.get(agentId);
        if (entry) {
          const runId = entry.currentRunId;
          const runError = entry.currentRunError;
          const outputMessageId = this.readRunContext(session, runId)?.outputMessageId ?? null;
          entry.currentRunId = undefined;
          entry.currentRunError = undefined;
          this.clearRunContext(session);
          if (runId) {
            const missingOutputError = outputMessageId
              ? null
              : "Agent turn completed without sending a visible Raltic message.";
            void this.updateRun(
              runId,
              runError || missingOutputError ? "failed" : "completed",
              runError
                ? { error: runError }
                : missingOutputError
                  ? { error: missingOutputError }
                  : { outputMessageId },
            );
          }
          entry.busy = false;
          console.log(`  [${session.displayName}] turn complete`);
          this.drainQueue(agentId);
        }
        return;
      }
      case "needs_restart":
        console.log(`  [${session.displayName}] runtime requested restart (${ev.reason})`);
        void this.restartForAgent(agentId);
        return;
      case "error":
        this.broadcastActivity(agentId, "error", "Error", ev.message.slice(0, 120));
        if (ev.terminal) {
          const entry = this.entries.get(agentId);
          if (entry?.currentRunId) entry.currentRunError = ev.message;
        }
        if (process.env.RALTIC_BRIDGE_VERBOSE) {
          console.error(`  [${session.displayName}] runtime error (${ev.reason ?? "other"}):`, ev.message);
        }
        return;
    }
  }

  private buildSystemPromptFor(session: AgentSession): string {
    const memoryPath = join(session.workDir, "MEMORY.md");
    const memoryContext = existsSync(memoryPath) ? readFileSync(memoryPath, "utf-8") : "";
    return buildSystemPrompt(
      {
        name: session.name,
        display_name: session.displayName,
        description: null,
        system_prompt: session.systemPrompt,
      },
      memoryContext,
    );
  }

  private effectivePermissionMode(_session: AgentSession): PermissionMode {
    if (PERM_ENV && (PERM_VALID as string[]).includes(PERM_ENV)) {
      const mode = PERM_ENV as PermissionMode;
      if (mode === "bypassPermissions") {
        console.warn(`  [perm] WARNING: bypassPermissions enabled — agents have unrestricted shell on this host.`);
      }
      return mode;
    }
    return "acceptEdits";
  }

  private async restartForAgent(agentId: string): Promise<void> {
    const session = this.sessions.get(agentId);
    const old = this.entries.get(agentId);
    if (!session || !old) return;

    // Pull the entry out of `entries` BEFORE awaiting shutdown — codex
    // review caught the prior ordering: while we awaited
    // old.session.shutdown(), any inbound WS message could still find
    // the entry via this.entries.get() and queue onto old.messageQueue.
    // The post-shutdown delete then dropped that queue along with the
    // messages. By rebinding to a `restarting` placeholder entry first,
    // every subsequent sendToAgent waits on the spawning promise of the
    // fresh entry, and messages queued during shutdown land on `fresh`.
    this.entries.delete(agentId);
    for (const unsub of old.unsubs) try { unsub(); } catch { /* swallow */ }

    const pending = [...old.messageQueue];
    old.messageQueue = [];

    const spawnFresh = (async () => {
      try { await old.session.shutdown(); } catch { /* swallow */ }
      const fresh = await this.spawnForAgent(agentId, session);
      if (this.sessions.get(agentId) !== session) {
        for (const queued of pending) queued.reject(new Error(`agent ${agentId} no longer managed by this bridge`));
        await this.disposeEntry(fresh, `agent ${agentId} no longer managed by this bridge`);
        throw new Error(`agent ${agentId} no longer managed by this bridge`);
      }
      fresh.messageQueue = [...pending, ...fresh.messageQueue];
      this.entries.set(agentId, fresh);
      return fresh;
    })().finally(() => {
      this.spawning.delete(agentId);
    });
    this.spawning.set(agentId, spawnFresh);
    await spawnFresh;
    console.log(`  [${session.displayName}] restart complete`);
  }

  private async stopAgent(agentId: string, reason: string): Promise<void> {
    this.sessions.delete(agentId);
    this.spawning.delete(agentId);
    const old = this.entries.get(agentId);
    if (!old) return;
    this.entries.delete(agentId);
    await this.disposeEntry(old, reason);
  }

  private async disposeEntry(entry: AgentEntry, reason: string): Promise<void> {
    if (entry.currentRunId) {
      await this.updateRun(entry.currentRunId, "failed", { error: reason });
      entry.currentRunId = undefined;
      entry.currentRunError = undefined;
    }
    for (const queued of entry.messageQueue) {
      void this.updateRun(queued.runId, "failed", { error: reason });
      queued.reject(new Error(reason));
    }
    entry.messageQueue = [];
    for (const unsub of entry.unsubs) try { unsub(); } catch { /* swallow */ }
    try { await entry.session.shutdown(); } catch { /* swallow */ }
  }

  /**
   * Write a `raltic` wrapper script into <workDir>/.raltic so the
   * agent's shell can invoke `raltic message send` etc. Runtime-agnostic
   * — both Claude (Bash tool) and Codex (built-in shell) inherit it via
   * PATH prepending.
   */
  private prepareCliTransport(_agentId: string, session: AgentSession): string {
    if (!this.boot) throw new Error("boot context not set");
    const ralticDir = join(session.workDir, ".raltic");
    if (!existsSync(ralticDir)) mkdirSync(ralticDir, { recursive: true });

    const wrapperPath = join(ralticDir, "raltic");
    const cliEntry = resolveCliEntry();
    if (!cliEntry) {
      throw new Error(
        "Could not locate @raltic/cli. The bridge requires @raltic/cli to be installed alongside it. " +
        "If you ran `npx -y @raltic/bridge`, the CLI should be a peer-installed dependency. " +
        "Try clearing the npx cache: `rm -rf ~/.npm/_npx` and re-run.",
      );
    }
    this.writeCliTokenFile(session);
    const tokenFile = join(ralticDir, "token");
    const tokenPrelude = `if [ -r '${shq(tokenFile)}' ]; then export RALTIC_AGENT_TOKEN="$(cat '${shq(tokenFile)}')"; fi\n`;
    const wrapperBody = cliEntry.kind === "compiled"
      ? `#!/usr/bin/env bash\n${tokenPrelude}exec '${shq(process.execPath)}' '${shq(cliEntry.entry)}' "$@"\n`
      : `#!/usr/bin/env bash\n${tokenPrelude}exec '${shq(process.execPath)}' '${shq(cliEntry.tsxPath)}' '${shq(cliEntry.entry)}' "$@"\n`;
    writeFileSync(wrapperPath, wrapperBody, { mode: 0o755 });
    return ralticDir;
  }

  private writeCliTokenFile(session: AgentSession): void {
    if (!this.boot) return;
    try {
      const ralticDir = join(session.workDir, ".raltic");
      if (!existsSync(ralticDir)) mkdirSync(ralticDir, { recursive: true });
      writeFileSync(join(ralticDir, "token"), this.boot.token, { mode: 0o600 });
    } catch (e) {
      if (process.env.RALTIC_BRIDGE_VERBOSE) {
        console.warn(`[agent ${session.id}] failed to refresh CLI token file:`, e instanceof Error ? e.message : e);
      }
    }
  }

  // ── Activity broadcast — POSTs to api ──

  private async broadcastActivity(agentId: string, activity: ActivityKind, label = "", detail = ""): Promise<void> {
    if (process.env.RALTIC_BRIDGE_VERBOSE) {
      console.log(`  [activity ${agentId.slice(0, 8)}] ${activity} ${label} ${detail.slice(0, 80)}`);
    }
    if (!this.boot) return;
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/agent-activity`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer sy_bridge_${this.boot.token}`,
        },
        body: JSON.stringify({ agentId, status: activity, label, detail }),
      });
      if (!res.ok && process.env.RALTIC_BRIDGE_VERBOSE) {
        console.warn("activity POST failed:", res.status, await res.text().catch(() => ""));
      }
    } catch (e) {
      if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("activity POST failed:", e);
    }
  }

  private runSourceForChannel(channelId: string): AgentRunSource {
    return this.channelTypes.get(channelId) === "dm" ? "dm" : "channel_message";
  }

  private runContextPath(session: AgentSession): string {
    return join(session.workDir, ".raltic", "current-run.json");
  }

  private writeRunContext(session: AgentSession, runId: string | undefined): void {
    const path = this.runContextPath(session);
    if (!runId) {
      this.clearRunContext(session);
      return;
    }
    try {
      const dir = dirname(path);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(path, JSON.stringify({ runId, outputMessageId: null }), { mode: 0o600 });
    } catch (e) {
      if (process.env.RALTIC_BRIDGE_VERBOSE) {
        console.warn(`[agent ${session.id}] failed to write run context:`, e instanceof Error ? e.message : e);
      }
    }
  }

  private readRunContext(session: AgentSession, runId: string | undefined): RunContext | null {
    if (!runId) return null;
    try {
      const raw = JSON.parse(readFileSync(this.runContextPath(session), "utf8")) as Partial<RunContext>;
      if (raw.runId !== runId) return null;
      return { runId, outputMessageId: raw.outputMessageId ?? null };
    } catch {
      return null;
    }
  }

  private clearRunContext(session: AgentSession): void {
    try { unlinkSync(this.runContextPath(session)); } catch { /* no active run context */ }
  }

  private runtimeUnavailableReason(session: AgentSession): string | null {
    if (!this.detectedRuntimes) return null;
    const rt = this.detectedRuntimes.find((r) => r.id === session.runtime);
    if (!rt || !rt.detected) {
      return `${session.runtime} CLI not installed on this laptop. Install ${session.runtime}, then restart the bridge.`;
    }
    if (rt.error) {
      return rt.error;
    }
    if (rt.authed === false) {
      return `${session.runtime} CLI not signed in. Run ${session.runtime} login, then restart the bridge.`;
    }
    return null;
  }

  private async createRun(agentId: string, channelId: string, message: MessageRow): Promise<string | undefined> {
    if (!this.boot) return undefined;
    try {
      const res = await fetch(`${this.apiUrl}/api/v1/agent-runs`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer sy_bridge_${this.boot.token}`,
        },
        body: JSON.stringify({
          agentId,
          channelId,
          source: this.runSourceForChannel(channelId),
          status: "queued",
          callerId: message.senderId,
          callerType: message.senderType === "agent" ? "agent" : "human",
          triggerMessageId: message.id,
          inputPreview: String(message.content ?? "").trim().slice(0, 500),
        }),
      });
      if (!res.ok) {
        if (process.env.RALTIC_BRIDGE_VERBOSE) {
          console.warn("agent run create failed:", res.status, await res.text().catch(() => ""));
        }
        return undefined;
      }
      const body = await res.json() as { run?: { id?: string } };
      return body.run?.id;
    } catch (e) {
      if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("agent run create failed:", e);
      return undefined;
    }
  }

  private async updateRun(
    runId: string | undefined,
    status: "running" | "completed" | "failed" | "cancelled",
    opts: { error?: string; outputMessageId?: string | null } = {},
  ): Promise<void> {
    if (!this.boot || !runId) return;
    const maxAttempts = status === "completed" && opts.outputMessageId
      ? RUN_OUTPUT_PATCH_RETRIES
      : 1;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(`${this.apiUrl}/api/v1/agent-runs/${runId}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer sy_bridge_${this.boot.token}`,
          },
          body: JSON.stringify({
            status,
            error: opts.error === undefined ? undefined : sanitizeUserVisibleError(opts.error),
            outputMessageId: opts.outputMessageId,
          }),
        });
        if (res.ok) return;
        const text = await res.text().catch(() => "");
        const retryableOutputLag = res.status === 400
          && text.includes("INVALID_OUTPUT_MESSAGE")
          && attempt < maxAttempts;
        if (retryableOutputLag) {
          await delay(RUN_OUTPUT_PATCH_RETRY_MS);
          continue;
        }
        if (process.env.RALTIC_BRIDGE_VERBOSE) {
          console.warn("agent run update failed:", res.status, text);
        }
        return;
      } catch (e) {
        if (attempt < maxAttempts) {
          await delay(RUN_OUTPUT_PATCH_RETRY_MS);
          continue;
        }
        if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("agent run update failed:", e);
        return;
      }
    }
  }

  /** Broadcast lifecycle for every tracked agent (called from bridge start/stop).
   *  When status="idle" (boot path), per-agent reconcile against the
   *  runtime snapshot: an agent declaring runtime=codex on a host with
   *  only Claude installed gets status=error + a label telling the user
   *  exactly what's missing. status="error" forces all agents offline
   *  (called from Bridge.stop). */
  public async broadcastLifecycle(status: "idle" | "error"): Promise<void> {
    if (!this.boot) return;
    await Promise.all(this.boot.agents.map((a) => {
      // For shutdown, always report error regardless of runtime state.
      if (status === "error") {
        return this.broadcastActivity(a.id, "error", "Offline", "")
          .catch((e) => {
            if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("activity POST failed:", e);
          });
      }
      const rt = this.detectedRuntimes?.find((r) => r.id === a.runtime);
      if (!rt || !rt.detected) {
        return this.broadcastActivity(
          a.id, "error",
          `${a.runtime} CLI not installed on this laptop`,
          `Install ${a.runtime} on this machine, then restart the bridge.`,
        ).catch((e) => {
          if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("activity POST failed:", e);
        });
      }
      if (rt.error) {
        return this.broadcastActivity(
          a.id, "error",
          `${a.runtime} unavailable`,
          rt.error,
        ).catch((e) => {
          if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("activity POST failed:", e);
        });
      }
      if (rt.authed === false) {
        return this.broadcastActivity(
          a.id, "error",
          `${a.runtime} CLI not signed in`,
          `Run \`${a.runtime} login\` on this laptop, then restart the bridge.`,
        ).catch((e) => {
          if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("activity POST failed:", e);
        });
      }
      return this.broadcastActivity(a.id, "idle", "Online", "")
        .catch((e) => {
          if (process.env.RALTIC_BRIDGE_VERBOSE) console.warn("activity POST failed:", e);
        });
    }));
  }

  /** Cached runtime detection snapshot from boot — read by
   *  broadcastLifecycle. Bridge.start passes this in via
   *  setDetectedRuntimes after calling detectRuntimes(). */
  private detectedRuntimes: DetectedRuntimeSnapshot[] | null = null;
  public setDetectedRuntimes(snap: DetectedRuntimeSnapshot[]): void {
    this.detectedRuntimes = snap;
  }

  // ── Session id persistence ──

  private sessionIdPath(session: AgentSession): string {
    // Per-runtime file so a Claude session-id doesn't get fed back to
    // Codex (or vice versa) after the user flips an agent's runtime.
    // The old filename `session_id` was runtime-agnostic — a runtime
    // swap would resume the wrong thread on next dispatch, failing
    // boot. Codex audit round-1 caught this (packages/bridge-core/src/
    // agent-manager.ts:473 in the original). File extension included
    // so the runtime suffix is unambiguous in a `ls` listing.
    return join(session.workDir, ".raltic", `session_id.${session.runtime}`);
  }
  /** Legacy path (pre-runtime-isolation). Read at load time as a
   *  fallback so existing bridges don't lose their threads on upgrade. */
  private legacySessionIdPath(session: AgentSession): string {
    return join(session.workDir, ".raltic", "session_id");
  }
  private async saveSessionId(session: AgentSession, sessionId: string): Promise<void> {
    try {
      const dir = join(session.workDir, ".raltic");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(this.sessionIdPath(session), sessionId);
    } catch (e) { console.error(`[saveSessionId] ${e}`); }
  }
  private async loadSessionId(session: AgentSession): Promise<string | null> {
    try {
      const p = this.sessionIdPath(session);
      if (existsSync(p)) return readFileSync(p, "utf-8").trim() || null;
      // Fallback to the pre-isolation filename for upgrade compat. If
      // it exists AND no runtime-specific file exists, treat it as the
      // legacy single-runtime thread. Migrate on next save.
      const legacy = this.legacySessionIdPath(session);
      if (existsSync(legacy)) return readFileSync(legacy, "utf-8").trim() || null;
      return null;
    } catch { return null; }
  }

  getWorkspaceDir(agentId: string): string | null {
    return this.sessions.get(agentId)?.workDir ?? null;
  }

  /**
   * Orphan workdir cleanup. Looks for directories under agentsDir whose
   * name isn't an active agent id AND whose mtime is older than the TTL.
   * Conservative — only removes orphans, never live agent dirs. Safe to
   * call periodically from a setInterval in Bridge.start.
   *
   * Why this matters:
   *   Bridge has been writing into `~/.raltic/agents/<agentId>/` since
   *   day one with no GC. Deleted agents leave behind their workdir
   *   forever — including any node_modules / .next / .turbo build
   *   outputs that Claude Code's "edit my repo" runs created. Real
   *   users have seen tens of GB accumulate.
   *
   * Default 72h TTL — generous enough that a temporarily-deleted agent
   * recreated under the same id would still find its workdir (covers
   * the "I deleted it by mistake" recovery window).
   */
  async gcOrphanWorkdirs(opts?: { ttlMs?: number }): Promise<{ removed: string[] }> {
    const ttl = opts?.ttlMs ?? 72 * 60 * 60 * 1000;
    const liveAgentIds = new Set(this.boot?.agents.map(a => a.id) ?? []);
    const removed: string[] = [];
    let entries: string[];
    try { entries = readdirSync(this.agentsDir); }
    catch { return { removed }; }
    for (const name of entries) {
      // Skip files (we only track per-agent subdirs) and any live agent.
      if (liveAgentIds.has(name)) continue;
      const p = join(this.agentsDir, name);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (!st.isDirectory()) continue;
      const ageMs = Date.now() - st.mtimeMs;
      if (ageMs < ttl) continue;
      try {
        rmSync(p, { recursive: true, force: true });
        removed.push(name);
      } catch (e) {
        console.warn(`[gc] failed to remove orphan workdir ${name}:`, e instanceof Error ? e.message : e);
      }
    }
    if (removed.length > 0) {
      console.log(`[gc] removed ${removed.length} orphan workdir(s) from ${this.agentsDir}`);
    }
    return { removed };
  }

  async shutdown(): Promise<void> {
    for (const [, entry] of this.entries) {
      for (const queued of entry.messageQueue) queued.reject(new Error("agent manager stopped"));
      entry.messageQueue = [];
      for (const unsub of entry.unsubs) try { unsub(); } catch { /* swallow */ }
      try { await entry.session.shutdown(); } catch { /* swallow */ }
    }
    this.entries.clear();
  }

  /** Detect runtimes installed on this bridge host. Each detect call is
   *  bounded by an internal timeout (3s) — a broken CLI install can't
   *  hang bridge boot. */
  async detectRuntimes() {
    const ids: RuntimeId[] = ["claude", "codex", "openclaw", "hermes"];
    const results = await Promise.all(
      ids.map(async (id) => {
        const r = this.runtimes[id];
        try {
          const detect = await this._withTimeout(r.detect(), 3500);
          if ("error" in detect && detect.error) {
            const installed = Boolean(detect.binary || detect.version);
            return {
              id,
              detected: installed,
              version: detect.version ?? null,
              authed: detect.authed ?? (installed ? false : null),
              authMethod: detect.authMethod ?? null,
              error: detect.error,
            };
          }
          return {
            id,
            detected: true,
            version: detect.version ?? null,
            authed: detect.authed ?? null,
            authMethod: detect.authMethod ?? null,
            error: null,
          };
        } catch (e) {
          return {
            id,
            detected: false,
            version: null,
            authed: null,
            authMethod: null,
            error: `detect failed: ${(e as Error).message.slice(0, 100)}`,
          };
        }
      }),
    );
    return results;
  }

  private async _withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return await Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms)),
    ]);
  }
}
