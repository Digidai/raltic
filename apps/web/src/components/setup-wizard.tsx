"use client";

import { type ComponentProps, useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, isExperimentalRuntime, type RuntimeId } from "@/lib/api";
import { getApiOrigin } from "@/lib/auth-client";
import { Button } from "@/components/heroui-pro/button";
import { Input } from "@/components/heroui-pro/input";
import { Card, CardHeader, CardTitle, CardDescription, CardPanel, CardFooter } from "@/components/heroui-pro/card";
import { Dialog, DialogPortal, DialogBackdrop, DialogPopup } from "@/components/heroui-pro/dialog";
import { Radio, RadioGroup } from "@/components/heroui-pro/radio";
import { Tabs, TabsList, TabsListContainer, TabsTrigger } from "@/components/heroui-pro/tabs";
import { Chip } from "@/components/heroui-pro/chip";
import { Alert, AlertDescription, AlertTitle } from "@/components/heroui-pro/alert";
import { KeyCommandBlock, MachineRow } from "@/components/settings-shared";
import { CheckCircle2, Circle, KeyRound, Terminal, MessageSquare, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  // CONTRACT: serverId/serverSlug identify the workspace the wizard
  // operates on. They MUST be the user's PERSONAL (owned) workspace
  // — NOT the currently-viewed workspace (which may be one the user is
  // merely invited to). Mixing those up is the root cause of the
  // "Olivia" production bug: an invitee ran the wizard on the inviter's
  // workspace, minted a machine_key bound to the inviter's serverId,
  // and her own workspace's agent stayed offline forever.
  //
  // Callers MUST resolve `me.personalServerId/Slug` first (see
  // /api/v1/me); never read from useParams() / current URL slug.
  serverId: string;
  serverSlug: string;
  /** True if the user already has a connected bridge for THIS workspace
   *  — wizard is being re-opened (e.g. from settings) to set up an
   *  additional computer. Drives a copy change so we don't pretend the
   *  user is brand-new. */
  hasExistingBridge?: boolean;
  /** True when a bridge exists but the personal workspace's starter
   *  agent is still cloud-mode. In that case the wizard should configure
   *  the existing bridge instead of issuing another key. */
  needsStarterAgentSetup?: boolean;
  /** Tone + framing of the wizard. "solo" is the brand-new-user path
   *  (default). "invite" reframes step 1 to acknowledge the user just
   *  joined someone else's workspace and explain WHY they still need
   *  to set up bridge in their OWN workspace (because the inviter's
   *  bridge handles only their inviter's agents). */
  flavor?: "solo" | "invite";
  /** Inviter workspace display name — only used when flavor === "invite"
   *  for the step-1 copy. */
  inviterWorkspaceName?: string;
  /** Called when user clicks the skip/close control or finishes step 4. */
  onDismiss?: () => void;
  /** Called once this wizard observes a bridge connection for serverId. */
  onBridgeConnected?: () => void;
}

/** Hard cap on bridge-connect polling — past this, surface a help panel
 *  instead of spinning forever. 4 minutes covers a slow `npm install` on
 *  a cold cache and the first `claude` auth dance. */
const BRIDGE_POLL_TIMEOUT_MS = 4 * 60_000;
const BRIDGE_POLL_INTERVAL_MS = 3_000;

/** sessionStorage key for resuming an in-progress wizard after a page
 *  refresh. We store ONLY the issued key's id (not its plaintext) — the
 *  user already copied the plaintext into their terminal; on resume we
 *  poll for connection without needing to re-show the secret. */
const RESUME_KEY_PREFIX = "raltic:wizard:resume:";
type RuntimeChipTone = NonNullable<ComponentProps<typeof Chip>["color"]>;

interface ResumeState {
  issuedKeyId: string;
  runtime?: RuntimeId;
  /** Display name shown in the resume notice — cosmetic only. */
  keyName?: string;
  /** When the previous wizard ran — drop entries older than 24h. */
  at: number;
}
const RESUME_TTL_MS = 24 * 60 * 60 * 1000;
const BRIDGE_RUNTIME_IDS = ["claude", "codex", "openclaw", "hermes"] as const satisfies readonly RuntimeId[];

function isBridgeRuntimeId(value: unknown): value is RuntimeId {
  return (BRIDGE_RUNTIME_IDS as readonly unknown[]).includes(value);
}

function readResume(serverId: string): ResumeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RESUME_KEY_PREFIX + serverId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ResumeState>;
    if (
      typeof parsed?.issuedKeyId !== "string" ||
      parsed.issuedKeyId.length === 0 ||
      typeof parsed.at !== "number" ||
      Date.now() - parsed.at > RESUME_TTL_MS
    ) {
      clearResume(serverId);
      return null;
    }
    const runtime = isBridgeRuntimeId(parsed.runtime) ? parsed.runtime : undefined;
    if (runtime && isExperimentalRuntime(runtime)) {
      clearResume(serverId);
      return null;
    }
    return {
      issuedKeyId: parsed.issuedKeyId,
      runtime,
      keyName: typeof parsed.keyName === "string" ? parsed.keyName : undefined,
      at: parsed.at,
    };
  } catch { return null; }
}
function writeResume(serverId: string, state: ResumeState): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(RESUME_KEY_PREFIX + serverId, JSON.stringify(state)); }
  catch { /* private mode — degrade gracefully */ }
}
function clearResume(serverId: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(RESUME_KEY_PREFIX + serverId); }
  catch { /* ignore */ }
}

const API_URL = getApiOrigin();

function defaultModelForRuntime(runtime: RuntimeId): string {
  switch (runtime) {
    case "claude":
      return "sonnet";
    case "codex":
      return "gpt-5.5";
    case "openclaw":
      return "auto";
    case "hermes":
      return "auto";
  }
}

function runtimeDisplayName(runtime: RuntimeId): string {
  switch (runtime) {
    case "claude":
      return "Claude Code";
    case "codex":
      return "OpenAI Codex";
    case "openclaw":
      return "OpenClaw";
    case "hermes":
      return "Hermes Agent";
  }
}

function runtimeTroubleshooting(runtime: RuntimeId): {
  title: string;
  versionCommand: string;
  installHint: string;
  loginCommand: string;
} {
  switch (runtime) {
    case "claude":
      return {
        title: "Claude CLI missing?",
        versionCommand: "claude --version",
        installHint: "npm install -g @anthropic-ai/claude-code",
        loginCommand: "claude",
      };
    case "codex":
      return {
        title: "Codex CLI missing?",
        versionCommand: "codex --version",
        installHint: "npm install -g @openai/codex",
        loginCommand: "codex login",
      };
    case "openclaw":
      return {
        title: "OpenClaw CLI or daemon missing?",
        versionCommand: "openclaw --version",
        installHint: "npm install -g openclaw",
        loginCommand: "openclaw onboard --install-daemon",
      };
    case "hermes":
      return {
        title: "Hermes CLI or daemon missing?",
        versionCommand: "hermes --version",
        installHint: "install from the Hermes docs",
        loginCommand: "hermes start",
      };
  }
}

/**
 * 4-step wizard shown to users who haven't connected a bridge yet:
 *   1. Runtime boundary — when local execution matters
 *   2. Create a runtime API key (one-shot reveal)
 *   3. Run the bridge command on the user's computer (with poll for connection)
 *   4. Send first workflow message
 */
export function SetupWizard({
  serverId, serverSlug, hasExistingBridge = false, needsStarterAgentSetup = false,
  flavor = "solo", inviterWorkspaceName, onDismiss, onBridgeConnected,
}: Props) {
  const router = useRouter();
  const helpPanelId = useId();
  const advancedRuntimesId = useId();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [keyName, setKeyName] = useState("My Mac");
  // Runtime choice made on step 1 — applied to the personal workspace's
  // Onboarding Assistant agent when the wizard completes (step 4). If
  // the user picks Codex, we PATCH the existing onboarding agent to
  // runtime=codex + model=gpt-5.5. Default stays Claude/Sonnet so users
  // who don't care (or don't have Codex installed) end up on the
  // best-supported path.
  const [runtime, setRuntime] = useState<"claude" | "codex" | "openclaw" | "hermes">("claude");
  // Tab selection on step 3 — quick npx (default + recommended), a
  // persistent install for users who want bridge to keep running after
  // they close the terminal, and a desktop-app link (placeholder until
  // the binary is published).
  const [installTab, setInstallTab] = useState<"quick" | "persistent" | "desktop">("quick");
  const [showAdvancedRuntimes, setShowAdvancedRuntimes] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  /** Track the issued key's id so "start over" can revoke it before
   *  issuing a new one — otherwise abandoned keys pile up forever. */
  const [issuedKeyId, setIssuedKeyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [configuringRuntime, setConfiguringRuntime] = useState(false);
  const [runtimeApplyError, setRuntimeApplyError] = useState<string | null>(null);
  const setRuntimeChoice = useCallback((next: typeof runtime) => {
    if (isExperimentalRuntime(next)) {
      setShowAdvancedRuntimes(true);
      setError("OpenClaw and Hermes are locked until smoke verification completes. Choose Claude Code or Codex for now.");
      return;
    }
    setRuntime(next);
    setError(null);
    setRuntimeApplyError(null);
    if (next === "openclaw" || next === "hermes") {
      setShowAdvancedRuntimes(true);
    }
  }, []);
  const advancedRuntimeSelected = runtime === "openclaw" || runtime === "hermes";
  const showAdvancedRuntimeChoices = showAdvancedRuntimes || advancedRuntimeSelected;
  const runtimeHelp = runtimeTroubleshooting(runtime);
  const needsExistingBridgeAgentConfig = hasExistingBridge && needsStarterAgentSetup;
  const shouldShowRuntimeSelector = !hasExistingBridge || needsExistingBridgeAgentConfig;
  // Per-machine snapshots captured from the bridge's `/connect`.
  // Populated when step 4 fires; refreshed by the step-4 background poll
  // so `codex login` mid-wizard becomes visible within 3s.
  const [detectedMachines, setDetectedMachines] = useState<import("@/lib/api").MachineRuntimeRow[]>([]);
  /** Wall-clock floor for "what counts as a NEW reply". Set when wizard
   *  mounts so we don't accept a pre-existing agent reply that landed
   *  before the user even opened the wizard (edge case: user DM'd before
   *  triggering the wizard via ?wizard=1). */
  const wizardOpenedAtRef = useRef<number>(Date.now());
  /** Indicates the wizard auto-resumed after a page refresh — show a
   *  short banner so the user understands why they jumped past Step 1/2. */
  const [resumed, setResumed] = useState(false);

  const finishBridgeSetup = useCallback(async (runtimeForSetup: RuntimeId) => {
    setRuntimeApplyError(null);
    setError(null);

    if (isExperimentalRuntime(runtimeForSetup)) {
      clearResume(serverId);
      setRuntime("claude");
      setShowAdvancedRuntimes(true);
      setRuntimeApplyError("OpenClaw and Hermes are locked until smoke verification completes. Choose Claude Code or Codex for now.");
      setStep(1);
      return;
    }

    if (hasExistingBridge && !needsStarterAgentSetup) {
      setConfiguringRuntime(false);
      clearResume(serverId);
      setBridgeOnline(true);
      setStep(4);
      onBridgeConnected?.();
      return;
    }

    setConfiguringRuntime(true);
    try {
      const { agents: all } = await api.listAgents();
      const onboarding = all.find(
        (a) => a.serverId === serverId && a.name === "onboarding",
      );
      if (!onboarding) {
        throw new Error("Onboarding agent not found. Open Settings -> Agents and create or repair the onboarding agent.");
      }
      await api.updateAgent(onboarding.id, {
        runtimeMode: "bridge",
        runtime: runtimeForSetup,
        model: defaultModelForRuntime(runtimeForSetup),
      });
      clearResume(serverId);
      setBridgeOnline(true);
      setStep(4);
      onBridgeConnected?.();
    } catch (e) {
      setRuntimeApplyError(
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e),
      );
    } finally {
      setConfiguringRuntime(false);
    }
  }, [hasExistingBridge, needsStarterAgentSetup, onBridgeConnected, serverId]);

  // ── Resume after refresh: if sessionStorage carries an in-progress
  // key id from this server, validate it server-side BEFORE jumping into
  // step 3. We need to handle:
  //   - key revoked externally → clear resume, don't auto-resume
  //   - key already used (bridge connected before refresh) → step 4 directly
  //   - key freshly issued, never used → step 3 with poll
  // Without the validation, a stale resume entry from a week ago whose
  // key was used long ago would false-positive into step 4 instantly.
  useEffect(() => {
    // When the user is explicitly setting up an additional computer (has
    // a working bridge already + landed via ?wizard=1), ignore any
    // stale resume entry from an abandoned earlier attempt — they want
    // a fresh key flow, not to continue someone else's progress.
    if (hasExistingBridge) {
      clearResume(serverId);
      return;
    }
    const r = readResume(serverId);
    if (!r) return;
    let cancelled = false;
    (async () => {
      try {
        const { keys } = await api.listMachineKeys({ serverId });
        if (cancelled) return;
        const k = keys.find(x => x.id === r.issuedKeyId);
        if (!k || k.revokedAt) {
          // Key gone or revoked — abandon the resume entry, let user
          // start fresh from step 1.
          clearResume(serverId);
          return;
        }
        setIssuedKeyId(r.issuedKeyId);
        setKeyName(r.keyName ?? "My Mac");
        const resumedRuntime = r.runtime ?? "claude";
        setRuntime(resumedRuntime);
        if (resumedRuntime === "openclaw" || resumedRuntime === "hermes") {
          setShowAdvancedRuntimes(true);
        }
        if (k.lastUsedAt) {
          // Already connected. Skip the poll, but still run the same
          // runtime-configuration gate as the fresh-connect path.
          setBridgeOnline(true);
          setDetectedMachines(k.machines ?? []);
          setResumed(true);
          setStep(3);
          void finishBridgeSetup(resumedRuntime);
          return;
        }
        // Just-issued, never used. Mark issued so the poll fires; the
        // Step-3 UI shows a "resumed" notice instead of the command panel
        // (we don't have the plaintext to re-display).
        // No plaintext to restore — `issued` stays null. The Step-3 UI
        // checks `resumed` to swap the command-panel for the resume notice.
        setResumed(true);
        setStep(3);
      } catch {
        // Network failure — leave resume entry alone, user can retry.
      }
    })();
    return () => { cancelled = true; };
  }, [serverId, hasExistingBridge, finishBridgeSetup]);
  // Step-3 polling state — `pollStartedAtRef` is a ref (not state) so
  // setting it doesn't tear down + recreate the interval. Reviews #1/#2
  // both flagged the original useState version as eating the first poll
  // cycle on its own re-render.
  const pollStartedAtRef = useRef<number | null>(null);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  // Default-OPEN troubleshooting block on step 3. Used to hide behind a
  // "Having trouble?" toggle that 95% of confused users never clicked;
  // surfacing the Node ≥ 20 / Claude CLI checks unconditionally cuts
  // the "why isn't this working" support load.
  const [showHelp, setShowHelp] = useState(true);
  // Step-4 detection — find the user-created onboarding DM channel +
  // poll for the first agent reply (proof end-to-end works).
  const [onboardingDmId, setOnboardingDmId] = useState<string | null>(null);
  const [firstReplySeen, setFirstReplySeen] = useState(false);
  const lastChannelMaxSeqRef = useRef<number>(0);

  // ── Step 3: poll for THIS specific key's bridge to connect. We check
  // `machineKeys.lastUsedAt` for the just-issued key id — NOT the
  // user-level `hasConnectedBridge` flag, which would short-circuit a
  // "set up another computer" flow because some other key is already
  // connected. Soft-cap at the timeout so we can surface help.
  useEffect(() => {
    // Either we just issued (have plaintext) OR we resumed (have id only).
    // Both cases are valid reasons to poll for the key's lastUsedAt.
    if (!(issued || resumed) || !issuedKeyId || bridgeOnline || step !== 3) return;
    if (pollStartedAtRef.current === null) pollStartedAtRef.current = Date.now();
    const startedAt = pollStartedAtRef.current;
    const t = setInterval(async () => {
      try {
        const { keys } = await api.listMachineKeys({ serverId });
        const me = keys.find(k => k.id === issuedKeyId);
        if (!me) {
          // Key disappeared (deleted / different account). Bail with an
          // explicit error rather than spinning forever.
          clearInterval(t);
          setError("Your runtime key was removed. Start over to issue a new one.");
          return;
        }
        if (me.revokedAt) {
          clearInterval(t);
          setError("Your runtime key was revoked. Start over to issue a new one.");
          return;
        }
        if (me.lastUsedAt) {
          setBridgeOnline(true);
          // Capture the latest detected machines for this key — wizard
          // step 4 renders a runtime strip from this. Polled every 3s
          // so a `codex login` in user's terminal shows up promptly.
          setDetectedMachines(me.machines ?? []);
          clearInterval(t);
          void finishBridgeSetup(runtime);
          return;
        }
        if (Date.now() - startedAt > BRIDGE_POLL_TIMEOUT_MS) {
          setPollTimedOut(true);
          // keep polling — bridge might come up after the user fixes the
          // env. We just stop hiding the help panel.
        }
      } catch { /* network blips are transient */ }
    }, BRIDGE_POLL_INTERVAL_MS);
    return () => clearInterval(t);
    // runtime + hasExistingBridge are read inside the bridge-online
    // branch when flipping the onboarding agent; including them as
    // deps keeps the effect honest if the user happens to change
    // runtime mid-poll (currently impossible from the UI, but the
    // lint contract still applies).
  }, [issued, resumed, issuedKeyId, bridgeOnline, step, serverId, runtime, finishBridgeSetup]);

  // ── Discover the seeded Onboarding DM channel id so step 4 can both
  // (a) deep-link the "Open the conversation" button and (b) actively
  // verify a real agent reply landed.
  useEffect(() => {
    if (step < 3) return;
    if (onboardingDmId) return;
    let cancelled = false;
    api.getServerBySlug(serverSlug).then((data) => {
      if (cancelled) return;
      // Onboarding-Assistant DM is the dm-type channel seeded with the
      // canonical name "onboarding-assistant" by runOnboarding().
      const dm = data.channels.find(c => c.type === "dm" && c.name === "onboarding-assistant");
      if (dm) {
        setOnboardingDmId(dm.id);
        lastChannelMaxSeqRef.current = dm.maxSeq ?? 0;
      }
    }).catch(() => { /* ignore — wizard still works with a generic CTA */ });
    return () => { cancelled = true; };
  }, [step, serverSlug, onboardingDmId]);

  // ── Step 4 detection: poll the onboarding DM for an agent reply that
  // is BOTH past our seq baseline AND created after the wizard opened.
  // The double check rules out "stale" agent replies that happened before
  // the user re-opened the wizard via ?wizard=1 — a real fresh reply has
  // to come after this session started.
  useEffect(() => {
    if (step !== 4 || firstReplySeen || !onboardingDmId) return;
    const t = setInterval(async () => {
      try {
        const data = await api.listMessages(onboardingDmId, { limit: 5 });
        const newAgentMsg = data.messages.find(
          m => m.senderType === "agent"
            && m.seq > lastChannelMaxSeqRef.current
            && new Date(m.createdAt).getTime() >= wizardOpenedAtRef.current,
        );
        if (newAgentMsg) {
          setFirstReplySeen(true);
          clearInterval(t);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(t);
  }, [step, firstReplySeen, onboardingDmId]);

  // ── Step 4 runtime refresh — re-pull this key's per-computer snapshots
  // every 3s so a `codex login` in user's terminal becomes visible
  // promptly. Stops when wizard closes (cleanup on step !== 4).
  useEffect(() => {
    if (step !== 4 || !issuedKeyId) return;
    const t = setInterval(async () => {
      try {
        const { keys } = await api.listMachineKeys({ serverId });
        const me = keys.find(k => k.id === issuedKeyId);
        // Only overwrite when we actually got machines back. Empty `[]`
        // from a transient API hiccup would otherwise stomp the rendered
        // strip and cause a flicker to "no runtimes detected".
        if (me?.machines && me.machines.length > 0) {
          setDetectedMachines(me.machines);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(t);
  }, [step, issuedKeyId, serverId]);

  async function createKey() {
    setCreating(true); setError(null);
    try {
      const res = await api.createMachineKey({ serverId, name: keyName.trim() || "My Mac" });
      setIssued(res.apiKey);
      setIssuedKeyId(res.id);
      setResumed(false);
      writeResume(serverId, { issuedKeyId: res.id, keyName: res.name, runtime, at: Date.now() });
      setStep(3);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally { setCreating(false); }
  }

  /** "Start over" path — revoke the abandoned key first so retried users
   *  don't accumulate a graveyard of valid-but-unused runtime keys (each
   *  one is a full bridge credential). Revoke failure is not safe to hide:
   *  a still-valid abandoned key means issuing another one would increase
   *  the account's credential surface. */
  async function startOverFromStep2() {
    if (restarting) return;
    setRestarting(true);
    setError(null);
    if (issuedKeyId) {
      try {
        await api.revokeMachineKey(issuedKeyId);
      }
      catch (e) {
        setError(
          e instanceof ApiError
            ? `Couldn't revoke the old runtime key: ${e.message}`
            : `Couldn't revoke the old runtime key: ${e instanceof Error ? e.message : String(e)}`,
        );
        setRestarting(false);
        return;
      }
    }
    clearResume(serverId);
    setIssued(null);
    setIssuedKeyId(null);
    setResumed(false);
    pollStartedAtRef.current = null;
    setPollTimedOut(false);
    setShowHelp(true);
    setBridgeOnline(false);     // safety: never short-circuit retry
    setRuntimeApplyError(null);
    setError(null);             // clear stale red toast from prior attempt
    setRestarting(false);
    setStep(2);
  }

  /** Strip `?wizard=1` so dismissing once-and-for-all doesn't keep
   *  re-prompting the user every time they return to the workspace home. */
  function handleDismiss() {
    if (typeof window !== "undefined" && window.location.search.includes("wizard=1")) {
      router.replace(`/s/${serverSlug}`);
    }
    onDismiss?.();
  }

  // Wizard uses the CLI's `setup` form so the key is persisted to
  // ~/.raltic/config.json and the bridge starts in the same command.
  // `--server-url` is omitted when it equals the prod default so the
  // copy-pastable line stays one screen wide for 95% of users; staging /
  // self-hosted setups still get the flag appended.
  const SERVER_URL_DEFAULT = "https://api.raltic.com";
  const quickCmd = issued
    ? API_URL === SERVER_URL_DEFAULT
      ? `npx -y @raltic/bridge setup ${issued}`
      : `npx -y @raltic/bridge setup ${issued} --server-url ${API_URL}`
    : "";
  const persistentInstall = `npm install -g @raltic/bridge@latest`;
  const persistentRun = issued
    ? API_URL === SERVER_URL_DEFAULT
      ? `raltic-bridge setup ${issued}`
      : `raltic-bridge setup ${issued} --server-url ${API_URL}`
    : "";
  const wizardTitle = needsExistingBridgeAgentConfig
    ? "Configure local runtime"
    : hasExistingBridge
    ? "Connect another local runtime"
    : flavor === "invite"
    ? "Bring YOUR agents into workflows"
    : "Connect a local runtime";
  const dismissLabel = hasExistingBridge ? "Close" : "Start without local runtime →";
  return (
    <Dialog open onOpenChange={(next) => { if (!next) handleDismiss(); }}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="sm:max-w-xl" showCloseButton={false} aria-label={wizardTitle}>
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 shadow-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {wizardTitle}
              </CardTitle>
              <Button
                type="button"
                onClick={handleDismiss}
                variant="ghost"
                size="xs"
                className="text-xs text-muted-foreground"
              >
                {dismissLabel}
              </Button>
            </div>
            <CardDescription>
              {flavor === "invite" ? (
                <>
                  You joined{" "}
                  <strong>{inviterWorkspaceName ?? "another workspace"}</strong>{" "}
                  — their agents are already online (their bridge handles those).
                  You can work there now; connect your own runtime only when your agents need local code, keys, or private tools.
                </>
              ) : (
                <>
                  Use this when a workflow needs local code, keys, or private tools.
                  Your first cloud workflow works without this; local agents join later through your bridge.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardPanel className="min-h-0 flex-1 overflow-y-auto">
            <ol className="space-y-3 text-sm">
              <Step n={1} active={step === 1} done={step > 1} title="Choose runtime boundary" />
              <Step n={2} active={step === 2} done={step > 2}
                title="Create a local runtime key" />
              <Step n={3} active={step === 3} done={step > 3}
                title={bridgeOnline ? "Local runtime connected ✓" : "Run the bridge on this computer"} />
              <Step n={4} active={step === 4 && !firstReplySeen} done={firstReplySeen}
                title={firstReplySeen ? "Local runtime reply received ✓" : "Verify local runtime"} />
            </ol>

            <Card render={<section />} className="mt-6 bg-[var(--surface-secondary)] !shadow-none">
              <CardPanel className="p-4">
              {step === 1 && (
                <div className="space-y-4 text-sm">
                  {hasExistingBridge && (
                    <Alert variant="info" className="text-xs">
                      {needsExistingBridgeAgentConfig ? (
                        <>
                          <AlertTitle>You already have a bridge connected.</AlertTitle>
                          <AlertDescription>
                            Raltic will use that bridge and move the onboarding agent to the runtime you pick. No new key is needed.
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertTitle>You already have a bridge connected.</AlertTitle>
                          <AlertDescription>
                            This will issue a new runtime key for an additional computer. Your existing
                            key + bridge keep working — agents are leader-elected so you won&apos;t double-reply.
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}

                  {/* Runtime selector — captures the user's choice upfront
                      so step 3's "do you have the right CLI installed?"
                      hint can be runtime-specific, and step 4's wrap-up
                      can PATCH the onboarding agent to the chosen runtime
                      via api.updateAgent. Defaults to Claude (best-tested
                      path); the toggle isn't shown when the user is
                      adding a SECOND computer (their agents already have a
                      runtime set). */}
                  {shouldShowRuntimeSelector && (
                    <div>
                      <p className="font-medium">Which runtime should power local workflows?</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Start with Claude Code or Codex. Advanced daemon runtimes are available if your team already operates them.
                      </p>
                      <RadioGroup
                        aria-label="AI runtime"
                        value={runtime}
                        onValueChange={(next) => setRuntimeChoice(next as typeof runtime)}
                        className="mt-2 space-y-2"
                      >
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <RuntimePick
                            id="claude"
                            title="Claude Code"
                            chip="Recommended"
                            chipTone="accent"
                            body="Anthropic Claude — Sonnet 4.6 default, also Opus/Haiku. Requires the claude CLI."
                            installHref="https://docs.claude.com/en/docs/claude-code/setup"
                          />
                          <RuntimePick
                            id="codex"
                            title="OpenAI Codex"
                            chip="Preview"
                            chipTone="warning"
                            body="OpenAI Codex — GPT-5.5 default. Requires the codex CLI logged in."
                            installHref="https://platform.openai.com/docs/codex/cli"
                          />
                        </div>
                        {showAdvancedRuntimeChoices && (
                          <div id={advancedRuntimesId} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {/* External-daemon runtimes — the user runs the
                                daemon themselves and Raltic just shells out
                                to its CLI. Marked "Advanced" because they
                                require a separate onboarding (multi-channel
                                routing for OpenClaw, skill marketplace for
                                Hermes) most new Raltic users don't need yet. */}
                            <RuntimePick
                              id="openclaw"
                              title="OpenClaw"
                              chip="Locked"
                              chipTone="default"
                              body="Experimental daemon runtime. Locked until the OpenClaw/Hermes smoke runbook passes."
                              installHref="https://github.com/openclaw/openclaw"
                              disabled
                            />
                            <RuntimePick
                              id="hermes"
                              title="Hermes Agent"
                              chip="Locked"
                              chipTone="default"
                              body="Experimental daemon runtime. Locked until the OpenClaw/Hermes smoke runbook passes."
                              installHref="https://hermes-agent.nousresearch.com/"
                              disabled
                            />
                          </div>
                        )}
                      </RadioGroup>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-controls={advancedRuntimesId}
                        aria-expanded={showAdvancedRuntimeChoices}
                        onClick={() => setShowAdvancedRuntimes((v) => !v)}
                        className="mt-2 w-full justify-start gap-1 text-left text-xs text-muted-foreground"
                      >
                        {showAdvancedRuntimeChoices ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Advanced daemon runtimes
                        {advancedRuntimeSelected && !showAdvancedRuntimes ? ` (${runtimeDisplayName(runtime)} selected)` : ""}
                      </Button>
                    </div>
                  )}

                  <Card render={<section />} className="bg-background !shadow-none">
                    <CardPanel className="p-3 text-xs">
                    <p className="font-medium">You&apos;ll need on this computer:</p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      <li>• <strong>Node ≥ 20</strong> — check with <code className="raltic-inline-token">node -v</code></li>
                      {runtime === "claude" && (
                        <li>
                          • The <a className="underline" href="https://docs.claude.com/en/docs/claude-code/setup" target="_blank" rel="noreferrer"><code className="raltic-inline-token">claude</code> CLI</a>{" "}
                          (logged in via <code className="raltic-inline-token">claude</code>)
                        </li>
                      )}
                      {runtime === "codex" && (
                        <li>
                          • The <a className="underline" href="https://platform.openai.com/docs/codex/cli" target="_blank" rel="noreferrer"><code className="raltic-inline-token">codex</code> CLI</a>{" "}
                          (logged in via <code className="raltic-inline-token">codex login</code>)
                        </li>
                      )}
                      {runtime === "openclaw" && (
                        <>
                          <li>
                            • The <a className="underline" href="https://github.com/openclaw/openclaw" target="_blank" rel="noreferrer"><code className="raltic-inline-token">openclaw</code> CLI</a>{" "}
                            installed via <code className="raltic-inline-token">npm i -g openclaw</code>
                          </li>
                          <li>
                            • Daemon running — start with{" "}
                            <code className="raltic-inline-token">openclaw onboard --install-daemon</code>
                          </li>
                        </>
                      )}
                      {runtime === "hermes" && (
                        <>
                          <li>
                            • The <a className="underline" href="https://hermes-agent.nousresearch.com/" target="_blank" rel="noreferrer"><code className="raltic-inline-token">hermes</code> CLI</a>{" "}
                            installed via the one-line curl on the site above
                          </li>
                          <li>
                            • Daemon running — start with <code className="raltic-inline-token">hermes start</code>, verify with <code className="raltic-inline-token">hermes status</code>
                          </li>
                        </>
                      )}
                    </ul>
                    </CardPanel>
                  </Card>

                  <Button
                    onClick={() => {
                      if (needsExistingBridgeAgentConfig) {
                        void finishBridgeSetup(runtime);
                        return;
                      }
                      setStep(2);
                    }}
                    loading={needsExistingBridgeAgentConfig && configuringRuntime}
                    className="mt-2"
                  >
                    {needsExistingBridgeAgentConfig ? "Use existing bridge" : hasExistingBridge ? "Issue a new runtime key" : "Continue"}
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3 text-sm">
                  <p>Pick a name for this local runtime — you&apos;ll see it in your settings.</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input aria-label="Runtime key name" value={keyName} onChange={(e) => setKeyName((e.target as HTMLInputElement).value)} placeholder="My Mac" className="min-w-0 flex-1" />
                    <Button onClick={createKey} loading={creating} className="w-full sm:w-auto">
                      <KeyRound className="mr-1 h-3.5 w-3.5" /> Issue key
                    </Button>
                  </div>
                  {error && <p className="text-danger-text">{error}</p>}
                  <p className="text-xs text-muted-foreground">
                    Keys are shown once. Treat them like passwords.
                  </p>
                </div>
              )}

              {step === 3 && (issued || resumed) && (
                <div className="space-y-3 text-sm">
                  {error && (
                    <Alert variant="error" className="text-xs">
                      <AlertTitle>Runtime key needs attention</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={restarting}
                          onClick={() => { void startOverFromStep2(); }}
                        >
                          Issue a fresh key
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {bridgeOnline && configuringRuntime && (
                    <Alert variant="info" className="text-xs">
                      <AlertTitle>Bridge connected. Configuring {runtimeDisplayName(runtime)}.</AlertTitle>
                      <AlertDescription>
                        Raltic is updating the onboarding agent to use the runtime you selected before opening the first workflow message.
                      </AlertDescription>
                    </Alert>
                  )}

                  {bridgeOnline && runtimeApplyError && (
                    <Alert variant="error" className="text-xs">
                      <AlertTitle>Bridge connected, but runtime setup failed.</AlertTitle>
                      <AlertDescription>
                        {runtimeApplyError}
                      </AlertDescription>
                      <AlertDescription className="mt-1">
                        Retry before sending the first workflow message so the onboarding assistant replies from {runtimeDisplayName(runtime)}.
                      </AlertDescription>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          size="sm"
                          loading={configuringRuntime}
                          onClick={() => { void finishBridgeSetup(runtime); }}
                        >
                          Retry runtime setup
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          loading={restarting}
                          onClick={() => { void startOverFromStep2(); }}
                        >
                          Start over with a new key
                        </Button>
                      </div>
                    </Alert>
                  )}

                  {bridgeOnline && !configuringRuntime && !runtimeApplyError && !error && (
                    <Alert variant="info" className="text-xs">
                      <AlertTitle>Bridge connected.</AlertTitle>
                      <AlertDescription>
                        Preparing the first workflow message step.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!bridgeOnline && !error && (
                    <>
                      {resumed ? (
                        <Alert variant="info" className="text-xs">
                          <AlertTitle>Resumed from a previous session</AlertTitle>
                          <AlertDescription>
                            We&apos;re watching for the bridge from runtime key{" "}
                            <code className="raltic-inline-token">{keyName}</code>.
                            Already pasted the command in your terminal? Just keep it running and we&apos;ll detect the connection.
                          </AlertDescription>
                          <AlertDescription className="mt-1">
                            Lost the command?{" "}
                            <Button
                              type="button"
                              variant="link"
                              size="xs"
                              loading={restarting}
                              className="h-auto px-0 py-0 text-xs"
                              onClick={() => { void startOverFromStep2(); }}
                            >
                              Start over to issue a fresh key
                            </Button>.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          {/* What the command DOES — three-bullet explainer
                              so users aren't pasting a black-box one-liner.
                              Lifted directly from a real install run so the
                              terms match what they'll see in their terminal. */}
                          <Alert variant="info" className="text-[11px]">
                            <AlertTitle>What this command does:</AlertTitle>
                            <AlertDescription>
                              <ul className="mt-1 space-y-0.5">
                                <li>1. Downloads <code className="raltic-inline-token">@raltic/bridge</code> via npx (no global install)</li>
                                <li>2. Registers this computer with your workspace using the runtime key below</li>
                                <li>3. Stays running in this terminal — watches for messages from your agents</li>
                              </ul>
                            </AlertDescription>
                          </Alert>

                          {/* Tabbed install surface. Quick is the default and
                              what 95% of users want; Persistent is for users
                              who want bridge to keep running after closing
                              terminal; Desktop points users to the installed
                              app's authenticated launch flow. */}
                          <Tabs
                            selectedKey={installTab}
                            onSelectionChange={(key) => setInstallTab(key as typeof installTab)}
                          >
                            <TabsListContainer className="py-1">
                              <TabsList
                                aria-label="Install method"
                                className="gap-1 rounded-xl border border-border bg-[var(--surface-secondary)] p-1"
                              >
                                {[
                                  { id: "quick" as const, label: "Quick (recommended)" },
                                  { id: "persistent" as const, label: "Persistent" },
                                  { id: "desktop" as const, label: "Desktop app" },
                                ].map((t) => {
                                  const active = installTab === t.id;
                                  return (
                                    <TabsTrigger
                                      key={t.id}
                                      id={t.id}
                                      className={cn(
                                        "h-8 rounded-[8px] border border-transparent px-2.5 text-xs transition-colors",
                                        active
                                          ? "border-accent/25 bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] shadow-xs"
                                          : "text-muted-foreground hover:bg-[var(--surface-tertiary)] hover:text-foreground",
                                      )}
                                    >
                                      {t.label}
                                    </TabsTrigger>
                                  );
                                })}
                              </TabsList>
                            </TabsListContainer>
                          </Tabs>

                          {installTab === "quick" && (
                            <>
                              <p className="text-xs">Open a terminal on this computer and run:</p>
                              <CopyableCommand cmd={quickCmd} />
                            </>
                          )}

                          {installTab === "persistent" && (
                            <div className="space-y-2 text-xs">
                              <p>Install once, then run anytime (also works as a launchd/systemd unit):</p>
                              <CopyableCommand cmd={persistentInstall} />
                              <p>Then start the bridge:</p>
                              <CopyableCommand cmd={persistentRun} />
                              <p className="text-muted-foreground">
                                Auto-start on login: see the README&apos;s launchd / systemd snippets.
                              </p>
                            </div>
                          )}

                          {installTab === "desktop" && (
                            <Card render={<section />} className="border-border/70 bg-[var(--surface-secondary)] !shadow-none">
                              <CardPanel className="p-3 text-xs">
                              <p className="font-medium">Desktop app</p>
                              <p className="mt-1 text-muted-foreground">
                                Open Raltic Desktop on this computer, sign in, then click
                                <span className="font-medium text-foreground"> Connect this computer</span>.
                                The app creates a workspace-scoped key and keeps the bridge
                                running from the menu bar.
                              </p>
                              </CardPanel>
                            </Card>
                          )}

                          {/* What success looks like — fake terminal preview
                              so the user has a visual to match against their
                              REAL terminal output. Without this they don&apos;t
                              know when to consider "it worked". */}
                          <Card
                            data-raltic-terminal-preview
                            render={<div />}
                            className="raltic-terminal-surface overflow-hidden shadow-overlay"
                          >
                            <CardPanel className="space-y-0.5 p-2.5 font-mono text-[10.5px] leading-relaxed">
                              <p className="raltic-terminal-line">$ {installTab === "persistent" ? "raltic-bridge setup ck_…" : quickCmd || "npx -y @raltic/bridge setup ck_…"}</p>
                              <p className="raltic-terminal-line">[bridge] starting</p>
                              <p className="raltic-terminal-line">[bridge]   server-url={API_URL}</p>
                              <p className="raltic-terminal-line">[bridge] runtime {runtime} ready</p>
                              <p className="raltic-terminal-line">[bridge] connected as user=… server=…</p>
                              <p className="raltic-terminal-success">[bridge] ready — waiting for messages</p>
                            </CardPanel>
                          </Card>
                        </>
                      )}
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Terminal className="h-3 w-3" />
                        Waiting for the bridge to connect…
                        <Chip size="sm" variant="soft" color="warning" className="ml-auto gap-1 text-[10px] uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--warning)]" aria-hidden="true" />
                          polling
                        </Chip>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Once it prints <code className="raltic-inline-token">[bridge] ready</code> the wizard will advance automatically.
                      </p>

                      {pollTimedOut && (
                        <Alert variant="warning" className="text-xs">
                          <AlertTitle className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Still waiting after 4 minutes — something&apos;s likely off.
                          </AlertTitle>
                          <AlertDescription>
                            We&apos;re still listening if it comes online. Check your terminal for any error output.
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button type="button"
                        onClick={() => setShowHelp(v => !v)}
                        variant="ghost"
                        size="sm"
                        aria-controls={helpPanelId}
                        aria-expanded={showHelp}
                        className="w-full justify-start gap-1 text-left text-xs text-muted-foreground">
                        {showHelp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Having trouble?
                      </Button>
                      {showHelp && (
                        <Card id={helpPanelId} render={<ul />} className="space-y-2 bg-background p-3 text-xs text-muted-foreground !shadow-none">
                          <li>
                            <strong className="text-foreground">Node ≥ 20 not installed?</strong>{" "}
                            Run <code className="raltic-inline-token">node -v</code>. If missing, install from{" "}
                            <a className="underline" href="https://nodejs.org" target="_blank" rel="noreferrer">nodejs.org</a>{" "}
                            or via Homebrew (<code className="raltic-inline-token">brew install node</code>).
                          </li>
                          <li>
                            <strong className="text-foreground">{runtimeHelp.title}</strong>{" "}
                            Run <code className="raltic-inline-token">{runtimeHelp.versionCommand}</code>. If missing,{" "}
                            <code className="raltic-inline-token">{runtimeHelp.installHint}</code>{" "}
                            then <code className="raltic-inline-token">{runtimeHelp.loginCommand}</code> once to finish setup.
                          </li>
                          <li>
                            <strong className="text-foreground">Stale npx cache?</strong>{" "}
                            Try <code className="raltic-inline-token">rm -rf ~/.npm/_npx</code> and re-run the command above.
                          </li>
                          <li>
                            <strong className="text-foreground">Key got pasted with extra characters?</strong>{" "}
                            Re-issue the key{" "}
                            <Button type="button" variant="link" size="xs" loading={restarting} className="h-auto px-0 py-0 text-xs"
                              onClick={() => { void startOverFromStep2(); }}>
                              (start over from step 2)
                            </Button>.
                          </li>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3 text-sm">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--success-soft-foreground)]" />
                    Your bridge is connected. Local agents can now join workflows from this machine.
                  </p>

                  {/* Per-computer runtime detection strip. Refreshes every
                      3s so users running `codex login` mid-wizard see
                      their state update without manual reload. Renders
                      ALL machines that have used this key (rare but
                      possible — same key on multiple computers). */}
                  {detectedMachines.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Detected runtimes
                      </p>
                      {detectedMachines.map((machine, idx) => (
                        <MachineRow key={machine.fingerprint ?? idx} machine={machine} />
                      ))}
                    </div>
                  )}

                  {firstReplySeen ? (
                    <p className="flex items-center gap-2 text-[var(--success-soft-foreground)]">
                      <CheckCircle2 className="h-4 w-4" />
                      Your agent just replied — end-to-end is working.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      To test local execution, open the onboarding DM and send a brief that mentions the local agent. You can also close this and start a cloud workflow from Start.
                    </p>
                  )}
                  <Button onClick={() => {
                    handleDismiss();
                    if (onboardingDmId) router.push(`/s/${serverSlug}/dm/${onboardingDmId}`);
                  }}>
                    <MessageSquare className="mr-1 h-3.5 w-3.5" />
                    {onboardingDmId ? "Open onboarding DM" : "Open my workspace"}
                  </Button>
                </div>
              )}
              </CardPanel>
            </Card>
          </CardPanel>
          <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            <span>Stuck? See <a className="underline" href="https://github.com/Digidai/raltic#self-hosting" target="_blank" rel="noreferrer">docs</a>.</span>
            <span>Step {step} of 4</span>
          </CardFooter>
          </Card>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

function CopyableCommand({ cmd }: { cmd: string }) {
  return <KeyCommandBlock cmd={cmd} />;
}

function Step({ n, active, done, title }: { n: number; active: boolean; done: boolean; title: string }) {
  return (
    <li className={"flex items-center gap-2 " + (active ? "font-medium" : done ? "text-muted-foreground" : "text-muted-foreground/60")}>
      {done ? <CheckCircle2 className="h-4 w-4 text-[var(--success-soft-foreground)]" /> :
        active ? <Circle className="h-4 w-4 text-foreground" /> :
        <Circle className="h-4 w-4" />}
      <span>Step {n}: {title}</span>
    </li>
  );
}

/** Radio card used on step 1 to pick a runtime (Claude vs Codex).
 *  Card-style instead of a tight radio so the body copy + chip explain
 *  the trade-off inline rather than burying it in a tooltip. */
function RuntimePick({
  id, title, chip, chipTone, body, installHref, disabled = false,
}: {
  id: string;
  title: string;
  chip: string;
  chipTone: RuntimeChipTone;
  body: string;
  installHref: string;
  disabled?: boolean;
}) {
  return (
    <Radio
      value={id}
      isDisabled={disabled}
      controlClassName="mt-0.5"
      className={cn("h-auto p-3 text-left hover:border-foreground/20", disabled && "opacity-75")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{title}</span>
        <Chip size="sm" variant="soft" color={chipTone} className="text-[9px] font-medium uppercase tracking-wider">
          {chip}
        </Chip>
      </div>
      <p className="text-[11px] text-muted-foreground">{body}</p>
      <a
        href={installHref}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[11px] text-muted-foreground underline hover:text-foreground"
      >
        Install instructions →
      </a>
    </Radio>
  );
}
