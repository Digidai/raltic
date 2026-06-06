"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { api, type Channel } from "@/lib/api";
import { SetupWizard } from "@/components/setup-wizard";
import { BrandMonogram } from "@/components/brand";
import { notifyThrown } from "@/lib/notify";
import { trackProductEvent } from "@/lib/product-tracking";
import { WORKFLOW_STARTERS, type WorkflowStarterKey, type WorkflowStarterTemplate } from "@/lib/workflow-starters";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  GitPullRequest,
  LineChart,
  ListChecks,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface ServerStats {
  id: string;
  name: string;
  description: string | null;
  agentCount: number;
  channelCount: number;
  roomCount: number;
  starterAgentId: string | null;
  onboardingDmId: string | null;
  channels: Array<Pick<Channel, "id" | "name" | "type">>;
}

interface PersonalRef {
  id: string;
  slug: string;
  name: string;
}

/**
 * 24h cool-down on the auto-popup. Snooze key is now keyed by the
 * PERSONAL workspace slug (where the wizard targets), not the current
 * page slug — otherwise an invitee bouncing between Gene's workspace
 * and their own would see the same wizard re-pop on every Gene visit.
 */
const WIZARD_SNOOZE_MS = 24 * 60 * 60 * 1000;
const SNOOZE_KEY_PREFIX = "raltic:wizard:snoozedUntil:";

function snoozeKey(userId: string, personalSlug: string): string {
  return `${SNOOZE_KEY_PREFIX}${userId}:${personalSlug}`;
}

function isWizardSnoozed(userId: string, personalSlug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(snoozeKey(userId, personalSlug));
    if (!raw) return false;
    return Number(raw) > Date.now();
  } catch { return false; }
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

  // Is the user looking at their own personal workspace?
  const onPersonalWorkspace = stats != null && personal != null && stats.id === personal.id;

  useEffect(() => {
    let cancelled = false;
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
        const me = await api.me({ serverId: data.server.id });
        if (cancelled) return;
        setStats({
          id: data.server.id,
          name: data.server.name,
          description: data.server.description,
          agentCount: data.agents.length,
          channelCount: data.channels.length,
          roomCount: data.channels.filter((c) => c.type !== "dm").length,
          starterAgentId: (
            data.agents.find((a) => a.name === "onboarding")
            ?? data.agents.find((a) => a.isDefault)
            ?? data.agents.find((a) => a.runtimeMode === "raltic")
            ?? data.agents[0]
          )?.id ?? null,
          onboardingDmId: data.channels.find((c) => c.type === "dm" && c.name === "onboarding-assistant")?.id ?? null,
          channels: data.channels.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        });
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
        let personalBridge = me.hasConnectedBridge;
        if (personalRef && personalRef.id !== data.server.id) {
          const me2 = await api.me({ serverId: personalRef.id });
          if (cancelled) return;
          personalBridge = me2.hasConnectedBridge;
        }
        setHasBridgeInPersonal(personalBridge);

        // Auto-pop ONLY on personal workspace AND only if its bridge
        // isn't connected AND not snoozed AND the user has at least
        // one bridge-mode agent in this workspace. Cloud-only users
        // shouldn't be forced through bridge setup just because they
        // signed up — the seeded Onboarding Assistant is raltic-mode
        // (codex P3 audit fix), so they can chat with it without
        // installing anything (codex P3 audit Angle 6 HIGH).
        //
        // The key behavior change vs. the original bug: on an INVITED
        // workspace, we no longer auto-pop. Olivia ran the wizard on
        // Gene's because that's where she landed; the wizard happily
        // minted a key bound to Gene's serverId. Now we only pop where
        // the wizard's target (personal) IS the current workspace.
        const amOnPersonal = personalRef && personalRef.id === data.server.id;
        const hasBridgeAgentHere = data.agents?.some(a => (a as { runtimeMode?: string }).runtimeMode === "bridge") ?? false;
        setHasBridgeAgents(hasBridgeAgentHere);
        if (forceWizard) {
          setWizardOpen(true);
        } else if (skipBridgeSetup) {
          if (amOnPersonal && personalRef) snoozeWizard(me.subject.userId, personalRef.slug);
          setWizardOpen(false);
        } else if (
          amOnPersonal &&
          !personalBridge &&
          hasBridgeAgentHere &&
          !isWizardSnoozed(me.subject.userId, personalRef.slug)
        ) {
          setWizardOpen(true);
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

  async function startWorkflowRoom(starter: WorkflowStarterTemplate) {
    if (!stats || startingWorkflow) return;
    trackProductEvent("workflow_starter_click", starter.key);
    const existing = stats.channels.find((c) => c.type !== "dm" && c.name === starter.channelName);
    if (existing) {
      router.push(`/s/${slug}/channel/${existing.id}?starter=${starter.key}`);
      return;
    }

    setStartingWorkflow(starter.key);
    try {
      const res = await api.createChannel({
        serverId: stats.id,
        name: starter.channelName,
        description: starter.description,
        type: starter.type,
        initialAgentIds: stats.starterAgentId ? [stats.starterAgentId] : undefined,
      });
      trackProductEvent("workflow_room_created", starter.key);
      window.dispatchEvent(new CustomEvent("raltic:channels-changed"));
      router.push(`/s/${slug}/channel/${res.id}?starter=${starter.key}`);
    } catch (e) {
      notifyThrown("Couldn't start workflow room", e);
    } finally {
      setStartingWorkflow(null);
    }
  }

  if (loading) return <div className="flex flex-1 items-center justify-center"><div className="text-sm text-muted-foreground">Loading…</div></div>;
  if (!stats) return <div className="flex flex-1 items-center justify-center"><div className="text-sm text-muted-foreground">Workspace not found</div></div>;

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
                    Workflow command center
                  </Chip>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Start a workflow room.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Pick a real business process, let agents run the work, keep human approval visible,
                    and turn the result into team memory inside {stats.name}.
                  </p>
                  {stats.description && (
                    <p className="mt-3 text-xs text-muted-foreground">{stats.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Stat label="Agents" value={stats.agentCount} />
                <Stat label="Rooms" value={stats.roomCount} />
              </div>
            </CardPanel>
          </Card>

          <div className="rounded-xl border border-border bg-surface/80 p-4 shadow-surface">
            <div className="grid gap-2">
              <WorkflowStep icon={<FileText className="h-4 w-4" />} label="Brief" body="Start with the work to be done." />
              <WorkflowStep icon={<Sparkles className="h-4 w-4" />} label="Agents" body="Cloud or local agents execute." />
              <WorkflowStep icon={<ShieldCheck className="h-4 w-4" />} label="Approval" body="Humans own the boundary calls." />
              <WorkflowStep icon={<ListChecks className="h-4 w-4" />} label="Memory" body="Decisions and tasks stay reusable." />
            </div>
          </div>
        </header>

        <section aria-labelledby="starter-workflows-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Start here
              </p>
              <h2 id="starter-workflows-heading" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Choose the first workflow your team already owns.
              </h2>
            </div>
            {stats.onboardingDmId && (
              <Button
                render={<Link href={`/s/${slug}/dm/${stats.onboardingDmId}`} />}
                variant="outline"
                size="sm"
                className="w-full justify-center sm:w-auto"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Ask onboarding agent
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {WORKFLOW_STARTERS.map((starter) => (
              <WorkflowStarterCard
                key={starter.key}
                starter={starter}
                hasLocalRuntime={Boolean(hasBridgeHere)}
                existing={stats.channels.some((c) => c.type !== "dm" && c.name === starter.channelName)}
                loading={startingWorkflow === starter.key}
                disabled={startingWorkflow !== null}
                onStart={() => { void startWorkflowRoom(starter); }}
              />
            ))}
          </div>
        </section>

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
                  Start from an existing room, or create a workflow room for the work you own here.
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
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface/70 px-3 py-2 text-center">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <Chip size="sm" variant="soft" color="default" className="mt-1 justify-center">{label}</Chip>
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
  existing,
  loading,
  disabled,
  onStart,
}: {
  starter: WorkflowStarterTemplate;
  hasLocalRuntime: boolean;
  existing: boolean;
  loading: boolean;
  disabled: boolean;
  onStart: () => void;
}) {
  const Icon = STARTER_ICONS[starter.key];
  const runtimePending = starter.requiresLocalRuntime && !hasLocalRuntime;
  return (
    <article
      aria-label={`${starter.title} workflow starter`}
      className="flex min-h-[360px] flex-col rounded-xl border border-border bg-surface/80 p-4 shadow-surface transition-colors hover:border-accent/25"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-[var(--accent-soft-foreground)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <Chip size="sm" variant="soft" color={starter.type === "private" ? "default" : "accent"} className="font-mono text-[10px] uppercase tracking-wider">
          {runtimePending ? "local runtime" : starter.type}
        </Chip>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{starter.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{starter.brief}</p>

      <div className="mt-4 space-y-2 text-xs">
        <StarterRow label="agent" body={starter.agent} />
        <StarterRow label="gate" body={starter.gate} />
        <StarterRow label="output" body={starter.output} />
      </div>

      <div className="mt-auto pt-4">
        <Button
          type="button"
          onClick={onStart}
          disabled={disabled}
          variant={existing ? "outline" : "default"}
          size="sm"
          className="w-full justify-center"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : existing ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {loading ? "Starting..." : existing ? "Open room" : runtimePending ? "Create room first" : "Start room"}
          {!loading && <ArrowRight className="h-3.5 w-3.5" />}
        </Button>
        <p className="mt-2 truncate text-center font-mono text-[10px] text-muted-foreground">
          #{starter.channelName}
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
              ? "One of your agents runs from your machine. Connect the bridge so that workflow room can use local code, keys, and tools."
              : "Cloud agents can start low-risk workflow rooms now. Connect your own runtime when a workflow touches code, secrets, or private customer context."}
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
