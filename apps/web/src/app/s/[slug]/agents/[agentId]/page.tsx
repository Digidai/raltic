"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, type Agent, type AgentRun, type MessageRow } from "@/lib/api";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { EditAgentDialog } from "@/components/edit-agent-dialog";
import { AlertDialog, AlertDialogPopup, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogClose } from "@/components/heroui-pro/alert-dialog";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardHeader, CardTitle, CardDescription, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { Tabs, TabsList, TabsListContainer, TabsTrigger } from "@/components/heroui-pro/tabs";
import { useAgentActivity } from "@/hooks/use-agent-activity";
import { Activity, ExternalLink, Hash, ListChecks, MessageSquare, Pencil, RefreshCw, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { notifyThrown, notifySuccess } from "@/lib/notify";
import { sanitizeUserVisibleError } from "@raltic/protocol";

/**
 * Collapsed-by-default system prompt viewer. The schema cap is 50KB —
 * that's ~3000 lines of text and would shove the recent-DM card off
 * the page on any small viewport if always expanded. Show first ~12
 * lines (~64rem max), let the user expand on demand.
 */
function SystemPromptCard({ prompt }: { prompt: string }) {
  const [expanded, setExpanded] = useState(false);
  // ~12 lines is enough to convey purpose without dominating the page.
  // We don't truncate the *content* — just visually clip via max-h.
  const isLong = prompt.length > 800 || prompt.split("\n").length > 12;
  return (
    <Card>
      <CardHeader>
        <CardTitle render={<h2 />}>System prompt</CardTitle>
        <CardDescription>The instructions this agent runs with.</CardDescription>
      </CardHeader>
      <CardPanel>
        <pre className={
          // [overflow-wrap:anywhere] handles single tokens longer than
          // the column (long URLs in prompts). overflow-x kept on `auto`
          // so a deliberately ASCII-art block can scroll rather than
          // get mangled — but whitespace-pre-wrap usually wraps it first.
          "raltic-code-block min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] p-3 text-xs leading-relaxed overflow-auto " +
          (expanded ? "max-h-[60vh]" : "max-h-64")
        }>{prompt}</pre>
        {isLong && (
          <Button type="button"
            variant="link"
            size="xs"
            onClick={() => setExpanded(v => !v)}
            className="mt-2 h-auto px-0 py-0 text-xs text-muted-foreground">
            {expanded ? "Show less" : "Show full prompt"}
          </Button>
        )}
      </CardPanel>
    </Card>
  );
}

const STATUS_LABEL: Record<string, { dot: string; text: string; color: "accent" | "danger" | "success" | "warning" | "default" }> = {
  thinking: { dot: "bg-[var(--accent)] animate-pulse", text: "Thinking…", color: "accent" },
  working:  { dot: "bg-[var(--accent)] animate-pulse", text: "Working…",  color: "accent" },
  error:    { dot: "bg-[var(--danger)]",               text: "Error",     color: "danger" },
  online:   { dot: "bg-[var(--success)]",              text: "Online",    color: "success" },
  sleeping: { dot: "bg-[var(--warning)]",              text: "Sleeping",  color: "warning" },
  offline:  { dot: "bg-muted-foreground/70",           text: "Offline",   color: "default" },
};

const RUN_STATUS_META: Record<AgentRun["status"], { label: string; color: "accent" | "danger" | "success" | "warning" | "default"; dot: string }> = {
  queued:        { label: "Queued",        color: "default", dot: "bg-muted-foreground/70" },
  dispatched:    { label: "Dispatched",    color: "accent",  dot: "bg-[var(--accent)]" },
  running:       { label: "Running",       color: "accent",  dot: "bg-[var(--accent)] animate-pulse" },
  waiting_input: { label: "Waiting input", color: "warning", dot: "bg-[var(--warning)]" },
  completed:     { label: "Completed",     color: "success", dot: "bg-[var(--success)]" },
  failed:        { label: "Failed",        color: "danger",  dot: "bg-[var(--danger)]" },
  cancelled:     { label: "Cancelled",     color: "default", dot: "bg-muted-foreground/70" },
};

const RUN_SOURCE_LABEL: Record<AgentRun["source"], string> = {
  channel_mention: "Room mention",
  channel_message: "Room message",
  dm: "DM",
  scheduled: "Scheduled",
  agent_to_agent: "Agent to agent",
  manual: "Manual",
};

const TAB_KEYS = ["chat", "runs", "tasks", "channels", "settings"] as const;
type TabKey = typeof TAB_KEYS[number];

function parseTab(value: string | null): TabKey {
  return TAB_KEYS.includes(value as TabKey) ? value as TabKey : "chat";
}

function formatRunTime(value: string | null): string {
  if (!value) return "Not started";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatRuntimeMode(mode: string): string {
  if (mode === "bridge") return "Local Bridge";
  if (mode === "raltic") return "Raltic Cloud";
  return mode.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatRunDuration(run: AgentRun): string {
  if (!run.startedAt) return "Not started";
  const start = new Date(run.startedAt).getTime();
  const end = new Date(run.completedAt ?? (isActiveRun(run) ? Date.now() : run.updatedAt)).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "Unknown";
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const minuteRest = minutes % 60;
  return minuteRest ? `${hours}h ${minuteRest}m` : `${hours}h`;
}

function isActiveRun(run: AgentRun): boolean {
  return run.status === "queued" || run.status === "dispatched" || run.status === "running" || run.status === "waiting_input";
}

function summarizeRunError(error: string): string {
  const redacted = sanitizeUserVisibleError(error, 240) ?? "";
  return redacted.length > 240 ? `${redacted.slice(0, 237)}...` : redacted;
}

type AgentTask = Awaited<ReturnType<typeof api.listTasks>>["tasks"][number];

function mergeFocusedAgentTasks(base: AgentTask[], focused: AgentTask[]): AgentTask[] {
  if (focused.length === 0) return base;
  const seen = new Set(base.map((task) => task.id));
  const missing = focused.filter((task) => !seen.has(task.id));
  return missing.length === 0 ? base : [...missing, ...base];
}

function dedupeAgentRuns(runs: AgentRun[]): AgentRun[] {
  const seen = new Set<string>();
  const out: AgentRun[] = [];
  for (const run of runs) {
    if (seen.has(run.id)) continue;
    seen.add(run.id);
    out.push(run);
  }
  return out;
}

export default function AgentProfilePage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const agentId = params.agentId as string;
  const focusedRunId = searchParams.get("runId");
  const focusedTaskId = searchParams.get("taskId");

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [history, setHistory] = useState<MessageRow[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Tabs remain one client page, but URL params can target a specific
  // evidence row (`?tab=runs&runId=...`, `?tab=tasks&taskId=...`).
  // This keeps Multica-style audit navigation without adding route bloat.
  const [tab, setTab] = useState<TabKey>(() => parseTab(searchParams.get("tab")));

  // Per-tab lazy-loaded data. Each tab fetches what it needs on first
  // mount; navigating away keeps the data so toggling tabs feels instant.
  const [tasks, setTasks] = useState<AgentTask[] | null>(null);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [channels, setChannels] = useState<Array<{ id: string; name: string; type: string; joinedAt: number }> | null>(null);
  const [runs, setRuns] = useState<AgentRun[] | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [runsRefreshing, setRunsRefreshing] = useState(false);
  const runsRequestId = useRef(0);
  const focusedRunLookupRef = useRef<string | null>(null);
  const focusedTaskLookupRef = useRef<string | null>(null);

  const live = useAgentActivity(agentId);

  useEffect(() => {
    setTab(parseTab(searchParams.get("tab")));
  }, [searchParams]);

  const selectTab = useCallback((nextTab: TabKey) => {
    setTab(nextTab);
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    if (nextTab !== "runs") next.delete("runId");
    if (nextTab !== "tasks") next.delete("taskId");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Cancel-aware reload — accepts a `live()` predicate from the caller so
  // a stale request landing after the user navigated away (or switched
  // agents) doesn't blow over the new state with the old one.
  async function reload(live: () => boolean = () => true) {
    if (live()) setError(null);
    try {
      const data = await api.listAgents();
      if (!live()) return null;
      const a = data.agents.find((x) => x.id === agentId) ?? null;
      if (!a) setError("Agent not found in your workspace.");
      setAgent(a);
      return a;
    } catch (e) {
      if (live()) setError(e instanceof ApiError ? e.message : String(e));
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;
    const live = () => !cancelled;
    setLoading(true);
    // Reset per-agent state — without this, navigating from agent A to
    // agent B inside the same route briefly shows A's history/tasks/
    // channels for B because the lazy-load guards see non-null and skip
    // refetch. We null them out so each tab re-fetches against the new id.
    setHistory(null);
    setHistoryError(null);
    setTasks(null);
    setTasksError(null);
    focusedTaskLookupRef.current = null;
    setChannels(null);
    runsRequestId.current += 1;
    focusedRunLookupRef.current = null;
    setRuns(null);
    setRunsError(null);
    setRunsRefreshing(false);
    reload(live).finally(() => { if (live()) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  // Lazy-load DM history once we know the dmChannelId. Surfaced below
  // the profile so the user sees recent context without leaving the page.
  useEffect(() => {
    if (!agent?.dmChannelId) return;
    let cancelled = false;
    api.listMessages(agent.dmChannelId, { limit: 20 }).then(d => {
      if (cancelled) return;
      // Reverse — listMessages returns newest first; we want oldest→newest
      // for natural reading order in the preview block.
      setHistory([...d.messages].reverse());
    }).catch(e => {
      if (cancelled) return;
      setHistoryError(e instanceof ApiError ? e.message : String(e));
    });
    return () => { cancelled = true; };
  }, [agent?.dmChannelId]);

  // Lazy-load tab data: tasks where this agent is the assignee.
  useEffect(() => {
    if (tab !== "tasks" || !agent) return;
    const needsInitialLoad = tasks === null;
    const needsFocusedLookup =
      !!focusedTaskId &&
      tasks !== null &&
      !tasks.some((task) => task.id === focusedTaskId) &&
      focusedTaskLookupRef.current !== focusedTaskId;
    if (!needsInitialLoad && !needsFocusedLookup) return;
    let cancelled = false;
    setTasksError(null);
    const scope = { serverId: agent.serverId, assigneeId: agent.id };
    const baseTasks = tasks ?? [];
    if (focusedTaskId) focusedTaskLookupRef.current = focusedTaskId;
    let focusedError: unknown = null;
    Promise.all([
      needsInitialLoad ? api.listTasks(scope) : Promise.resolve({ tasks: baseTasks }),
      focusedTaskId
        ? api.listTasks({ ...scope, taskId: focusedTaskId, limit: 1 }).catch((e) => {
          focusedError = e;
          return null;
        })
        : Promise.resolve(null),
    ]).then(([d, focused]) => {
      if (cancelled) return;
      const merged = focused ? mergeFocusedAgentTasks(d.tasks, focused.tasks) : d.tasks;
      setTasks(merged.filter((t) => t.assigneeType === "agent"));
      if (focusedError) {
        notifyThrown("Couldn't load focused task", focusedError);
        setTasksError(focusedError instanceof Error ? focusedError.message : String(focusedError));
      }
    }).catch((e) => {
      if (cancelled) return;
      notifyThrown("Couldn't load tasks", e);
      setTasksError(e instanceof Error ? e.message : String(e));
      if (needsInitialLoad) setTasks([]);
    });
    return () => { cancelled = true; };
  }, [tab, agent, tasks, focusedTaskId]);

  // Lazy-load tab data: channels this agent is a member of. Derived from
  // the workspace channel list filtered to ones containing this agent.
  // Note we need the workspace slug → server lookup; channel.members isn't
  // returned by getServerBySlug so we hit getChannel per candidate, which
  // is OK at our channel-per-workspace counts (<50 typical).
  useEffect(() => {
    if (tab !== "channels" || !agent || channels !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const srv = await api.getServerBySlug(slug);
        const memberships = await Promise.all(
          srv.channels.map((c) =>
            api.getChannel(c.id).then((d) => ({
              id: c.id, name: c.name, type: c.type,
              joinedAt: d.members.find((m) => m.memberId === agent.id)?.joinedAt ?? 0,
              isMember: d.members.some((m) => m.memberId === agent.id && m.memberType === "agent"),
            })).catch(() => null),
          ),
        );
        if (cancelled) return;
        setChannels(
          memberships
            .filter((m): m is NonNullable<typeof m> => m !== null && m.isMember)
            .map(({ id, name, type, joinedAt }) => ({ id, name, type, joinedAt })),
        );
      } catch (e) {
        if (cancelled) return;
        notifyThrown("Couldn't load rooms", e);
        setChannels([]);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, agent, channels, slug]);

  const loadRuns = useCallback(async (targetAgent: Agent | null = agent) => {
    if (!targetAgent) return;
    const requestId = ++runsRequestId.current;
    setRunsRefreshing(true);
    setRunsError(null);
    try {
      const data = await api.listAgentRuns({
        serverId: targetAgent.serverId,
        agentId: targetAgent.id,
        limit: 50,
      });
      let nextRuns = data.runs;
      if (focusedRunId && !nextRuns.some((run) => run.id === focusedRunId)) {
        focusedRunLookupRef.current = focusedRunId;
        try {
          const { run } = await api.getAgentRun(focusedRunId);
          if (run.agentId === targetAgent.id && run.serverId === targetAgent.serverId) {
            nextRuns = [run, ...nextRuns];
          }
        } catch {
          // The focused row may be hidden, deleted, or from another agent.
          // Keep the normal list usable and leave the missing focus silent.
        }
      }
      if (runsRequestId.current !== requestId) return;
      setRuns(dedupeAgentRuns(nextRuns));
    } catch (e) {
      if (runsRequestId.current !== requestId) return;
      setRunsError(e instanceof ApiError ? e.message : String(e));
      setRuns([]);
    } finally {
      if (runsRequestId.current === requestId) setRunsRefreshing(false);
    }
  }, [agent, focusedRunId]);

  useEffect(() => {
    if (tab !== "runs" || !agent || runs !== null) return;
    void loadRuns(agent);
  }, [tab, agent, runs, loadRuns]);

  useEffect(() => {
    if (tab !== "runs" || !agent || !focusedRunId || !runs) return;
    if (runs.some((run) => run.id === focusedRunId)) return;
    if (focusedRunLookupRef.current === focusedRunId) return;
    void loadRuns(agent);
  }, [agent, focusedRunId, loadRuns, runs, tab]);

  useEffect(() => {
    if (tab !== "runs" || !focusedRunId || !runs) return;
    const el = document.querySelector<HTMLElement>(`[data-run-id="${CSS.escape(focusedRunId)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedRunId, runs, tab]);

  useEffect(() => {
    if (tab !== "tasks" || !focusedTaskId || !tasks) return;
    const el = document.querySelector<HTMLElement>(`[data-agent-task-id="${CSS.escape(focusedTaskId)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedTaskId, tab, tasks]);

  async function handleDelete() {
    if (!agent) return;
    setDeleting(true);
    try {
      await api.deleteAgent(agent.id);
      notifySuccess(`Deleted ${agent.displayName}`);
      router.push(`/s/${slug}/settings`);
    } catch (e) {
      notifyThrown(`Delete ${agent.displayName} failed`, e);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const statusKey = live?.status ?? agent?.status ?? "offline";
  const statusInfo = STATUS_LABEL[statusKey] ?? STATUS_LABEL.offline;
  const headerSubtitle = useMemo(() => {
    const parts = [`@${agent?.name ?? ""}`, agent?.model ?? ""].filter(Boolean);
    return parts.join(" · ");
  }, [agent?.name, agent?.model]);
  const runSummary = useMemo(() => {
    if (!runs) return null;
    return {
      total: runs.length,
      active: runs.filter(isActiveRun).length,
      completed: runs.filter((r) => r.status === "completed").length,
      failed: runs.filter((r) => r.status === "failed").length,
    };
  }, [runs]);

  if (loading) {
    return <div className="flex h-full w-full flex-1 items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (error || !agent) {
    return (
      <div className="flex h-full w-full flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <h1 className="text-lg font-semibold">Agent unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error ?? "Not found."}</p>
          <Link href={`/s/${slug}/settings`} className="mt-4 inline-block text-sm underline">
            Back to settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* max-w-5xl keeps the action buttons next to the agent name on
          wide viewports instead of floating to the far right. Matches
          the body column constraint below so header + cards align. */}
      <header className="shrink-0 border-b border-border/70 bg-background/85 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-start">
          <GeneratedAvatar id={agent.id} name={agent.displayName} seed={agent.avatarSeed} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 max-w-full truncate text-xl font-semibold">{agent.displayName}</h1>
              <Chip size="sm" variant="soft" color={statusInfo.color} className="gap-1 text-[11px]">
                <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.text}
              </Chip>
            </div>
            <p className="min-w-0 max-w-full truncate text-xs text-muted-foreground" title={headerSubtitle}>{headerSubtitle}</p>
            {agent.description && <p className="mt-1 text-sm">{agent.description}</p>}
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
            {agent.dmChannelId ? (
              <Button render={<Link href={`/s/${slug}/dm/${agent.dmChannelId}`} />} className="flex-1 sm:flex-none">
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Open DM
              </Button>
            ) : (
              // Legacy agent created before auto-DM landed. The server's
              // GET /agents lazy-backfills a DM channel on demand — so
              // simply re-fetching the agent list creates one. Surface
              // that as an explicit affordance so the user isn't stuck.
              <Button onClick={() => void reload()} className="flex-1 sm:flex-none"
                title="Create a direct thread for this agent">
                <MessageSquare className="mr-1 h-3.5 w-3.5" /> Set up DM
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditOpen(true)} className="flex-1 sm:flex-none">
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="destructive-outline" onClick={() => setConfirmDelete(true)}
              className="flex-1 sm:flex-none"
              aria-label={`Delete ${agent.displayName}`}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {live?.label && (
          <p className="mx-auto mt-2 w-full max-w-5xl text-xs text-muted-foreground truncate">
            {live.label}{live.detail ? ` — ${live.detail}` : ""}
          </p>
        )}
      </header>

      {/* Tab nav sits in its own full-width bar (its own border-b),
          rather than nested inside the header at max-w-5xl with -mb-px.
          The old nesting made the header's bottom border peek out on
          the left + right of the centered tab strip and the active
          tab's 2px cyan border did not seam cleanly with the surrounding
          1px gray — visually "the top bar was a half / broken edge". */}
      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => selectTab(key as TabKey)}
        className="shrink-0 border-b border-border/70 bg-background/85 backdrop-blur"
      >
        <TabsListContainer className="mx-auto w-full max-w-5xl px-3 py-2 sm:px-6">
          <TabsList aria-label="Agent sections" className="flex w-full min-w-0 gap-1 rounded-[10px] border border-border/70 bg-[var(--surface-secondary)] p-1 shadow-xs">
          {([
            { key: "chat",     label: "Chat",     icon: MessageSquare },
            { key: "runs",     label: "Runs",     icon: Activity },
            { key: "tasks",    label: "Tasks",    icon: ListChecks },
            { key: "channels", label: "Rooms", icon: Hash },
            { key: "settings", label: "Settings", icon: SettingsIcon },
          ] as const).map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <TabsTrigger
                key={t.key}
                id={t.key}
                className={cn(
                  "h-8 min-w-0 flex-1 justify-center gap-1 rounded-[8px] border border-transparent px-1 text-[11px] transition-[background-color,color,border-color,box-shadow] min-[420px]:px-1.5 min-[420px]:text-xs sm:gap-1.5 sm:px-3 sm:text-sm",
                  active
                    ? "border-accent/25 bg-[var(--accent-soft)] text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{t.label}</span>
              </TabsTrigger>
            );
          })}
          </TabsList>
        </TabsListContainer>
      </Tabs>

      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
        <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-4">
          {tab === "chat" && (
            <>
              {agent.systemPrompt && <SystemPromptCard prompt={agent.systemPrompt} />}
              <Card>
                <CardHeader>
                  <CardTitle>Recent DM history</CardTitle>
                  <CardDescription>
                    {agent.dmChannelId ? "Last 20 direct messages between you two." : "No direct thread yet."}
                  </CardDescription>
                </CardHeader>
                <CardPanel>
                  {historyError && <p className="text-sm text-danger-text">{historyError}</p>}
                  {!historyError && history === null && agent.dmChannelId && (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  )}
                  {history && history.length === 0 && (
                    <p className="text-sm text-muted-foreground">No messages yet. Open the DM to say hi.</p>
                  )}
                  {history && history.length > 0 && (
                    <ul className="space-y-2">
                      {history.map((m) => (
                      <Card render={<li />} key={m.id} className="border-transparent bg-[var(--surface-secondary)] !shadow-none">
                        <CardPanel className="p-2 text-sm">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{m.senderType === "agent" ? agent.displayName : "You"}</span>
                            <time>{new Date(m.createdAt).toLocaleString()}</time>
                          </div>
                          <p className="mt-1 min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{m.content}</p>
                        </CardPanel>
                      </Card>
                      ))}
                    </ul>
                  )}
                </CardPanel>
              </Card>
            </>
          )}

          {tab === "runs" && (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Work log
                  </CardTitle>
                  <CardDescription>
                    Recent work this agent started, completed, or could not finish.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadRuns(agent)}
                  loading={runsRefreshing}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", runsRefreshing && "animate-spin")} />
                  Refresh
                </Button>
              </CardHeader>
              <CardPanel className="pt-0">
                {runSummary && (
                  <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    {[
                      ["Recent", runSummary.total],
                      ["Active", runSummary.active],
                      ["Completed", runSummary.completed],
                      ["Failed", runSummary.failed],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-border/70 bg-[var(--surface-secondary)] px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">{label}</div>
                        <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {runsError && (
                  <p className="mb-3 text-sm text-danger-text">{runsError}</p>
                )}
                {runs === null && (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                )}
                {runs && runs.length === 0 && !runsError && (
                  <p className="text-sm text-muted-foreground">
                    No work log yet. Mention this agent in a workflow room or open its DM to create a traceable run.
                  </p>
                )}
                {runs && runs.length > 0 && (
                  <ol className="divide-y divide-border/70 overflow-hidden rounded-lg border border-border/70">
                    {runs.map((run) => {
                      const meta = RUN_STATUS_META[run.status];
                      const isDmRun = run.source === "dm";
                      const channelHref = `/s/${slug}/${isDmRun ? "dm" : "channel"}/${run.channelId}`;
                      return (
                        <li
                          key={run.id}
                          data-run-id={run.id}
                          className={cn(
                            "bg-background p-3 text-sm transition-[background-color,box-shadow] hover:bg-[var(--surface-secondary)]",
                            focusedRunId === run.id && "shadow-[inset_3px_0_0_var(--accent)]",
                          )}
                        >
                          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <Chip size="sm" variant="soft" color={meta.color} className="gap-1 text-[11px]">
                                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                  {meta.label}
                                </Chip>
                                <Chip size="sm" variant="soft" color="default" className="text-[11px]">
                                  {RUN_SOURCE_LABEL[run.source]}
                                </Chip>
                                <Chip size="sm" variant="soft" color="default" className="text-[11px] capitalize">
                                  {formatRuntimeMode(run.runtimeMode)}
                                </Chip>
                              </div>
                              <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                                <div>
                                  <span className="font-medium text-foreground">Created</span>{" "}
                                  {formatRunTime(run.createdAt)}
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">Duration</span>{" "}
                                  {formatRunDuration(run)}
                                </div>
                                {run.taskId && (
                                  <div>
                                    <span className="font-medium text-foreground">Task</span>{" "}
                                    <Link
                                      href={`/s/${encodeURIComponent(slug)}/tasks?taskId=${encodeURIComponent(run.taskId)}`}
                                      className="underline-offset-2 hover:underline"
                                    >
                                      {run.taskId.slice(0, 8)}
                                    </Link>
                                  </div>
                                )}
                              </div>
                              {run.inputPreview && (
                                <p className="mt-2 min-w-0 whitespace-pre-wrap rounded-md bg-[var(--surface-secondary)] px-2.5 py-2 text-xs [overflow-wrap:anywhere]">
                                  {run.inputPreview}
                                </p>
                              )}
                              {run.error && (
                                <p className="mt-2 min-w-0 whitespace-pre-wrap rounded-md border border-danger/30 bg-danger/10 px-2.5 py-2 text-xs text-danger-text [overflow-wrap:anywhere]">
                                  {summarizeRunError(run.error)}
                                </p>
                              )}
                            </div>
                            <Button
                              render={<Link href={channelHref} />}
                              variant="ghost"
                              size="xs"
                              className="shrink-0 justify-center sm:justify-start"
                            >
                              {isDmRun ? "Open DM" : "Open room"} <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardPanel>
            </Card>
          )}

          {tab === "tasks" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Assigned to {agent.displayName}
                </CardTitle>
                <CardDescription>
                  Tasks where this agent is the assignee, across every workflow room.
                </CardDescription>
              </CardHeader>
              <CardPanel>
                {tasks === null && <p className="text-sm text-muted-foreground">Loading…</p>}
                {tasksError && (
                  <p className="text-sm text-danger-text">Couldn&apos;t load tasks: {tasksError}</p>
                )}
                {tasks && tasks.length === 0 && !tasksError && (
                  <p className="text-sm text-muted-foreground">
                    No tasks assigned. Convert a message into a task and assign it to <span className="font-medium text-foreground">{agent.displayName}</span> to see it here.
                  </p>
                )}
                {tasks && tasks.length > 0 && (
                  <ul className="space-y-2">
                    {tasks.map((t) => {
                      const latestRun = t.latestRun?.agentId === agent.id ? t.latestRun : null;
                      const otherAgentRun = !!t.latestRun && t.latestRun.agentId !== agent.id;
                      return (
                        <Card
                          render={<li />}
                          key={t.id}
                          data-agent-task-id={t.id}
                          className={cn(
                            "border-transparent bg-[var(--surface-secondary)] !shadow-none transition-[border-color,box-shadow]",
                            focusedTaskId === t.id && "border-accent/60 shadow-[0_0_0_2px_var(--accent-soft)]",
                          )}
                        >
                          <CardPanel className="flex flex-wrap items-center gap-3 p-3 text-sm">
                          <span className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            t.status === "done" ? "bg-[var(--success)]"
                              : t.status === "in_progress" ? "bg-[var(--accent)]"
                              : t.status === "in_review" ? "bg-[var(--warning)]"
                              : "bg-muted-foreground/70",
                          )} aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{t.title ?? `#${t.taskNumber}`}</div>
                            <div className="text-[11px] text-muted-foreground">
                              #{t.taskNumber} · {t.status.replace(/_/g, " ")} ·{" "}
                              updated {new Date(t.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          {latestRun ? (
                            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 pl-5 text-[11px] text-muted-foreground sm:w-auto sm:justify-end sm:pl-0">
                              <Chip size="sm" variant="soft" color={RUN_STATUS_META[latestRun.status].color}>
                                {RUN_STATUS_META[latestRun.status].label}
                              </Chip>
                              <span className="min-w-0 truncate">
                                {RUN_SOURCE_LABEL[latestRun.source]} · {formatRuntimeMode(latestRun.runtimeMode)}
                              </span>
                              {latestRun.error && (
                                <span className="w-full min-w-0 truncate text-danger-text sm:max-w-64">
                                  {summarizeRunError(latestRun.error)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full pl-5 sm:w-auto sm:pl-0">
                              <Chip size="sm" variant="soft" color="default">
                                {otherAgentRun ? "Run by other agent" : "Not started"}
                              </Chip>
                            </div>
                          )}
                          <Link
                            href={`/s/${encodeURIComponent(slug)}/tasks?taskId=${encodeURIComponent(t.id)}`}
                            className="w-full pl-5 text-[11px] font-medium text-primary underline-offset-2 hover:underline sm:w-auto sm:pl-0"
                          >
                            Open task
                          </Link>
                          </CardPanel>
                        </Card>
                      );
                    })}
                  </ul>
                )}
              </CardPanel>
            </Card>
          )}

          {tab === "channels" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Member of
                </CardTitle>
                <CardDescription>
                  Workflow rooms this agent listens in. To add or remove it,
                  open the room and edit its member list.
                </CardDescription>
              </CardHeader>
              <CardPanel>
                {channels === null && <p className="text-sm text-muted-foreground">Loading…</p>}
                {channels && channels.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Not a member of any workflow room yet (except its own DM).
                  </p>
                )}
                {channels && channels.length > 0 && (
                  <ul className="space-y-1.5">
                    {channels.map((c) => (
                      <Card render={<li />} key={c.id} className="border-transparent bg-[var(--surface-secondary)] !shadow-none transition-colors hover:border-accent/25">
                        <CardPanel className="flex min-w-0 items-center justify-between gap-3 px-3 py-2 text-sm">
                        <Link
                          href={`/s/${slug}/${c.type === "dm" ? "dm" : "channel"}/${c.id}`}
                          className="flex min-w-0 flex-1 items-center gap-2"
                        >
                          <span className="text-muted-foreground" aria-hidden="true">
                            {c.type === "dm" ? "@" : c.type === "private" ? "🔒" : "#"}
                          </span>
                          <span className="truncate font-medium">{c.name}</span>
                        </Link>
                        <span className="shrink-0 text-[10.5px] text-muted-foreground">
                          since {new Date(c.joinedAt).toLocaleDateString()}
                        </span>
                        </CardPanel>
                      </Card>
                    ))}
                  </ul>
                )}
              </CardPanel>
            </Card>
          )}

          {tab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" /> Settings
                </CardTitle>
                <CardDescription>
                  Edit display name, system prompt, runtime, model. Identifier (@handle) is immutable.
                </CardDescription>
              </CardHeader>
              <CardPanel>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Button onClick={() => setEditOpen(true)}>
                    <Pencil className="me-1 h-3.5 w-3.5" /> Edit agent
                  </Button>
                  <Button variant="destructive-outline" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="me-1 h-3.5 w-3.5" /> Delete agent
                  </Button>
                </div>
                <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-2">
                  <dt className="text-muted-foreground">Identifier</dt>
                  <dd className="min-w-0 break-all font-mono">@{agent.name}</dd>
                  <dt className="text-muted-foreground">Runtime</dt>
                  <dd><Chip size="sm" variant="soft" color="accent" className="capitalize">{agent.runtime}</Chip></dd>
                  <dt className="text-muted-foreground">Model</dt>
                  <dd className="min-w-0 break-all font-mono">{agent.model}</dd>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(agent.createdAt).toLocaleString()}</dd>
                </dl>
                {agent.description && (
                  <div className="mt-6">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Description</p>
                    <p className="mt-1 text-sm">{agent.description}</p>
                  </div>
                )}
              </CardPanel>
            </Card>
          )}
        </div>
      </div>

      <EditAgentDialog
        agent={agent}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => { void reload(); }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {agent.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the agent and its DM room. Past
              messages in shared rooms are preserved but the agent will
              no longer respond.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>Delete</Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
}
