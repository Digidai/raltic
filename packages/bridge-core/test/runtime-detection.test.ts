import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BridgeConnectResponse } from "@raltic/protocol";
import type {
  AgentRuntime,
  ActivityEvent,
  DetectResult,
  DetectedRuntimeSnapshot,
  RuntimeId,
  RuntimeSession,
} from "@raltic/agent-runtime";
import { AgentManager } from "../src/agent-manager.js";

function fakeRuntime(id: RuntimeId, detectResult: DetectResult): AgentRuntime {
  return {
    id,
    displayName: id,
    capabilities: {
      models: ["auto"],
      defaultModel: "auto",
      permissionModes: ["default"],
      conversational: true,
      resumable: true,
      supportsShellTools: true,
    },
    detect: async () => detectResult,
    spawn: (): RuntimeSession => {
      throw new Error("runtime spawn should not be called in this test");
    },
  };
}

function setRuntimeRegistry(manager: AgentManager, runtimes: Record<RuntimeId, AgentRuntime>) {
  (manager as unknown as { runtimes: Record<RuntimeId, AgentRuntime> }).runtimes = runtimes;
}

function controllableRuntime(id: RuntimeId): {
  runtime: AgentRuntime;
  sent: string[];
  emit: (event: ActivityEvent) => void;
  runContextFile: () => string | undefined;
} {
  const sent: string[] = [];
  const activityListeners: Array<(event: ActivityEvent) => void> = [];
  let contextFile: string | undefined;
  return {
    sent,
    emit: (event) => {
      for (const cb of activityListeners) cb(event);
    },
    runContextFile: () => contextFile,
    runtime: {
      id,
      displayName: id,
      capabilities: {
        models: ["auto"],
        defaultModel: "auto",
        permissionModes: ["default"],
        conversational: true,
        resumable: true,
        supportsShellTools: true,
      },
      detect: async () => ({ binary: id, version: `${id} 1.0.0`, authed: true, authMethod: "oauth" }),
      spawn: (opts): RuntimeSession => {
        contextFile = opts.env.RALTIC_AGENT_RUN_FILE;
        return {
          pid: null,
          send: async (text: string) => { sent.push(text); },
          on: ((event: "activity" | "exit", cb: unknown) => {
            if (event === "activity") activityListeners.push(cb as (event: ActivityEvent) => void);
            return () => {};
          }) as RuntimeSession["on"],
          getResumeKey: () => null,
          shutdown: async () => {},
        };
      },
    },
  };
}

function bootContext(runtime: RuntimeId): BridgeConnectResponse {
  return {
    wsUrl: "wss://api.test/ws/user/user-1",
    token: "bridge-token",
    userId: "user-1",
    serverId: "srv-1",
    agents: [{
      id: "agent-1",
      name: "openclawbot",
      displayName: "OpenClaw Bot",
      systemPrompt: null,
      model: "auto",
      runtime,
    }],
    channels: [],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runtime detection snapshots", () => {
  it("keeps installed external-daemon runtimes detected when their daemon is offline", async () => {
    const manager = new AgentManager({
      apiUrl: "https://api.test",
      agentsDir: mkdtempSync(join(tmpdir(), "raltic-bridge-runtimes-")),
    });
    setRuntimeRegistry(manager, {
      claude: fakeRuntime("claude", { error: "claude CLI not installed" }),
      codex: fakeRuntime("codex", { binary: "codex", version: "codex 1.0.0", authed: true, authMethod: "oauth" }),
      openclaw: fakeRuntime("openclaw", {
        binary: "openclaw",
        version: "openclaw 0.4.0",
        authed: false,
        authMethod: "none",
        error: "openclaw gateway not running - run `openclaw onboard --install-daemon`",
      }),
      hermes: fakeRuntime("hermes", {
        binary: "hermes",
        version: "hermes 0.3.0",
        authed: false,
        authMethod: "none",
        error: "hermes daemon not running - try `hermes start`",
      }),
    });

    const runtimes = await manager.detectRuntimes();

    expect(runtimes).toContainEqual({
      id: "openclaw",
      detected: true,
      version: "openclaw 0.4.0",
      authed: false,
      authMethod: "none",
      error: "openclaw gateway not running - run `openclaw onboard --install-daemon`",
    });
    expect(runtimes).toContainEqual({
      id: "hermes",
      detected: true,
      version: "hermes 0.3.0",
      authed: false,
      authMethod: "none",
      error: "hermes daemon not running - try `hermes start`",
    });
  });

  it("surfaces daemon-offline errors instead of replacing them with install or login copy", async () => {
    const agentsDir = mkdtempSync(join(tmpdir(), "raltic-bridge-unavailable-"));
    try {
      const manager = new AgentManager({ apiUrl: "https://api.test", agentsDir });
      const boot = bootContext("openclaw");
      const snapshot: DetectedRuntimeSnapshot[] = [{
        id: "openclaw",
        detected: true,
        version: "openclaw 0.4.0",
        authed: false,
        authMethod: "none",
        error: "openclaw gateway not running - run `openclaw onboard --install-daemon`",
      }];
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
      vi.stubGlobal("fetch", fetchMock);

      manager.setBootContext(boot);
      manager.setDetectedRuntimes(snapshot);
      await manager.initAllAgents(boot.agents);

      await expect(manager.sendToAgent("agent-1", "hello", "run-1")).rejects.toThrow("openclaw gateway not running");

      const activityCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/v1/agent-activity"));
      const runPatchCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/api/v1/agent-runs/run-1"));
      expect(activityCall).toBeDefined();
      expect(runPatchCall).toBeDefined();

      const activityBody = JSON.parse(String(activityCall?.[1]?.body));
      const runPatchBody = JSON.parse(String(runPatchCall?.[1]?.body));
      expect(activityBody.label).toBe("Runtime unavailable");
      expect(activityBody.detail).toContain("openclaw gateway not running");
      expect(runPatchBody.status).toBe("failed");
      expect(runPatchBody.error).toContain("openclaw gateway not running");
      expect(runPatchBody.error).not.toContain("CLI not installed");
      expect(runPatchBody.error).not.toContain("CLI not signed in");
    } finally {
      rmSync(agentsDir, { recursive: true, force: true });
    }
  });

  it("marks a completed bridge run with the output message recorded by raltic message send", async () => {
    const agentsDir = mkdtempSync(join(tmpdir(), "raltic-bridge-output-"));
    try {
      const manager = new AgentManager({ apiUrl: "https://api.test", agentsDir });
      const boot = bootContext("claude");
      const runtime = controllableRuntime("claude");
      setRuntimeRegistry(manager, {
        claude: runtime.runtime,
        codex: fakeRuntime("codex", { error: "unused" }),
        openclaw: fakeRuntime("openclaw", { error: "unused" }),
        hermes: fakeRuntime("hermes", { error: "unused" }),
      });
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
      vi.stubGlobal("fetch", fetchMock);

      manager.setBootContext(boot);
      await manager.initAllAgents(boot.agents);
      await manager.sendToAgent("agent-1", "hello", "run-1");
      await vi.waitFor(() => expect(runtime.sent).toEqual(["hello"]));

      const runContextFile = runtime.runContextFile();
      expect(runContextFile).toBeDefined();
      writeFileSync(runContextFile!, JSON.stringify({ runId: "run-1", outputMessageId: "00000000-0000-4000-8000-000000000001" }));
      runtime.emit({ kind: "turn_complete", sessionId: "sess-1" });

      await vi.waitFor(() => {
        const finalPatch = fetchMock.mock.calls.find(([url, init]) => {
          const body = JSON.parse(String(init?.body ?? "{}")) as { status?: string };
          return String(url).endsWith("/api/v1/agent-runs/run-1") && body.status === "completed";
        });
        expect(finalPatch).toBeDefined();
      });
      const finalPatch = fetchMock.mock.calls.find(([url, init]) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as { status?: string };
        return String(url).endsWith("/api/v1/agent-runs/run-1") && body.status === "completed";
      });
      const body = JSON.parse(String(finalPatch?.[1]?.body));
      expect(body.outputMessageId).toBe("00000000-0000-4000-8000-000000000001");
    } finally {
      rmSync(agentsDir, { recursive: true, force: true });
    }
  });

  it("retries completion when the output message has not flushed to D1 yet", async () => {
    const agentsDir = mkdtempSync(join(tmpdir(), "raltic-bridge-output-retry-"));
    try {
      const manager = new AgentManager({ apiUrl: "https://api.test", agentsDir });
      const boot = bootContext("claude");
      const runtime = controllableRuntime("claude");
      setRuntimeRegistry(manager, {
        claude: runtime.runtime,
        codex: fakeRuntime("codex", { error: "unused" }),
        openclaw: fakeRuntime("openclaw", { error: "unused" }),
        hermes: fakeRuntime("hermes", { error: "unused" }),
      });
      let completionAttempts = 0;
      const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as { status?: string };
        if (body.status === "completed") {
          completionAttempts += 1;
          if (completionAttempts === 1) {
            return new Response(JSON.stringify({
              error: { code: "INVALID_OUTPUT_MESSAGE", message: "output message pending D1 flush" },
            }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      manager.setBootContext(boot);
      await manager.initAllAgents(boot.agents);
      await manager.sendToAgent("agent-1", "hello", "run-1");
      await vi.waitFor(() => expect(runtime.sent).toEqual(["hello"]));

      const runContextFile = runtime.runContextFile();
      expect(runContextFile).toBeDefined();
      writeFileSync(runContextFile!, JSON.stringify({ runId: "run-1", outputMessageId: "00000000-0000-4000-8000-000000000001" }));
      runtime.emit({ kind: "turn_complete", sessionId: "sess-1" });

      await vi.waitFor(() => expect(completionAttempts).toBe(2), { timeout: 2_000 });
      const completedPatches = fetchMock.mock.calls.filter(([_url, init]) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as { status?: string };
        return body.status === "completed";
      });
      expect(completedPatches).toHaveLength(2);
    } finally {
      rmSync(agentsDir, { recursive: true, force: true });
    }
  });

  it("fails a bridge run that reaches turn_complete without any visible output message", async () => {
    const agentsDir = mkdtempSync(join(tmpdir(), "raltic-bridge-no-output-"));
    try {
      const manager = new AgentManager({ apiUrl: "https://api.test", agentsDir });
      const boot = bootContext("claude");
      const runtime = controllableRuntime("claude");
      setRuntimeRegistry(manager, {
        claude: runtime.runtime,
        codex: fakeRuntime("codex", { error: "unused" }),
        openclaw: fakeRuntime("openclaw", { error: "unused" }),
        hermes: fakeRuntime("hermes", { error: "unused" }),
      });
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
      vi.stubGlobal("fetch", fetchMock);

      manager.setBootContext(boot);
      await manager.initAllAgents(boot.agents);
      await manager.sendToAgent("agent-1", "hello", "run-1");
      await vi.waitFor(() => expect(runtime.sent).toEqual(["hello"]));
      runtime.emit({ kind: "turn_complete", sessionId: "sess-1" });

      await vi.waitFor(() => {
        const finalPatch = fetchMock.mock.calls.find(([url, init]) => {
          const body = JSON.parse(String(init?.body ?? "{}")) as { status?: string };
          return String(url).endsWith("/api/v1/agent-runs/run-1") && body.status === "failed";
        });
        expect(finalPatch).toBeDefined();
      });
      const finalPatch = fetchMock.mock.calls.find(([url, init]) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as { status?: string };
        return String(url).endsWith("/api/v1/agent-runs/run-1") && body.status === "failed";
      });
      const body = JSON.parse(String(finalPatch?.[1]?.body));
      expect(body.error).toContain("without sending a visible Raltic message");
    } finally {
      rmSync(agentsDir, { recursive: true, force: true });
    }
  });
});
