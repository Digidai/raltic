"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type Server } from "@/lib/api";
import { notifyThrown } from "@/lib/notify";
import { Activity, AlertTriangle, ClipboardCheck, Inbox as InboxIcon, MessageSquare, ListChecks, Hash, Lock, ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/heroui-pro/button";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { WorkspaceEmptyState, WorkspacePage } from "@/components/workspace-page";

/**
 * Work queue — answers "what needs attention in this workspace".
 *
 * Aggregates review tasks, blocked/failed agent runs, assigned tasks,
 * and unread handoffs for the current workspace. Mentions land in a
 * Phase 2 expansion (needs a schema column so the mention lookup
 * doesn't full-scan messages).
 *
 * Server-side does the heavy lifting (joins + filters + sort); this
 * page is a thin list view. Items are clickable links straight to the
 * source channel — clicking marks the corresponding DM as read on the
 * server's next /channels/:id/read poll, so the inbox shrinks as you
 * triage.
 */
type InboxItem = Awaited<ReturnType<typeof api.getInbox>>["items"][number];
type QueueFilter = "all" | "review" | "agent_runs" | "tasks" | "handoffs";

export default function InboxPage() {
  const { slug } = useParams<{ slug: string }>();
  const [server, setServer] = useState<Server | null>(null);
  // Tri-state — `null` = still loading, `Item[]` = loaded (possibly empty),
  // `Error` = load failed. The previous `setItems([])` on failure showed
  // the "You're caught up" empty state to users whose inbox actually had
  // unread items the server just couldn't reach. Misleading.
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  // Reload counter so the retry button re-fires the effect.
  const [reloadCount, setReloadCount] = useState(0);
  const [filter, setFilter] = useState<QueueFilter>("all");

  const visibleItems = useMemo(() => {
    if (!items) return null;
    return items.filter((item) => {
      if (filter === "all") return true;
      if (filter === "review") return item.kind === "task" && item.status === "in_review";
      if (filter === "agent_runs") return item.kind === "agent_run";
      if (filter === "tasks") return item.kind === "task" && item.status !== "in_review";
      return item.kind === "dm";
    });
  }, [filter, items]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setItems(null);
    setTotalCount(null);
    (async () => {
      try {
        const data = await api.getServerBySlug(slug);
        if (cancelled) return;
        setServer(data.server);
        const inbox = await api.getInbox(data.server.id);
        if (cancelled) return;
        setItems(inbox.items);
        setTotalCount(inbox.totalCount ?? inbox.count ?? inbox.items.length);
      } catch (e) {
        if (cancelled) return;
        notifyThrown("Couldn't load inbox", e);
        setLoadError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => { cancelled = true; };
  }, [slug, reloadCount]);

  if (!server) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <WorkspacePage
      title="Work queue"
      description={<>Team-visible review gates, blocked agent work, assigned tasks, and unread handoffs in {server.name}.</>}
      icon={<InboxIcon className="h-5 w-5" aria-hidden="true" />}
      tone="accent"
      contentClassName="flex flex-col gap-3"
    >
          {loadError && (
            <Card className="border-destructive/30 bg-destructive/5 text-center">
              <CardPanel className="p-6">
              <p className="text-sm font-medium text-danger-text">Couldn't load inbox</p>
              <p className="mt-1 text-xs text-muted-foreground break-words">{loadError.message}</p>
              <Button
                type="button"
                onClick={() => setReloadCount((n) => n + 1)}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Try again
              </Button>
              </CardPanel>
            </Card>
          )}

          {!loadError && items === null && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}

          {!loadError && items && items.length === 0 && (
            <WorkspaceEmptyState
              icon={<InboxIcon className="h-8 w-8" />}
              title="You're caught up."
              description={
                <>
                No review gates, blocked runs, assigned tasks, or unread handoffs. Start another workflow when you are ready for the next agent run.
                </>
              }
              action={
                <Button render={<Link href={`/s/${slug}`} />} size="sm" className="justify-center">
                  Start a workflow
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              }
            />
          )}

          {!loadError && items && items.length > 0 && visibleItems && (
            <>
              <QueueFilters items={items} totalCount={totalCount ?? items.length} value={filter} onChange={setFilter} />
              {(totalCount ?? items.length) > items.length && (
                <Card className="border-warning/25 bg-[var(--warning-soft)] !shadow-none">
                  <CardPanel className="flex flex-col gap-1 p-3 text-xs text-[var(--warning-soft-foreground)] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Showing the first {items.length} of {totalCount} queue items. Resolve visible work first, then refresh for the next batch.
                    </span>
                    <Button
                      type="button"
                      onClick={() => setReloadCount((n) => n + 1)}
                      variant="outline"
                      size="xs"
                      className="w-full justify-center sm:w-auto"
                    >
                      Refresh queue
                    </Button>
                  </CardPanel>
                </Card>
              )}
              {visibleItems.length === 0 ? (
                <Card className="border-dashed bg-surface/60 !shadow-none">
                  <CardPanel className="p-4 text-sm text-muted-foreground">
                    No queue items match this filter.
                  </CardPanel>
                </Card>
              ) : (
                <ul className="space-y-2" data-testid="work-queue-list">
                  {visibleItems.map((item) => (
                    <InboxRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </>
          )}
    </WorkspacePage>
  );
}

function QueueFilters({
  items,
  totalCount,
  value,
  onChange,
}: {
  items: InboxItem[];
  totalCount: number;
  value: QueueFilter;
  onChange: (value: QueueFilter) => void;
}) {
  const options: Array<{ value: QueueFilter; label: string; count: number }> = [
    { value: "all", label: "All", count: totalCount },
    { value: "review", label: "Review", count: items.filter((item) => item.kind === "task" && item.status === "in_review").length },
    { value: "agent_runs", label: "Agent runs", count: items.filter((item) => item.kind === "agent_run").length },
    { value: "tasks", label: "Tasks", count: items.filter((item) => item.kind === "task" && item.status !== "in_review").length },
    { value: "handoffs", label: "Handoffs", count: items.filter((item) => item.kind === "dm").length },
  ];
  return (
    <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Work queue filters">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="xs"
          variant={value === option.value ? "default" : "outline"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="h-7 gap-1.5 rounded-full px-2.5 text-xs"
        >
          {option.label}
          <span className="font-mono text-[10px] opacity-75">{option.count}</span>
        </Button>
      ))}
    </div>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  const meta = queueItemMeta(item);
  const Icon = meta.icon;
  const channelIcon = item.channelType === "private" ? Lock : item.channelType === "dm" ? MessageSquare : Hash;
  const ChannelIcon = channelIcon;
  return (
    <li>
      <Card
        render={<Link href={item.href} />}
        className="flex items-start gap-3 border-border/60 bg-surface/80 p-3 !shadow-none transition-colors hover:border-accent/25 hover:bg-[var(--accent-soft)]"
      >
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          meta.iconClass,
        )}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <ChannelIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{item.channelType === "dm" ? "Direct message" : `#${item.channelName}`}</span>
            </span>
            <Chip size="sm" variant="soft" color={meta.color} className="text-[9px] uppercase tracking-wider">
              {meta.label}
            </Chip>
            <time className="shrink-0">{relativeTime(item.createdAt)}</time>
          </div>
          <p className="mt-1 text-sm leading-snug line-clamp-2">
            {item.preview}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      </Card>
    </li>
  );
}

function queueItemMeta(item: InboxItem): {
  label: string;
  color: "accent" | "warning" | "danger" | "default";
  icon: LucideIcon;
  iconClass: string;
} {
  if (item.kind === "agent_run") {
    if (item.status === "failed") {
      return {
        label: "failed",
        color: "danger",
        icon: AlertTriangle,
        iconClass: "bg-[var(--danger-soft)] text-[var(--danger-soft-foreground)] ring-1 ring-destructive/15",
      };
    }
    return {
      label: "waiting",
      color: "warning",
      icon: Activity,
      iconClass: "bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)] ring-1 ring-warning/15",
    };
  }
  if (item.kind === "task") {
    if (item.status === "in_review") {
      return {
        label: "review",
        color: "warning",
        icon: ClipboardCheck,
        iconClass: "bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)] ring-1 ring-warning/15",
      };
    }
    return {
      label: "task",
      color: "default",
      icon: ListChecks,
      iconClass: "bg-[var(--default-soft)] text-[var(--default-soft-foreground)] ring-1 ring-border/60",
    };
  }
  return {
    label: "handoff",
    color: "accent",
    icon: MessageSquare,
    iconClass: "bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] ring-1 ring-accent/15",
  };
}

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
}
