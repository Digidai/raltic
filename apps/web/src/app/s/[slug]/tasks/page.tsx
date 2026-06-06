"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { api, type Channel, type Agent, type TaskRow } from "@/lib/api";
import { notifyThrown } from "@/lib/notify";
import { Card, CardHeader, CardTitle, CardPanel } from "@/components/heroui-pro/card";
import { Button } from "@/components/heroui-pro/button";
import { Input } from "@/components/heroui-pro/input";
import { Select } from "@/components/heroui-pro/select";
import { Chip } from "@/components/heroui-pro/chip";
import { Activity, ExternalLink, ListChecks } from "lucide-react";
import { WorkspacePage } from "@/components/workspace-page";
import { cn } from "@/lib/utils";
import { sanitizeUserVisibleError } from "@raltic/protocol";

type Task = TaskRow;
type RunStatus = NonNullable<Task["latestRun"]>["status"];

const COLUMNS = [
  { key: "todo",        label: "To do",         color: "default" },
  { key: "in_progress", label: "In progress",   color: "accent" },
  { key: "in_review",   label: "In review",     color: "warning" },
  { key: "done",        label: "Done",          color: "success" },
] as const satisfies readonly {
  key: Task["status"];
  label: string;
  color: "default" | "accent" | "warning" | "success";
}[];

const RUN_STATUS_META = {
  queued: { label: "Queued", color: "default" },
  dispatched: { label: "Dispatched", color: "default" },
  running: { label: "Running", color: "accent" },
  waiting_input: { label: "Waiting", color: "warning" },
  completed: { label: "Completed", color: "success" },
  failed: { label: "Failed", color: "danger" },
  cancelled: { label: "Cancelled", color: "default" },
} as const satisfies Record<RunStatus, { label: string; color: "default" | "accent" | "warning" | "success" | "danger" }>;

function formatRunSource(source: string): string {
  if (source === "channel_mention") return "Room mention";
  if (source === "channel_message") return "Room message";
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

function summarizeRunError(error: string): string {
  const redacted = sanitizeUserVisibleError(error, 180) ?? "";
  return redacted.length > 180 ? `${redacted.slice(0, 177)}...` : redacted;
}

function mergeFocusedTasks(base: Task[], focused: Task[]): Task[] {
  if (focused.length === 0) return base;
  const seen = new Set(base.map((task) => task.id));
  const missingFocused = focused.filter((task) => !seen.has(task.id));
  return missingFocused.length === 0 ? base : [...missingFocused, ...base];
}

export default function TaskBoardPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const focusedTaskId = searchParams.get("taskId");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [serverId, setServerId] = useState<string>("");
  const [filterChannel, setFilterChannel] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Create form
  const [title, setTitle] = useState("");
  const [createChannel, setCreateChannel] = useState<string>("");
  const [createAssignee, setCreateAssignee] = useState<string>("");
  const channelSelectOptions = channels.map((channel) => ({ value: channel.id, label: `#${channel.name}` }));
  const selectedCreateChannel = channels.find((channel) => channel.id === createChannel);
  const allowedAgentIds = useMemo(() => selectedCreateChannel?.agentIds
    ? new Set(selectedCreateChannel.agentIds)
    : null, [selectedCreateChannel?.agentIds]);
  const assignableAgents = allowedAgentIds
    ? agents.filter((agent) => allowedAgentIds.has(agent.id))
    : agents;
  const assigneeSelectOptions = [
    { value: "", label: "Unassigned" },
    ...assignableAgents.map((agent) => ({ value: agent.id, label: agent.displayName })),
  ];

  useEffect(() => {
    let cancelled = false;
    setServerId("");
    setFilterChannel("");
    setChannels([]);
    setAgents([]);
    setCreateChannel("");
    setTasks([]);
    setTasksError(null);
    setWorkspaceError(null);
    (async () => {
      try {
        const data = await api.getServerBySlug(slug);
        if (cancelled) return;
        setServerId(data.server.id);
        setChannels(data.channels);
        setAgents(data.agents);
        setCreateChannel(data.channels[0]?.id ?? "");
        setCreateAssignee("");
      } catch (e) {
        if (!cancelled) {
          setServerId("");
          setChannels([]);
          setAgents([]);
          setTasks([]);
          setWorkspaceError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
        notifyThrown("Couldn't load server", e);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTasksError(null);
    (async () => {
      try {
        if (!serverId && !filterChannel) {
          if (!cancelled) setTasks([]);
          return;
        }
        const scope = filterChannel ? { channelId: filterChannel } : { serverId };
        const [data, focusedData] = await Promise.all([
          api.listTasks(scope),
          focusedTaskId ? api.listTasks({ ...scope, taskId: focusedTaskId, limit: 1 }) : Promise.resolve(null),
        ]);
        if (!cancelled) setTasks(focusedData ? mergeFocusedTasks(data.tasks, focusedData.tasks) : data.tasks);
      } catch (e) {
        if (!cancelled) {
          setTasks([]);
          setTasksError(e instanceof Error ? e.message : String(e));
        }
        notifyThrown("Couldn't load tasks", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filterChannel, focusedTaskId, serverId]);

  useEffect(() => {
    if (!createAssignee) return;
    if (!assignableAgents.some((agent) => agent.id === createAssignee)) {
      setCreateAssignee("");
    }
  }, [assignableAgents, createAssignee]);

  useEffect(() => {
    if (!focusedTaskId || tasks.length === 0) return;
    const el = document.querySelector<HTMLElement>(`[data-task-id="${CSS.escape(focusedTaskId)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedTaskId, tasks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !createChannel) return;
    try {
      const titleText = title.trim();
      const assignedAgentId = createAssignee || undefined;
      const res = await api.createTask({
        channelId: createChannel,
        title: titleText,
        ...(assignedAgentId ? { assigneeId: assignedAgentId, assigneeType: "agent" as const } : {}),
      });
      setTitle("");
      // Optimistically prepend with title — backend echoes it back via the
      // joined message content on next listTasks refresh.
      setTasks((prev) => [{
        id: res.id, channelId: createChannel, messageId: "",
        taskNumber: res.taskNumber, title: titleText, status: "todo",
        assigneeId: assignedAgentId ?? null, assigneeType: assignedAgentId ? "agent" : null,
        createdAt: Date.now(), updatedAt: Date.now(),
        latestRun: null,
      }, ...prev]);
    } catch (e) {
      notifyThrown("Couldn't create task", e);
    }
  }

  async function move(t: Task, status: Task["status"]) {
    setTasks((prev) => prev.map(p => p.id === t.id ? { ...p, status } : p));
    try { await api.updateTask(t.id, { status }); }
    catch (e) {
      notifyThrown("Couldn't move task", e);
      setTasks((prev) => prev.map(p => p.id === t.id ? t : p));
    }
  }

  const channelById = new Map(channels.map(c => [c.id, c]));
  const labelFor = (a: Task["assigneeType"], id: string | null) => {
    if (!id) return null;
    if (a === "agent") return agents.find(g => g.id === id)?.displayName ?? id.slice(0, 6);
    return id.slice(0, 6);
  };

  return (
    <WorkspacePage
      title="Tasks"
      description="Kanban view of work across workflow rooms and agent runs."
      icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
      tone="warning"
      contentClassName="space-y-5"
      actions={
          <Select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="w-full sm:w-44 sm:shrink-0"
            aria-label="Filter by room"
            options={[{ value: "", label: "All rooms" }, ...channelSelectOptions]}
          >
          </Select>
      }
    >
        {workspaceError ? (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-text">
            Couldn&apos;t load workspace: {workspaceError}
          </div>
        ) : (
          <>
        <Card className="border-border/70 bg-surface/80 !shadow-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Quick add</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreate}>
            <CardPanel className="px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={createChannel}
            onChange={(e) => setCreateChannel(e.target.value)}
            className="w-full sm:w-40 sm:shrink-0"
            aria-label="Task room"
            options={channelSelectOptions}
          >
          </Select>
                <Select
                  value={createAssignee}
                  onChange={(e) => setCreateAssignee(e.target.value)}
                  className="w-full sm:w-44 sm:shrink-0"
                  aria-label="Task owner"
                  options={assigneeSelectOptions}
                >
                </Select>
                <Input value={title}
                  aria-label="Task title"
                  onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                  placeholder="Task title — what needs doing?" className="min-w-0 flex-1" />
                <Button type="submit" className="w-full sm:w-auto">Add</Button>
              </div>
            </CardPanel>
          </form>
        </Card>

        {tasksError && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-text">
            Couldn&apos;t load tasks: {tasksError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <Card key={col.key} className="min-w-0 border-border/60 bg-surface/70 !shadow-none">
                <CardPanel className="p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col.label}
                  </h3>
                  <Chip size="sm" variant="soft" color={col.color}>
                    {colTasks.length}
                  </Chip>
                </div>
                <div className="space-y-2">
                  {loading && col.key === "todo" && (
                    <p className="text-xs text-muted-foreground">Loading…</p>
                  )}
                  {colTasks.map(t => (
                    <Card
                      key={t.id}
                      data-testid="task-card"
                      data-task-id={t.id}
                      className={cn(
                        "border-transparent bg-background/80 !shadow-none transition-[border-color,box-shadow]",
                        focusedTaskId === t.id && "border-accent/60 shadow-[0_0_0_2px_var(--accent-soft)]",
                      )}
                    >
                      <CardPanel className="p-2 text-xs">
                      <div className="flex min-w-0 items-baseline justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">#{t.taskNumber}</span>
                        <span className="min-w-0 truncate text-[10px] text-muted-foreground">
                          {channelById.get(t.channelId)?.name ?? t.channelId.slice(0, 6)}
                        </span>
                      </div>
                      <div className="mt-1 break-words text-sm font-medium leading-snug text-foreground">
                        {t.title ?? "(untitled)"}
                      </div>
                      {t.assigneeId && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          → {labelFor(t.assigneeType, t.assigneeId)}
                        </div>
                      )}
                      {t.latestRun ? (
                        <div className="mt-2 rounded-md border border-border/60 bg-surface/70 p-2">
                          <div className="flex min-w-0 items-center justify-between gap-2">
                            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                              <Activity className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span className="whitespace-nowrap">Agent work</span>
                            </div>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={RUN_STATUS_META[t.latestRun.status].color}
                              className="h-5 shrink-0 px-1.5 text-[10px]"
                            >
                              {RUN_STATUS_META[t.latestRun.status].label}
                            </Chip>
                          </div>
                          <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[10px] text-muted-foreground">
                            <span className="min-w-0 truncate">
                              {formatRunSource(t.latestRun.source)} · {formatRuntimeMode(t.latestRun.runtimeMode)}
                            </span>
                            <span className="shrink-0">{formatRelativeTime(t.latestRun.updatedAt)}</span>
                          </div>
                          {t.latestRun.error && (
                            <p className="mt-1 line-clamp-2 break-words text-[10px] leading-snug text-danger-text">
                              {summarizeRunError(t.latestRun.error)}
                            </p>
                          )}
                          <Link
                            href={`/s/${encodeURIComponent(slug)}/agents/${encodeURIComponent(t.latestRun.agentId)}?tab=runs&runId=${encodeURIComponent(t.latestRun.id)}`}
                            className="mt-1 inline-flex max-w-full items-center gap-1 text-[10px] font-medium text-primary hover:underline"
                          >
                            <span className="truncate">Open agent</span>
                            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                          </Link>
                        </div>
                      ) : t.assigneeType === "agent" ? (
                        <div className="mt-2 rounded-md border border-dashed border-border/60 px-2 py-1.5 text-[10px] text-muted-foreground">
                          Not started
                        </div>
                      ) : null}
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {COLUMNS.filter(c => c.key !== col.key).map(other => (
                          <Button
                            key={other.key}
                            type="button"
                            onClick={() => move(t, other.key)}
                            variant="outline"
                            size="xs"
                            className="h-6 min-w-0 px-1.5 text-[10px]"
                            title={`Move to ${other.label}`}
                          >
                            <span className="truncate">{other.label}</span>
                          </Button>
                        ))}
                      </div>
                      </CardPanel>
                    </Card>
                  ))}
                </div>
                </CardPanel>
              </Card>
            );
          })}
        </div>
          </>
        )}
    </WorkspacePage>
  );
}
