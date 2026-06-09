"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Activity, Cpu, MessageSquare, Pencil, Plus, ArrowRight } from "lucide-react";
import { api, type Agent, type AgentRun, type Channel } from "@/lib/api";
import { notifyThrown } from "@/lib/notify";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { CreateAgentDialog } from "@/components/create-agent-dialog";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { WorkspaceEmptyState, WorkspacePage } from "@/components/workspace-page";
import { useAgentActivities } from "@/hooks/use-agent-activity";
import { cn } from "@/lib/utils";

/**
 * Workspace-level agent work surface. Sibling to /inbox, /tasks, /channels —
 * accessible from the sidebar top-level nav.
 *
 * Replaces the old "Agents" sidebar SECTION which listed every agent
 * inline (alongside the parallel "Messages" list that had the
 * same agents in DM form — two parallel lists of the same entities).
 * The dedicated page lets us show richer execution context per agent (runtime,
 * status, description, last activity, latest runs) without consuming permanent
 * sidebar real estate.
 *
 * What this page does NOT do (delegates intentionally):
 *   - CRUD lifecycle (rename/delete) → Settings → Workflows & agents.
 *   - Per-agent profile / chat history → /s/{slug}/agents/{id}.
 *   - DM with the agent → click the "Message" affordance, which uses
 *     api.openDm to find-or-create the DM channel and routes there.
 */
export default function AgentsIndexPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const activities = useAgentActivities();
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [serverId, setServerId] = useState<string | null>(null);
  const [workByAgentId, setWorkByAgentId] = useState<Record<string, AgentWorkSummary> | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [channels, setChannels] = useState<Array<Pick<Channel, "id" | "name" | "type">>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workError, setWorkError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);
  const reloadRequestId = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++reloadRequestId.current;
    const live = () => reloadRequestId.current === requestId;
    try {
      setLoadError(null);
      setWorkError(null);
      setAgents(null);
      setServerId(null);
      setWorkByAgentId(null);
      setRuns([]);
      // Fetch in parallel: workspace metadata gives us the serverId for
      // create-dialog + DM open; agents list is the page's main payload.
      const [{ server, channels }, { agents: all }] = await Promise.all([
        api.getServerBySlug(slug),
        api.listAgents(),
      ]);
      if (!live()) return;
      setServerId(server.id);
      setChannels(channels.map((channel) => ({ id: channel.id, name: channel.name, type: channel.type })));
      // listAgents returns cross-workspace; scope to current.
      const workspaceAgents = all.filter((a) => a.serverId === server.id);
      setAgents(workspaceAgents);
      try {
        const { runs } = await api.listAgentRuns({ serverId: server.id, limit: 200 });
        if (!live()) return;
        setRuns(runs);
        setWorkByAgentId(summarizeAgentRuns(runs));
      } catch (e) {
        if (!live()) return;
        notifyThrown("Couldn't load agent work log", e);
        setWorkError(e instanceof Error ? e.message : String(e));
        setRuns([]);
        setWorkByAgentId({});
      }
    } catch (e) {
      if (!live()) return;
      notifyThrown("Couldn't load agents", e);
      setLoadError(e instanceof Error ? e.message : String(e));
      setAgents([]);
      setRuns([]);
      setChannels([]);
      setWorkByAgentId({});
    }
  }, [slug]);
  useEffect(() => { reload(); }, [reload]);

  async function handleMessage(agent: Agent) {
    if (!serverId || opening) return;
    setOpening(agent.id);
    try {
      // Agents always have an auto-created DM (from agents.ts:98), but
      // we still go through openDm so the page handles legacy agents
      // missing dmChannelId without a special-case.
      const { channelId } = await api.openDm({
        serverId, peerType: "agent", peerId: agent.id,
      });
      router.push(`/s/${slug}/dm/${channelId}`);
    } catch (e) {
      notifyThrown("Couldn't open DM", e);
    } finally {
      setOpening(null);
    }
  }

  return (
    <WorkspacePage
      title="Agent Work"
      description="AI teammates, runtime health, and recent execution across this workspace."
      icon={<Cpu className="h-5 w-5" aria-hidden="true" />}
      tone="success"
      actions={
        serverId ? (
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> New agent
            </Button>
          ) : null
      }
    >
          {agents === null && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {loadError && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-text">
              Couldn&apos;t load agents: {loadError}
            </div>
          )}
          {!loadError && agents !== null && agents.length === 0 && (
            <WorkspaceEmptyState
              icon={<Cpu className="h-8 w-8" />}
              tone="success"
              title="No agents yet."
              description="Create your first AI teammate to start collaborating in workflows."
              action={serverId && (
                <Button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Create agent
                </Button>
              )}
            />
          )}
          {!loadError && agents !== null && agents.length > 0 && (
            <div className="space-y-4">
              <WorkspaceRunLog slug={slug} runs={runs} agents={agents} channels={channels} loading={workByAgentId === null} error={workError} />
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {agents.map((a) => {
                  const act = activities[a.id];
                  const work = workByAgentId === null ? undefined : workByAgentId[a.id] ?? null;
                  return (
                    <Card render={<li />} key={a.id} className="border-border/60 bg-surface/80 !shadow-none transition-colors hover:border-accent/25">
                      <CardPanel className="p-3">
                      <div className="flex items-start gap-3">
                        <GeneratedAvatar id={a.id} name={a.displayName} seed={a.avatarSeed} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/s/${slug}/agents/${a.id}`}
                              className="min-w-0 max-w-full truncate font-medium hover:underline"
                            >
                              {a.displayName}
                            </Link>
                            <RuntimeChip runtime={a.runtime} />
                          </div>
                          <p className="min-w-0 max-w-full truncate text-[11px] text-muted-foreground" title={`@${a.name} · ${a.model}`}>
                            <span className="font-mono">@{a.name}</span> · {a.model}
                          </p>
                          {a.description && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-3 text-[11px]">
                            <StatusDot status={act?.status ?? (a.status === "online" ? "idle" : "offline")} />
                            {act?.label && <span className="truncate text-muted-foreground">{act.label}</span>}
                          </div>
                          <AgentWorkSnapshot
                            slug={slug}
                            agentId={a.id}
                            summary={work}
                            loading={work === undefined}
                            error={workError}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          render={<Link href={`/s/${slug}/agents/${a.id}`} />}
                          className="text-xs text-muted-foreground"
                        >
                          <Pencil className="h-3 w-3" /> Profile
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleMessage(a)}
                          disabled={opening !== null}
                          variant="outline"
                          size="xs"
                          className="text-xs"
                        >
                          <MessageSquare className="h-3 w-3" />
                          {opening === a.id ? "Opening…" : "Message"}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                      </CardPanel>
                    </Card>
                  );
                })}
              </ul>
            </div>
          )}
      {serverId && (
        <CreateAgentDialog
          serverId={serverId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => { setCreateOpen(false); reload(); }}
        />
      )}
    </WorkspacePage>
  );
}

type AgentWorkSummary = {
  latestRun: AgentRun;
  active: number;
  completed: number;
  failed: number;
  total: number;
};

const RUN_STATUS_META: Record<AgentRun["status"], { label: string; color: "accent" | "danger" | "success" | "warning" | "default" }> = {
  queued: { label: "Queued", color: "default" },
  dispatched: { label: "Dispatched", color: "accent" },
  running: { label: "Running", color: "accent" },
  waiting_input: { label: "Waiting", color: "warning" },
  completed: { label: "Completed", color: "success" },
  failed: { label: "Failed", color: "danger" },
  cancelled: { label: "Cancelled", color: "default" },
};

function WorkspaceRunLog({
  slug,
  runs,
  agents,
  channels,
  loading,
  error,
}: {
  slug: string;
  runs: AgentRun[];
  agents: Agent[];
  channels: Array<Pick<Channel, "id" | "name" | "type">>;
  loading: boolean;
  error: string | null;
}) {
  const agentById = new Map(agents.map((agent) => [agent.id, agent]));
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));
  const sortedRuns = [...runs]
    .sort((a, b) => {
      const priority = runPriority(a.status) - runPriority(b.status);
      if (priority !== 0) return priority;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    })
    .slice(0, 6);

  return (
    <Card className="border-border/60 bg-surface/80 !shadow-none">
      <CardPanel className="p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Workspace run log</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Recent agent execution, ordered by what most needs attention.
            </p>
          </div>
          <Chip size="sm" variant="soft" color={sortedRuns.length > 0 ? "accent" : "default"} className="w-fit">
            {runs.length} sampled
          </Chip>
        </div>
        {loading ? (
          <div className="mt-4 h-12 animate-pulse rounded-lg bg-muted/60" aria-hidden="true" />
        ) : error ? (
          <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger-text">
            Work log unavailable: {error}
          </p>
        ) : sortedRuns.length === 0 ? (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-background/60 px-3 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>No agent runs yet. Start a workflow and send the first brief to create a traceable run.</span>
            <Button render={<Link href={`/s/${slug}`} />} size="xs" variant="outline" className="w-full justify-center sm:w-auto">
              Start workflow
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
            {sortedRuns.map((run) => {
              const agent = agentById.get(run.agentId);
              const workflow = channelById.get(run.channelId);
              const meta = RUN_STATUS_META[run.status];
              return (
                <li key={run.id}>
                  <Link
                    href={`/s/${slug}/agents/${run.agentId}?tab=runs&runId=${run.id}`}
                    className="flex min-w-0 items-center gap-3 bg-background/70 px-3 py-2.5 transition-colors hover:bg-[var(--accent-soft)]"
                  >
                    <Activity className={cn(
                      "h-4 w-4 shrink-0",
                      run.status === "failed" ? "text-danger-text" : "text-muted-foreground",
                    )} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                          {agent?.displayName ?? `Agent ${run.agentId.slice(0, 6)}`}
                        </span>
                        <Chip size="sm" variant="soft" color={meta.color} className="h-5 px-1.5 text-[10px]">
                          {meta.label}
                        </Chip>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {workflow && workflow.type !== "dm" ? `#${workflow.name} · ` : ""}
                        {formatRunSource(run.source)} · {formatRuntimeMode(run.runtimeMode)} · {formatRelativeTime(run.updatedAt)}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardPanel>
    </Card>
  );
}

function summarizeAgentRuns(runs: AgentRun[]): Record<string, AgentWorkSummary> {
  const out: Record<string, AgentWorkSummary> = {};
  for (const run of runs) {
    const current = out[run.agentId];
    const next: AgentWorkSummary = current ?? {
      latestRun: run,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };
    next.total += 1;
    if (isActiveRun(run)) next.active += 1;
    if (run.status === "completed") next.completed += 1;
    if (run.status === "failed") next.failed += 1;
    if (new Date(run.updatedAt).getTime() > new Date(next.latestRun.updatedAt).getTime()) {
      next.latestRun = run;
    }
    out[run.agentId] = next;
  }
  return out;
}

function isActiveRun(run: AgentRun): boolean {
  return run.status === "queued" || run.status === "dispatched" || run.status === "running" || run.status === "waiting_input";
}

function runPriority(status: AgentRun["status"]): number {
  if (status === "waiting_input") return 0;
  if (status === "failed") return 1;
  if (status === "running" || status === "dispatched" || status === "queued") return 2;
  if (status === "completed") return 3;
  return 4;
}

function formatRunSource(source: string): string {
  if (source === "channel_mention") return "Workflow mention";
  if (source === "channel_message") return "Workflow message";
  return source.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatRuntimeMode(mode: string): string {
  if (mode === "bridge") return "Local Bridge";
  if (mode === "raltic") return "Raltic Cloud";
  return mode.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return "";
  const delta = Date.now() - ts;
  if (delta < 60_000) return "Just now";
  if (delta < 60 * 60_000) return `${Math.max(1, Math.floor(delta / 60_000))}m ago`;
  if (delta < 24 * 60 * 60_000) return `${Math.floor(delta / (60 * 60_000))}h ago`;
  return `${Math.floor(delta / (24 * 60 * 60_000))}d ago`;
}

function AgentWorkSnapshot({
  slug,
  agentId,
  summary,
  loading,
  error,
}: {
  slug: string;
  agentId: string;
  summary: AgentWorkSummary | null | undefined;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="mt-2 h-6 w-44 animate-pulse rounded-md bg-muted/60" aria-hidden="true" />;
  }
  if (error) {
    return (
      <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-danger-text">
        <Activity className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate" title={error}>Work log unavailable</span>
      </div>
    );
  }
  if (!summary) {
    return (
      <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        <Activity className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span>No work in latest sample</span>
      </div>
    );
  }
  const latest = summary.latestRun;
  const meta = RUN_STATUS_META[latest.status];
  return (
    <Link
      href={`/s/${encodeURIComponent(slug)}/agents/${encodeURIComponent(agentId)}?tab=runs&runId=${encodeURIComponent(latest.id)}`}
      className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-[11px] transition-colors hover:border-accent/30 hover:bg-background"
    >
      <Activity className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 truncate text-muted-foreground">Work log</span>
      <Chip size="sm" variant="soft" color={meta.color} className="h-5 px-1.5 text-[10px]">
        {meta.label}
      </Chip>
      <span className="min-w-0 truncate text-muted-foreground">
        {formatRelativeTime(latest.updatedAt)}
      </span>
      {summary.active > 0 && (
        <Chip size="sm" variant="soft" color="accent" className="h-5 px-1.5 text-[10px]">
          {summary.active} active
        </Chip>
      )}
      {summary.failed > 0 && (
        <Chip size="sm" variant="soft" color="danger" className="h-5 px-1.5 text-[10px]">
          {summary.failed} failed
        </Chip>
      )}
    </Link>
  );
}

function RuntimeChip({ runtime }: { runtime: string }) {
  // Accept `string` (not RuntimeId) because agents.runtime is plain TEXT
  // post-S2 and the server may pass through legacy "gemini"/"copilot"
  // values from pre-removal rows. Fall through to a neutral zinc tone
  // for unknown runtimes — never throw, never white-screen. Detected
  // by review (backcompat H1).
  const tone: Record<string, "accent" | "warning" | "default"> = {
    claude:   "accent",
    codex:    "warning",
    openclaw: "default",
    hermes:   "default",
  };
  return (
    <Chip size="sm" variant="soft" color={tone[runtime] ?? "default"} className="text-[9px] uppercase tracking-wider">
      {runtime}
    </Chip>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "thinking" ? "bg-[var(--accent)] animate-pulse" :
    status === "working"  ? "bg-[var(--accent)] animate-pulse" :
    status === "error"    ? "bg-[var(--danger)]" :
    status === "idle"     ? "bg-[var(--success)]" : "bg-muted-foreground/70";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} aria-hidden="true" />
      <span className="text-muted-foreground">{status}</span>
    </span>
  );
}
