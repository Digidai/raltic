"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { api, type Agent, type AgentRun, type Channel, type Server, type TaskRow } from "@/lib/api";
import { SetupWizard } from "@/components/setup-wizard";
import { BrandMonogram } from "@/components/brand";
import { notifyError, notifyThrown } from "@/lib/notify";
import { trackProductEvent } from "@/lib/product-tracking";
import { WORKFLOW_STARTERS, type WorkflowStarterKey, type WorkflowStarterTemplate } from "@/lib/workflow-starters";
import {
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GitPullRequest,
  LineChart,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface ServerStats {
  id: string;
  name: string;
  description: string | null;
  role?: Server["role"];
  agentCount: number;
  channelCount: number;
  roomCount: number;
  starterAgentId: string | null;
  localStarterAgentId: string | null;
  onboardingDmId: string | null;
  channels: ServerStatsChannel[];
}

interface PersonalRef {
  id: string;
  slug: string;
  name: string;
}

type ServerStatsChannel = Pick<Channel, "id" | "name" | "type" | "description" | "isMember"> & {
  agentIds: string[];
};

/**
 * 24h marker for users who explicitly skip runtime setup from the desktop
 * handoff or wizard close control. Keyed by PERSONAL workspace slug because
 * the wizard always targets the user's owned workspace.
 */
const WIZARD_SNOOZE_MS = 24 * 60 * 60 * 1000;
const SNOOZE_KEY_PREFIX = "raltic:wizard:snoozedUntil:";

function snoozeKey(userId: string, personalSlug: string): string {
  return `${SNOOZE_KEY_PREFIX}${userId}:${personalSlug}`;
}

function snoozeWizard(userId: string, personalSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(snoozeKey(userId, personalSlug), String(Date.now() + WIZARD_SNOOZE_MS));
  } catch { /* private browsing — ignore */ }
}

const STARTER_ICONS: Record<WorkflowStarterKey, LucideIcon> = {
  "customer-risk": LineChart,
  "launch-readiness": ClipboardCheck,
  "research-synthesis": Search,
  "code-review": GitPullRequest,
};

export default function ServerHomePage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const slug = params.slug as string;
  // `?wizard=1` lets users re-open the wizard explicitly (from settings,
  // from the banner, etc.) even after the bridge has connected.
  const forceWizard = sp.get("wizard") === "1";
  const skipBridgeSetup = sp.get("skipBridgeSetup") === "1";
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Per-workspace bridge state — true iff THIS workspace has a key that
  // has ever been used. NOT a user-level flag (that was the original bug).
  const [hasBridgeHere, setHasBridgeHere] = useState<boolean | null>(null);
  // True when this workspace has at least one runtime_mode='bridge'
  // agent — the only case where missing-bridge is a real problem.
  // Drives the new "soft nag vs hard nag" copy below.
  const [hasBridgeAgents, setHasBridgeAgents] = useState<boolean>(false);
  // Personal-workspace bridge state — true iff the user's OWN workspace
  // has a connected bridge. Drives the "Set up your bridge in
  // <Personal>" banner on invited workspaces.
  const [hasBridgeInPersonal, setHasBridgeInPersonal] = useState<boolean | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [personal, setPersonal] = useState<PersonalRef | null>(null);
  const [startingWorkflow, setStartingWorkflow] = useState<WorkflowStarterKey | null>(null);
  const [selectedStarterKey, setSelectedStarterKey] = useState<WorkflowStarterKey>("launch-readiness");
  const [tasks, setTasks] = useState<TaskRow[] | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRun[] | null>(null);
  const [workLoadError, setWorkLoadError] = useState<string | null>(null);

  // Is the user looking at their own personal workspace?
  const onPersonalWorkspace = stats != null && personal != null && stats.id === personal.id;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setStats(null);
    setWorkLoadError(null);
    setTasks(null);
    setAgentRuns(null);
    (async () => {
      try {
        // Resolve the current workspace first, then ask /me twice —
        // once scoped to this workspace, once scoped to the user's
        // personal workspace — so we can answer two distinct questions:
        //   (a) "is there a bridge serving the workspace I'm looking at?"
        //   (b) "does the user even have a bridge for their OWN agents?"
        // (a) drives the in-page CTA copy ("Pick an agent" vs banner).
        // (b) drives the wizard auto-pop on the personal page only.
        const data = await api.getServerBySlug(slug);
        if (cancelled) return;
        const [me, taskResult, runResult] = await Promise.all([
          api.me({ serverId: data.server.id }),
          api.listTasks({ serverId: data.server.id, limit: 200 }).then(
            (value) => ({ ok: true as const, value }),
            (error) => ({ ok: false as const, error }),
          ),
          api.listAgentRuns({ serverId: data.server.id, limit: 200 }).then(
            (value) => ({ ok: true as const, value }),
            (error) => ({ ok: false as const, error }),
          ),
        ]);
        if (cancelled) return;
        setStats(buildServerStats(data));
        const workErrors: string[] = [];
        if (taskResult.ok) {
          setTasks(taskResult.value.tasks);
        } else {
          setTasks(null);
          workErrors.push(`tasks: ${errorMessage(taskResult.error)}`);
        }
        if (runResult.ok) {
          setAgentRuns(runResult.value.runs);
        } else {
          setAgentRuns(null);
          workErrors.push(`agent runs: ${errorMessage(runResult.error)}`);
        }
        setWorkLoadError(workErrors.length > 0 ? workErrors.join("; ") : null);
        setHasBridgeHere(me.hasConnectedBridge);
        setUserId(me.subject.userId);

        // Personal workspace from /me; fall back to "the current workspace
        // if user owns it" if /me's resolver couldn't find one (extreme
        // edge case — runOnboarding always creates one).
        const personalRef: PersonalRef | null = me.personalServerId && me.personalServerSlug
          ? { id: me.personalServerId, slug: me.personalServerSlug, name: "your workspace" }
          : null;
        setPersonal(personalRef);

        // If we're already on personal, hasBridgeHere is the answer.
        // Otherwise fetch a second /me scoped to personal.
        let personalBridge: boolean | null = me.hasConnectedBridge;
        if (personalRef && personalRef.id !== data.server.id) {
          try {
            const me2 = await api.me({ serverId: personalRef.id });
            if (cancelled) return;
            personalBridge = me2.hasConnectedBridge;
          } catch {
            personalBridge = null;
          }
        }
        setHasBridgeInPersonal(personalBridge);

        // Runtime setup is explicit. The Start page is the PLG first-value
        // surface; users should not be interrupted by local runtime setup
        // just because a workspace contains a bridge-mode agent. We still
        // show the runtime boundary panel below, and explicit `?wizard=1`
        // or a local-runtime starter opens the wizard when needed.
        const amOnPersonal = personalRef && personalRef.id === data.server.id;
        const hasBridgeAgentHere = data.agents?.some(a => (a as { runtimeMode?: string }).runtimeMode === "bridge") ?? false;
        setHasBridgeAgents(hasBridgeAgentHere);
        if (forceWizard) {
          setWizardOpen(true);
        } else if (skipBridgeSetup) {
          if (amOnPersonal && personalRef) snoozeWizard(me.subject.userId, personalRef.slug);
          setWizardOpen(false);
        }
      } catch (e) {
        if (!cancelled) {
          setStats(null);
          setLoadError(errorMessage(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, forceWizard, skipBridgeSetup]);

  function handleWizardDismiss() {
    setWizardOpen(false);
    if (!forceWizard && userId && personal) snoozeWizard(userId, personal.slug);
  }

  const handleBridgeConnected = useCallback(() => {
    setHasBridgeInPersonal(true);
    if (onPersonalWorkspace) setHasBridgeHere(true);
  }, [onPersonalWorkspace]);

  async function ensureCloudStarterAgentId(): Promise<string | null> {
    if (!stats) return null;
    if (stats.starterAgentId) return stats.starterAgentId;

    if (stats.role !== "owner") {
      notifyError(
        "Cloud starter agent is missing",
        "Ask a workspace owner to restore the Onboarding Assistant before starting a cloud workflow.",
      );
      return null;
    }

    try {
      await api.seedServer(stats.id, { force: true });
      const refreshed = await api.getServerBySlug(slug);
      const nextStats = buildServerStats(refreshed);
      setStats(nextStats);
      if (nextStats.starterAgentId) return nextStats.starterAgentId;
      notifyError(
        "Cloud starter agent is missing",
        "Raltic tried to restore the Onboarding Assistant, but no cloud agent is available yet.",
      );
      return null;
    } catch (e) {
      notifyThrown("Couldn't prepare cloud starter agent", e);
      return null;
    }
  }

  function ensureLocalStarterAgentId(): string | null {
    if (!stats) return null;
    if (stats.localStarterAgentId) return stats.localStarterAgentId;
    notifyError(
      "Local runtime agent is missing",
      "Connect a local runtime from Start or Settings -> Runtimes before starting a code-review workflow.",
    );
    return null;
  }

  async function resolveStarterAgentId(starter: WorkflowStarterTemplate): Promise<string | null> {
    if (starter.requiresLocalRuntime) return ensureLocalStarterAgentId();
    if (stats?.starterAgentId) return stats.starterAgentId;
    if (hasBridgeHere && stats?.localStarterAgentId) return stats.localStarterAgentId;
    return ensureCloudStarterAgentId();
  }

  async function ensureStarterAgentMembership(channel: ServerStatsChannel, agentId: string | null): Promise<void> {
    if (!agentId || channel.agentIds.includes(agentId)) return;
    await api.addChannelMembers(channel.id, { agentIds: [agentId] });
    setStats((prev) => prev ? {
      ...prev,
      channels: prev.channels.map((c) => c.id === channel.id
        ? { ...c, agentIds: Array.from(new Set([...c.agentIds, agentId])) }
        : c),
    } : prev);
  }

  async function startWorkflowRoom(starter: WorkflowStarterTemplate) {
    if (!stats || startingWorkflow) return;
    trackProductEvent("workflow_starter_click", starter.key);
    const existing = stats.channels.find((c) => c.type !== "dm" && c.name === starter.channelName);

    setStartingWorkflow(starter.key);
    try {
      const starterAgentId = await resolveStarterAgentId(starter);
      if (!starterAgentId) return;

      let channelId: string;
      if (existing && existing.isMember !== false) {
        await ensureStarterAgentMembership(existing, starterAgentId);
        channelId = existing.id;
        trackProductEvent("workflow_room_opened", starter.key);
      } else if (existing) {
        await api.joinChannel(existing.id);
        await ensureStarterAgentMembership(existing, starterAgentId);
        channelId = existing.id;
        trackProductEvent("workflow_room_joined", starter.key);
      } else {
        const res = await api.createChannel({
          serverId: stats.id,
          name: starter.channelName,
          description: starter.description,
          type: starter.type,
          initialAgentIds: starterAgentId ? [starterAgentId] : undefined,
        });
        channelId = res.id;
        trackProductEvent("workflow_room_created", starter.key);
      }
      window.dispatchEvent(new CustomEvent("raltic:channels-changed"));
      router.push(`/s/${slug}/channel/${channelId}?starter=${starter.key}`);
    } catch (e) {
      notifyThrown("Couldn't start workflow", e);
    } finally {
      setStartingWorkflow(null);
    }
  }

  if (loading) return <div className="flex flex-1 items-center justify-center"><div className="text-sm text-muted-foreground">Loading…</div></div>;
  if (loadError) return <div className="flex flex-1 items-center justify-center px-6"><div className="max-w-md rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">Workspace unavailable: {loadError}</div></div>;
  if (!stats) return <div className="flex flex-1 items-center justify-center"><div className="text-sm text-muted-foreground">Workspace not found</div></div>;

  const workDataUnavailable = tasks === null || agentRuns === null || workLoadError !== null;
  const workflowSnapshots = buildWorkflowSnapshots(stats.channels, tasks ?? [], agentRuns ?? []);
  const attentionWorkflows = workflowSnapshots
    .filter((workflow) => workflow.needsAttention)
    .slice(0, 4);
  const runningWorkflows = workflowSnapshots
    .filter((workflow) => workflow.activeRuns > 0 && !workflow.needsAttention)
    .slice(0, 4);
  const continueWorkflows = workflowSnapshots
    .filter((workflow) => !workflow.needsAttention && workflow.activeRuns === 0)
    .slice(0, 4);
  const defaultStarter = WORKFLOW_STARTERS.find((starter) => starter.key === "launch-readiness") ?? WORKFLOW_STARTERS[0]!;
  const selectedStarter = WORKFLOW_STARTERS.find((starter) => starter.key === selectedStarterKey) ?? defaultStarter;
  const selectedState = starterState(stats.channels, selectedStarter);

  function handleStarterAction(starter: WorkflowStarterTemplate) {
    if (starter.requiresLocalRuntime && !hasBridgeHere) {
      trackProductEvent("workflow_starter_runtime_gate_opened", starter.key);
      setWizardOpen(true);
      return;
    }
    void startWorkflowRoom(starter);
  }

  function handleStarterSelect(starter: WorkflowStarterTemplate) {
    setSelectedStarterKey(starter.key);
    trackProductEvent("workflow_starter_match_selected", starter.key);
  }

  return (
    <div className="relative h-full w-full min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card className="overflow-hidden">
            <CardPanel className="p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <BrandMonogram letter={stats.name} size="lg" className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <Chip size="sm" variant="soft" color="accent" className="font-mono text-[10px] uppercase tracking-wider">
                    Start in 3 minutes
                  </Chip>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Pick one workflow and make the agent work visible.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Choose the business outcome you own, send the starter brief, and review what the agent does next inside {stats.name}.
                    <span className="block pt-1">
                      Start on cloud; bring local runtimes later when private code, keys, or customer context matter.
                    </span>
                  </p>
                  {stats.description && (
                    <p className="mt-3 text-xs text-muted-foreground">{stats.description}</p>
                  )}
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      onClick={() => handleStarterAction(selectedStarter)}
                      loading={startingWorkflow === selectedStarter.key}
                      disabled={startingWorkflow !== null}
                      className="w-full justify-center sm:w-auto"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {selectedState === "member" ? "Open selected workflow" : selectedState === "joinable" ? "Join selected workflow" : selectedStarter.requiresLocalRuntime && !hasBridgeHere ? "Connect runtime" : "Start selected workflow"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    {stats.onboardingDmId && (
                      <Button
                        render={<Link href={`/s/${slug}/dm/${stats.onboardingDmId}`} />}
                        variant="outline"
                        className="w-full justify-center sm:w-auto"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Ask the onboarding agent
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardPanel>
          </Card>

          <div className="rounded-xl border border-border bg-surface/80 p-4 shadow-surface">
            <div className="grid gap-2">
              <WorkflowStep icon={<FileText className="h-4 w-4" />} label="1. Pick" body="Choose a business starter, not an empty chat." />
              <WorkflowStep icon={<Sparkles className="h-4 w-4" />} label="2. Send" body="Use the starter brief and send the first message." />
              <WorkflowStep icon={<ShieldCheck className="h-4 w-4" />} label="3. Prove" body="Review the first proof before the workflow becomes repeatable." />
            </div>
          </div>
        </header>

        {workDataUnavailable && (
          <WorkSignalsWarning message={workLoadError ?? "Work signals are still loading."} />
        )}

        <section aria-labelledby="starter-workflows-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                First value
              </p>
              <h2 id="starter-workflows-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Start with one workflow your team can finish today.
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Pick the outcome first. Raltic creates the room, keeps the agent run visible, and leaves the approval decision with a human.
              </p>
            </div>
            {stats.onboardingDmId && (
              <Button
                render={<Link href={`/s/${slug}/dm/${stats.onboardingDmId}`} />}
                variant="outline"
                size="sm"
                className="w-full justify-center sm:w-auto"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Ask which workflow to start
              </Button>
            )}
          </div>

          <StarterChooser
            starters={WORKFLOW_STARTERS}
            selectedKey={selectedStarter.key}
            onSelect={handleStarterSelect}
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {WORKFLOW_STARTERS.map((starter) => (
              <WorkflowStarterCard
                key={starter.key}
                starter={starter}
                hasLocalRuntime={Boolean(hasBridgeHere)}
                selected={starter.key === selectedStarter.key}
                state={starterState(stats.channels, starter)}
                loading={startingWorkflow === starter.key}
                disabled={startingWorkflow !== null}
                onStart={() => handleStarterAction(starter)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="workflow-command-heading" className="grid gap-3 lg:grid-cols-2">
          <WorkflowFocusPanel
            id="workflow-command-heading"
            title="Needs attention"
            description="Review gates, blocked runs, and failed agent work that should not get buried in chat."
            empty={workDataUnavailable ? "Work signals are unavailable; attention status cannot be confirmed." : "No review gates, blocked runs, or failed runs in visible workflows."}
            items={attentionWorkflows}
            slug={slug}
            countLabel={workDataUnavailable ? "?" : undefined}
          />
          <WorkflowFocusPanel
            title="Running work"
            description="Agent runs currently queued, dispatched, or running across your workflow rooms."
            empty={workDataUnavailable ? "Work signals are unavailable; running status cannot be confirmed." : "No agent runs are active right now."}
            items={runningWorkflows}
            slug={slug}
            countLabel={workDataUnavailable ? "?" : undefined}
          />
        </section>

        <WorkflowFocusPanel
          title="Continue workflows"
          description="Open and ready workflows that can receive the next brief, agent run, or approval decision."
          empty={workDataUnavailable ? "Work signals are unavailable; ready workflows cannot be confirmed." : "No open workflow rooms yet. Start with one of the templates below."}
          items={continueWorkflows}
          slug={slug}
          countLabel={workDataUnavailable ? "?" : undefined}
        />

        {onPersonalWorkspace ? (
          <RuntimeBoundaryPanel
            hasBridgeHere={Boolean(hasBridgeHere)}
            hasBridgeAgents={hasBridgeAgents}
            onOpenWizard={() => setWizardOpen(true)}
          />
        ) : (
          <Card className="bg-surface/80">
            <CardPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">You joined this workspace.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start from an existing workflow, or create one for the work you own here.
                </p>
              </div>
              {personal && hasBridgeInPersonal === false && (
                <Button
                  render={<Link href={`/s/${personal.slug}?wizard=1`} />}
                  variant="outline"
                  size="sm"
                  className="w-full justify-center sm:w-auto"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent-soft-foreground)]" />
                  Connect local runtime in your workspace
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Button>
              )}
            </CardPanel>
          </Card>
        )}

      </div>

      {/* Wizard ALWAYS targets the user's PERSONAL workspace, regardless
          of how it was opened (auto-pop OR explicit ?wizard=1). The
          earlier version had a "legacy ?wizard=1 retargets to current
          workspace" branch — that re-introduced the Olivia bug: an
          invitee clicking the Settings → Keys "re-open wizard" link
          on the inviter's workspace would mint a key bound to the
          inviter's serverId, exactly the failure mode the whole
          personal/owned-workspace work was supposed to prevent. The
          legacy per-workspace re-onboarding affordance can come back
          as its own dedicated /workspaces/:id/setup route if we ever
          actually need it. */}
      {wizardOpen && personal && (
        <SetupWizard
          serverId={personal.id}
          serverSlug={personal.slug}
          hasExistingBridge={hasBridgeInPersonal ?? false}
          // "invite" flavor only when the user is currently looking at
          // an invited workspace (i.e. not the personal one). Drives
          // step-1 copy referencing the inviter's workspace name.
          flavor={onPersonalWorkspace ? "solo" : "invite"}
          inviterWorkspaceName={stats.name}
          onDismiss={handleWizardDismiss}
          onBridgeConnected={handleBridgeConnected}
        />
      )}
    </div>
  );
}

function WorkSignalsWarning({ message }: { message: string }) {
  return (
    <Card className="border-warning/30 bg-[var(--warning-soft)] !shadow-none">
      <CardPanel className="flex items-start gap-3 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning-soft-foreground)]" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Work signals unavailable</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-words">
            Raltic could not confirm current tasks or agent runs. Workflow status is unknown until this reloads.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground break-words">{message}</p>
        </div>
      </CardPanel>
    </Card>
  );
}

function pickCloudStarterAgentId(agents: Agent[]): string | null {
  const cloudAgents = agents.filter((agent) => agent.runtimeMode === "raltic");
  return (
    cloudAgents.find((agent) => agent.name === "onboarding")
    ?? cloudAgents.find((agent) => agent.isDefault)
    ?? cloudAgents[0]
  )?.id ?? null;
}

function pickLocalStarterAgentId(agents: Agent[]): string | null {
  const bridgeAgents = agents.filter((agent) => agent.runtimeMode === "bridge");
  return (
    bridgeAgents.find((agent) => agent.name === "onboarding")
    ?? bridgeAgents.find((agent) => agent.isDefault)
    ?? bridgeAgents[0]
  )?.id ?? null;
}

function buildServerStats(data: { server: Server; channels: Channel[]; agents: Agent[] }): ServerStats {
  const workflowChannels = data.channels.filter((channel) =>
    channel.type !== "dm" && channel.isMember !== false && !isSystemOnboardingWorkflow(channel)
  );
  return {
    id: data.server.id,
    name: data.server.name,
    description: data.server.description,
    role: data.server.role,
    agentCount: data.agents.length,
    channelCount: data.channels.length,
    roomCount: workflowChannels.filter((c) => c.type !== "dm").length,
    starterAgentId: pickCloudStarterAgentId(data.agents),
    localStarterAgentId: pickLocalStarterAgentId(data.agents),
    onboardingDmId: data.channels.find((c) => c.type === "dm" && c.name === "onboarding-assistant")?.id ?? null,
    channels: data.channels.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      description: c.description,
      isMember: c.isMember,
      agentIds: c.agentIds ?? [],
    })),
  };
}

function starterState(channels: ServerStats["channels"], starter: WorkflowStarterTemplate): "member" | "joinable" | "new" {
  const existing = channels.find((channel) => channel.type !== "dm" && channel.name === starter.channelName);
  if (!existing) return "new";
  return existing.isMember === false ? "joinable" : "member";
}

function StarterChooser({
  starters,
  selectedKey,
  onSelect,
}: {
  starters: WorkflowStarterTemplate[];
  selectedKey: WorkflowStarterKey;
  onSelect: (starter: WorkflowStarterTemplate) => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface/70 p-3 shadow-surface" role="group" aria-label="Workflow outcome picker">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Choose by outcome</p>
          <p className="mt-1 text-sm font-medium text-foreground">What should the agent help your team prove first?</p>
        </div>
        <p className="text-xs text-muted-foreground">This only changes the starter; it never creates a room until you click Start.</p>
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {starters.map((starter) => {
          const selected = starter.key === selectedKey;
          return (
            <button
              key={starter.key}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(starter)}
              className={[
                "min-h-[104px] rounded-lg border px-3 py-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                selected
                  ? "border-accent bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]"
                  : "border-border bg-background/70 text-foreground hover:border-accent/30 hover:bg-background",
              ].join(" ")}
            >
              <span className="block text-sm font-semibold">{starter.selectorLabel}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{starter.selectorBody}</span>
              <span className="mt-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {starter.firstProof}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowStep({ icon, label, body }: { icon: React.ReactNode; label: string; body: string }) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-3 rounded-lg border border-border bg-background/70 p-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-accent/15 bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{body}</span>
      </span>
    </div>
  );
}

function WorkflowStarterCard({
  starter,
  hasLocalRuntime,
  selected,
  state,
  loading,
  disabled,
  onStart,
}: {
  starter: WorkflowStarterTemplate;
  hasLocalRuntime: boolean;
  selected: boolean;
  state: "member" | "joinable" | "new";
  loading: boolean;
  disabled: boolean;
  onStart: () => void;
}) {
  const Icon = STARTER_ICONS[starter.key];
  const runtimePending = starter.requiresLocalRuntime && !hasLocalRuntime;
  const existing = state === "member";
  const joinable = state === "joinable";
  return (
    <article
      aria-label={`${starter.title} workflow starter`}
      className={[
        "flex min-h-[396px] flex-col rounded-xl border bg-surface/80 p-4 shadow-surface transition-colors hover:border-accent/25",
        selected ? "border-accent/70 ring-1 ring-accent/20" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-[var(--accent-soft-foreground)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {selected && (
            <Chip size="sm" variant="soft" color="accent" className="font-mono text-[10px] uppercase tracking-wider">
              selected
            </Chip>
          )}
          <Chip size="sm" variant="soft" color={starter.type === "private" ? "default" : "accent"} className="font-mono text-[10px] uppercase tracking-wider">
            {runtimePending ? "local runtime" : starter.type}
          </Chip>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{starter.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{starter.brief}</p>

      <div className="mt-4 space-y-2 text-xs">
        <StarterRow label="for" body={starter.bestFor} />
        <StarterRow label="proof" body={starter.firstProof} />
        <StarterRow label="agent" body={starter.agent} />
        <StarterRow label="gate" body={starter.gate} />
        <StarterRow label="output" body={starter.output} />
      </div>

      <div className="mt-auto pt-4">
        <Button
          type="button"
          onClick={onStart}
          disabled={disabled}
          variant={existing || joinable ? "outline" : "default"}
          size="sm"
          className="w-full justify-center"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : existing || joinable ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {loading ? "Starting..." : existing ? "Open workflow" : joinable ? "Join workflow" : runtimePending ? "Connect runtime" : "Start workflow"}
          {!loading && <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
        <p className="mt-2 truncate text-center font-mono text-[10px] text-muted-foreground">
          {starter.channelName}
        </p>
      </div>
    </article>
  );
}

function StarterRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid grid-cols-[54px_1fr] gap-2 rounded-lg border border-border/70 bg-background/60 px-3 py-2">
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="min-w-0 text-muted-foreground">{body}</span>
    </div>
  );
}

type WorkflowTone = "accent" | "warning" | "danger" | "success" | "default";

interface WorkflowSnapshot {
  channelId: string;
  name: string;
  description: string | null;
  openTasks: number;
  reviewTasks: number;
  activeRuns: number;
  waitingRuns: number;
  failedRuns: number;
  updatedAt: number;
  label: string;
  meta: string;
  tone: WorkflowTone;
  priority: number;
  needsAttention: boolean;
}

function WorkflowFocusPanel({
  id,
  title,
  description,
  empty,
  items,
  slug,
  countLabel,
}: {
  id?: string;
  title: string;
  description: string;
  empty: string;
  items: WorkflowSnapshot[];
  slug: string;
  countLabel?: string | number;
}) {
  return (
    <Card className="bg-surface/80">
      <CardPanel className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={id} className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
          <Chip size="sm" variant="soft" color={items.length > 0 ? "warning" : "default"} className="shrink-0">
            {countLabel ?? items.length}
          </Chip>
        </div>
        {items.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border/70 bg-background/60 px-3 py-3 text-xs text-muted-foreground">
            {empty}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((workflow) => (
              <li key={workflow.channelId}>
                <Link
                  href={`/s/${slug}/channel/${workflow.channelId}`}
                  className="flex min-w-0 items-start gap-3 rounded-lg border border-border/70 bg-background/70 px-3 py-2.5 transition-colors hover:border-accent/25 hover:bg-[var(--accent-soft)]"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-[var(--accent-soft-foreground)]">
                    {workflow.failedRuns > 0 ? (
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">{workflow.name}</span>
                      <Chip size="sm" variant="soft" color={workflow.tone} className="h-5 shrink-0 px-1.5 text-[10px]">
                        {workflow.label}
                      </Chip>
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {workflow.meta}
                    </span>
                    {workflow.description && (
                      <span className="mt-1 block truncate text-[11px] text-muted-foreground/80">
                        {workflow.description}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardPanel>
    </Card>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function buildWorkflowSnapshots(
  channels: ServerStats["channels"],
  tasks: TaskRow[],
  runs: AgentRun[],
): WorkflowSnapshot[] {
  return channels
    .filter((channel) => channel.type !== "dm" && channel.isMember !== false && !isSystemOnboardingWorkflow(channel))
    .map((channel) => {
      const channelTasks = tasks.filter((task) => task.channelId === channel.id);
      const channelRuns = runs.filter((run) => run.channelId === channel.id);
      const openTasks = channelTasks.filter((task) => task.status !== "done").length;
      const reviewTasks = channelTasks.filter((task) => task.status === "in_review").length;
      const activeRuns = channelRuns.filter((run) => isActiveRunStatus(run.status)).length;
      const waitingRuns = channelRuns.filter((run) => run.status === "waiting_input").length;
      const failedRuns = channelRuns.filter((run) => run.status === "failed").length;
      const updatedAt = Math.max(
        0,
        ...channelTasks.map((task) => task.updatedAt),
        ...channelRuns.map((run) => new Date(run.updatedAt).getTime()).filter(Number.isFinite),
      );
      return summarizeWorkflowSnapshot({
        channelId: channel.id,
        name: channel.name,
        description: channel.description,
        openTasks,
        reviewTasks,
        activeRuns,
        waitingRuns,
        failedRuns,
        updatedAt,
      });
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.updatedAt - a.updatedAt;
    });
}

function isSystemOnboardingWorkflow(channel: Pick<Channel, "name" | "type">): boolean {
  return channel.type !== "dm" && channel.name === "onboarding";
}

function summarizeWorkflowSnapshot(input: Omit<WorkflowSnapshot, "label" | "meta" | "tone" | "priority" | "needsAttention">): WorkflowSnapshot {
  if (input.reviewTasks > 0) {
    return {
      ...input,
      label: "Review",
      meta: `${input.reviewTasks} task${input.reviewTasks === 1 ? "" : "s"} need human review${input.failedRuns > 0 ? ` · ${input.failedRuns} failed run${input.failedRuns === 1 ? "" : "s"}` : ""}`,
      tone: "warning",
      priority: 0,
      needsAttention: true,
    };
  }
  if (input.waitingRuns > 0) {
    return {
      ...input,
      label: "Waiting",
      meta: `${input.waitingRuns} agent run${input.waitingRuns === 1 ? "" : "s"} waiting for input${input.openTasks > 0 ? ` · ${input.openTasks} open task${input.openTasks === 1 ? "" : "s"}` : ""}`,
      tone: "warning",
      priority: 1,
      needsAttention: true,
    };
  }
  if (input.failedRuns > 0) {
    return {
      ...input,
      label: "Failed",
      meta: `${input.failedRuns} failed run${input.failedRuns === 1 ? "" : "s"}${input.openTasks > 0 ? ` · ${input.openTasks} open task${input.openTasks === 1 ? "" : "s"}` : ""}`,
      tone: "danger",
      priority: 2,
      needsAttention: true,
    };
  }
  if (input.activeRuns > 0) {
    return {
      ...input,
      label: "Running",
      meta: `${input.activeRuns} agent run${input.activeRuns === 1 ? "" : "s"} active${input.openTasks > 0 ? ` · ${input.openTasks} open task${input.openTasks === 1 ? "" : "s"}` : ""}`,
      tone: "accent",
      priority: 3,
      needsAttention: false,
    };
  }
  if (input.openTasks > 0) {
    return {
      ...input,
      label: "Open",
      meta: `${input.openTasks} open task${input.openTasks === 1 ? "" : "s"}`,
      tone: "default",
      priority: 4,
      needsAttention: false,
    };
  }
  return {
    ...input,
    label: "Ready",
    meta: "brief, run, approve",
    tone: "success",
    priority: 5,
    needsAttention: false,
  };
}

function isActiveRunStatus(status: AgentRun["status"]): boolean {
  return status === "queued" || status === "dispatched" || status === "running" || status === "waiting_input";
}

function RuntimeBoundaryPanel({
  hasBridgeHere,
  hasBridgeAgents,
  onOpenWizard,
}: {
  hasBridgeHere: boolean;
  hasBridgeAgents: boolean;
  onOpenWizard: () => void;
}) {
  const needsBridge = !hasBridgeHere && hasBridgeAgents;
  return (
    <Card className="bg-surface/80">
      <CardPanel className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            {needsBridge ? "A local runtime is waiting to connect." : "Local runtime is optional."}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {needsBridge
              ? "One of your agents runs from your machine. Connect the bridge so that workflow can use local code, keys, and tools."
              : "Cloud agents can start low-risk workflows now. Connect your own runtime when a workflow touches code, secrets, or private customer context."}
          </p>
        </div>
        <Button
          type="button"
          variant={needsBridge ? "default" : "outline"}
          size="sm"
          onClick={onOpenWizard}
          className="w-full justify-center sm:w-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {needsBridge ? "Connect local runtime" : "Bring your agents"}
        </Button>
      </CardPanel>
    </Card>
  );
}
