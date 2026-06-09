"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, Check, ClipboardCheck, Hash, Lock } from "lucide-react";
import { api, type AgentRun, type Channel, type TaskRow } from "@/lib/api";
import { notifyThrown, notifySuccess } from "@/lib/notify";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { WorkspaceEmptyState, WorkspaceIconFrame, WorkspacePage } from "@/components/workspace-page";

/**
 * Workflow cockpit + public workflow discovery in this workspace.
 *
 * Sibling to /agents and /tasks in the top-level nav. Solves the
 * discovery gap: previously a workspace invitee could only see workflows
 * they were explicitly added to — there was no surface to find #general
 * or #design unless someone @-mentioned them in one.
 *
 * Out of scope:
 *   - Private channel discovery (members-only by design)
 *   - Browsing across workspaces (channels are workspace-scoped)
 *   - Leaving channels (handled per-channel header — TBD)
 */
type BrowseRow = Awaited<ReturnType<typeof api.browseChannels>>["channels"][number];
type WorkflowRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: number;
  type: "public" | "private";
  isMember: boolean;
};

export default function ChannelsBrowsePage() {
  const { slug } = useParams<{ slug: string }>();
  const [myRows, setMyRows] = useState<WorkflowRow[] | null>(null);
  const [discoverRows, setDiscoverRows] = useState<WorkflowRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workSignalsError, setWorkSignalsError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setWorkSignalsError(null);
    setMyRows(null);
    try {
      const { server, channels: visibleChannels } = await api.getServerBySlug(slug);
      const [{ channels }, taskResult, runResult] = await Promise.all([
        api.browseChannels(server.id),
        api.listTasks({ serverId: server.id, limit: 200 }).then(
          (value) => ({ ok: true as const, value }),
          (error) => ({ ok: false as const, error }),
        ),
        api.listAgentRuns({ serverId: server.id, limit: 200 }).then(
          (value) => ({ ok: true as const, value }),
          (error) => ({ ok: false as const, error }),
        ),
      ]);
      const signalErrors: string[] = [];
      if (taskResult.ok) {
        setTasks(taskResult.value.tasks);
      } else {
        setTasks([]);
        signalErrors.push(`tasks: ${errorMessage(taskResult.error)}`);
      }
      if (runResult.ok) {
        setRuns(runResult.value.runs);
      } else {
        setRuns([]);
        signalErrors.push(`agent runs: ${errorMessage(runResult.error)}`);
      }
      setWorkSignalsError(signalErrors.length > 0 ? signalErrors.join("; ") : null);
      const publicMembershipById = new Map(channels.map((row) => [row.id, row.isMember]));
      const own = visibleChannels
        .filter((channel): channel is Channel & { type: "public" | "private" } => (
          channel.type !== "dm"
          && !isSystemOnboardingWorkflow(channel)
          && (
            channel.type === "private"
            || publicMembershipById.get(channel.id) === true
            || (!publicMembershipById.has(channel.id) && channel.isMember !== false)
          )
        ))
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          description: channel.description,
          createdAt: channel.createdAt,
          type: channel.type,
          isMember: channel.isMember !== false,
        }))
        .sort((a, b) => a.createdAt - b.createdAt);
      const ownIds = new Set(own.map((row) => row.id));
      const discover = channels
        .filter((row) => !row.isMember && !ownIds.has(row.id) && row.name !== "onboarding")
        .map((row) => browseRowToWorkflow(row))
        .sort((a, b) => a.createdAt - b.createdAt);
      setMyRows(own);
      setDiscoverRows(discover);
    } catch (e) {
      notifyThrown("Couldn't load workflows", e);
      setLoadError(errorMessage(e));
      setMyRows([]);
      setDiscoverRows([]);
      setTasks([]);
      setRuns([]);
    }
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  async function handleJoin(row: WorkflowRow) {
    if (joining) return;
    setJoining(row.id);
    try {
      const res = await api.joinChannel(row.id);
      notifySuccess(res.alreadyMember ? "Already a member" : `Joined ${row.name}`);
      // Update local row to flip isMember without a full reload.
      setDiscoverRows((prev) => prev.filter((r) => r.id !== row.id));
      setMyRows((prev) => [...(prev ?? []), { ...row, isMember: true }].sort((a, b) => a.createdAt - b.createdAt));
      // Tell the sidebar to re-fetch this workspace's channels so the
      // newly-joined channel shows up in the left rail immediately.
      // Sidebar listens for this event in apps/web/src/components/sidebar.tsx.
      // CustomEvent over a context here keeps the channels page decoupled
      // from layout/sidebar — no prop drilling through the Next route layer.
      window.dispatchEvent(new CustomEvent("raltic:channels-changed"));
    } catch (e) {
      notifyThrown("Couldn't join workflow", e);
    } finally {
      setJoining(null);
    }
  }

  return (
    <WorkspacePage
      title="Workflows"
      description={<>Your workflow cockpit first; public workflow discovery second.</>}
      icon={<Hash className="h-5 w-5" aria-hidden="true" />}
      tone="accent"
    >
          {loadError && (
            <Card className="border-danger/30 bg-danger/10 !shadow-none">
              <CardPanel className="p-4">
                <p className="text-sm font-medium text-danger-text">Couldn't load workflows</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">{loadError}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { void load(); }}>
                  Try again
                </Button>
              </CardPanel>
            </Card>
          )}
          {!loadError && workSignalsError && (
            <Card className="border-warning/30 bg-[var(--warning-soft)] !shadow-none">
              <CardPanel className="flex items-start gap-3 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning-soft-foreground)]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Workflow status unavailable</p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    Directory entries loaded, but tasks or agent runs could not be confirmed: {workSignalsError}
                  </p>
                </div>
              </CardPanel>
            </Card>
          )}
          {!loadError && myRows === null && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {!loadError && myRows !== null && (
            <div className="space-y-6">
              <section aria-labelledby="my-workflows-heading">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h2 id="my-workflows-heading" className="text-sm font-semibold text-foreground">My workflows</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Workflow rooms you can open, brief, run, and approve.</p>
                  </div>
                  <Chip size="sm" variant="soft" color={myRows.length > 0 ? "accent" : "default"}>{myRows.length}</Chip>
                </div>
                {myRows.length === 0 ? (
                  <WorkspaceEmptyState
                    icon={<Hash className="h-8 w-8" />}
                    tone="accent"
                    title="No workflows yet."
                    description={<>Start with a cloud starter, send the first brief, and come back here when the room is ready to reuse.</>}
                    action={
                      <Button render={<Link href={`/s/${slug}`} />} size="sm" className="justify-center">
                        Start a workflow
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                ) : (
                  <ul className="space-y-2">
                    {myRows.map((r) => (
                      <WorkflowDirectoryRow
                        key={r.id}
                        row={r}
                        slug={slug}
                        summary={summarizeDirectoryWorkflow(r.id, tasks, runs)}
                        joining={false}
                        onJoin={() => {}}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="discover-workflows-heading">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <h2 id="discover-workflows-heading" className="text-sm font-semibold text-foreground">Discover public workflows</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Join public workflow rooms when you need to track their tasks and agent runs.</p>
                  </div>
                  <Chip size="sm" variant="soft" color="default">{discoverRows.length}</Chip>
                </div>
                {discoverRows.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 bg-surface/60 px-3 py-3 text-xs text-muted-foreground">
                    No public workflows to discover.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {discoverRows.map((r) => (
                <WorkflowDirectoryRow
                  key={r.id}
                  row={r}
                  slug={slug}
                  summary={summarizeDirectoryWorkflow(r.id, tasks, runs)}
                  joining={joining === r.id}
                  onJoin={() => handleJoin(r)}
                />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
    </WorkspacePage>
  );
}

function WorkflowDirectoryRow({
  row,
  slug,
  summary,
  joining,
  onJoin,
}: {
  row: WorkflowRow;
  slug: string;
  summary: DirectoryWorkflowSummary;
  joining: boolean;
  onJoin: () => void;
}) {
  const StatusIcon = summary.failedRuns > 0 ? AlertTriangle : summary.reviewTasks > 0 ? ClipboardCheck : Activity;
  const VisibilityIcon = row.type === "private" ? Lock : Hash;
  return (
    <Card render={<li />} className="border-border/60 bg-surface/80 !shadow-none transition-colors hover:border-accent/25">
      <CardPanel className="flex flex-wrap items-start gap-3 p-3">
        <WorkspaceIconFrame tone="accent" size="sm">
          <Hash className="h-4 w-4" aria-hidden="true" />
        </WorkspaceIconFrame>
        <div className="min-w-0 flex-1">
          <Link
            href={`/s/${slug}/channel/${row.id}`}
            className="truncate font-medium hover:underline"
          >
            {row.name}
          </Link>
          {row.description && (
            <p className="truncate text-[11px] text-muted-foreground">{row.description}</p>
          )}
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Chip size="sm" variant="soft" color={row.type === "private" ? "default" : "accent"} className="h-5 gap-1 px-1.5 text-[10px]">
              <VisibilityIcon className="h-3 w-3" aria-hidden="true" />
              {row.type}
            </Chip>
            {row.isMember ? (
              <>
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                  <StatusIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{summary.meta}</span>
                </span>
                {summary.openTasks > 0 && (
                  <Chip size="sm" variant="soft" color="default" className="h-5 px-1.5 text-[10px]">
                    {summary.openTasks} open
                  </Chip>
                )}
                {summary.reviewTasks > 0 && (
                  <Chip size="sm" variant="soft" color="warning" className="h-5 px-1.5 text-[10px]">
                    {summary.reviewTasks} review
                  </Chip>
                )}
                {summary.failedRuns > 0 && (
                  <Chip size="sm" variant="soft" color="danger" className="h-5 px-1.5 text-[10px]">
                    {summary.failedRuns} failed
                  </Chip>
                )}
              </>
            ) : (
              <span>Join to track tasks and agent runs.</span>
            )}
          </div>
        </div>
        {row.isMember ? (
          <Chip size="sm" variant="soft" color="success" className="w-full justify-center gap-1 sm:ml-auto sm:w-auto">
            <Check className="h-3 w-3" /> Joined
          </Chip>
        ) : (
          <Button
            type="button"
            onClick={onJoin}
            disabled={joining}
            variant="outline"
            size="xs"
            className="w-full shrink-0 justify-center text-xs sm:ml-auto sm:w-auto"
          >
            {joining ? "Joining…" : "Join"}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </CardPanel>
    </Card>
  );
}

function browseRowToWorkflow(row: BrowseRow): WorkflowRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    type: "public",
    isMember: row.isMember,
  };
}

function isSystemOnboardingWorkflow(channel: Pick<Channel, "name" | "type">): boolean {
  return channel.type !== "dm" && channel.name === "onboarding";
}

interface DirectoryWorkflowSummary {
  openTasks: number;
  reviewTasks: number;
  activeRuns: number;
  waitingRuns: number;
  failedRuns: number;
  meta: string;
}

function summarizeDirectoryWorkflow(channelId: string, tasks: TaskRow[], runs: AgentRun[]): DirectoryWorkflowSummary {
  const channelTasks = tasks.filter((task) => task.channelId === channelId);
  const channelRuns = runs.filter((run) => run.channelId === channelId);
  const openTasks = channelTasks.filter((task) => task.status !== "done").length;
  const reviewTasks = channelTasks.filter((task) => task.status === "in_review").length;
  const activeRuns = channelRuns.filter((run) => (
    run.status === "queued" || run.status === "dispatched" || run.status === "running" || run.status === "waiting_input"
  )).length;
  const waitingRuns = channelRuns.filter((run) => run.status === "waiting_input").length;
  const failedRuns = channelRuns.filter((run) => run.status === "failed").length;
  const meta = reviewTasks > 0
    ? "Needs human review"
    : waitingRuns > 0
      ? "Agent waiting for input"
      : failedRuns > 0
        ? "Agent run failed"
        : activeRuns > 0
          ? "Agent work running"
          : openTasks > 0
            ? "Open tasks"
            : "Ready to brief, run, approve";
  return { openTasks, reviewTasks, activeRuns, waitingRuns, failedRuns, meta };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
