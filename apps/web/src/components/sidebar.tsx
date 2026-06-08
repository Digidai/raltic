"use client";

import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Sidebar as HeroSidebar, useSidebar } from "@heroui-pro/react/sidebar";
import { Sheet } from "@heroui-pro/react/sheet";
import { api, type Channel, type Agent, type AgentRun, type TaskRow } from "@/lib/api";
import { Activity, BellOff, Lock, MessageSquare, Plus, ListTodo, Cpu, Star, Workflow, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateChannelDialog } from "./create-channel-dialog";
import { NewDmDialog } from "./new-dm-dialog";
import { Button } from "@/components/heroui-pro/button";
import { useGateway, useChannelUnread, useWorkspacePresence } from "@/hooks/use-agent-activity";
import { RalticWordmark } from "./raltic-logo";
import { UserPill } from "./user-pill";

interface SidebarProps {
  serverSlug: string;
  serverId: string;
  serverName: string;
  serverIconUrl?: string | null;
}

export function Sidebar({ serverSlug, serverId, serverName, serverIconUrl }: SidebarProps) {
  const [openCreate, setOpenCreate] = useState(false);
  const [openNewDm, setOpenNewDm] = useState(false);
  const { seedChannel, setMutedChannelIds } = useGateway();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workDataError, setWorkDataError] = useState<string | null>(null);
  const [loadedServerSlug, setLoadedServerSlug] = useState<string | null>(null);
  const activeChannelId = params.channelId as string | undefined;

  // refreshKey bumps trigger a re-fetch from child actions that
  // mutate workspace channels — currently:
  //   - NewDmDialog onOpened (a new DM channel exists after find-or-create)
  //   - Channels browse page join (custom event bubbled up through window)
  // Without these, the sidebar's local channels[] is stale until a hard
  // reload and the just-created channel doesn't appear in the section.
  const [refreshKey, setRefreshKey] = useState(0);
  const reloadChannels = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setWorkDataError(null);
      try {
        const data = await api.getServerBySlug(serverSlug);
        const [agentData, taskResult, runResult] = await Promise.all([
          api.listAgents().catch(() => null),
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
        const signalErrors: string[] = [];
        setChannels(data.channels);
        setAgents((agentData?.agents ?? data.agents).filter((a) => a.serverId === data.server.id));
        if (taskResult.ok) {
          setTasks(taskResult.value.tasks);
        } else {
          setTasks([]);
          signalErrors.push(`tasks: ${errorMessage(taskResult.error)}`);
        }
        if (runResult.ok) {
          setAgentRuns(runResult.value.runs);
        } else {
          setAgentRuns([]);
          signalErrors.push(`agent runs: ${errorMessage(runResult.error)}`);
        }
        setWorkDataError(signalErrors.length > 0 ? signalErrors.join("; ") : null);
        // Phase F HIGH (codex G2) — publish muted channel set to the
        // gateway so the channel_new Notification gate suppresses
        // toasts for channels the user has muted.
        setMutedChannelIds(new Set(
          data.channels.filter((c) => c.mutedAt != null).map((c) => c.id),
        ));
        // Seed gateway with initial unread state so the sidebar can render
        // accurate badges from the first paint.
        for (const c of data.channels) {
          const unread = c.unread ?? 0;
          const maxSeq = c.maxSeq ?? unread;
          const lastReadSeq = c.lastReadSeq ?? Math.max(0, maxSeq - unread);
          seedChannel(c.id, maxSeq, lastReadSeq);
        }
        setLoadedServerSlug(serverSlug);
      } catch (error) {
        if (cancelled) return;
        setChannels([]);
        setAgents([]);
        setTasks([]);
        setAgentRuns([]);
        setLoadError(errorMessage(error));
        setWorkDataError(null);
        setMutedChannelIds(new Set());
        setLoadedServerSlug(serverSlug);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [serverSlug, seedChannel, setMutedChannelIds, refreshKey]);

  // Cross-component channel-mutation signal. The Channels browse page
  // dispatches `raltic:channels-changed` on join/leave so the sidebar
  // refreshes without prop drilling a callback through Next's route layer.
  useEffect(() => {
    function onChanged() { reloadChannels(); }
    window.addEventListener("raltic:channels-changed", onChanged);
    return () => window.removeEventListener("raltic:channels-changed", onChanged);
  }, [reloadChannels]);

  // Phase E — within low-signal ties, starred channels sort first
  // (most recently starred → least). Workflow urgency now wins first:
  // needs-review / running / failed / open-task workflows should surface
  // before quiet starred workflows in the work cockpit.
  const sortStarredFirst = (a: Channel, b: Channel) => {
    const aS = a.starredAt ?? 0;
    const bS = b.starredAt ?? 0;
    if (aS !== bS) return bS - aS;
    return 0; // preserve original order otherwise
  };
  const workflowSummaryByChannel = useMemo(
    () => buildWorkflowSummaryByChannel(channels, tasks, agentRuns),
    [channels, tasks, agentRuns],
  );
  const sortWorkflowFirst = (a: Channel, b: Channel) => {
    const signal = workflowPriority(workflowSummaryByChannel.get(a.id)) - workflowPriority(workflowSummaryByChannel.get(b.id));
    if (signal !== 0) return signal;
    return sortStarredFirst(a, b);
  };
  const workflowChannels = channels
    .filter((c) => c.type !== "dm" && c.isMember !== false && !isSystemOnboardingWorkflow(c))
    .sort(sortWorkflowFirst);
  const dmChannels = channels.filter((c) => c.type === "dm").sort(sortStarredFirst);
  const workQueueAttentionCount = useMemo(
    () => tasks.filter((task) => task.status === "in_review").length
      + agentRuns.filter((run) => run.status === "waiting_input" || run.status === "failed").length,
    [agentRuns, tasks],
  );
  const existingDmPeers = new Set<string>([
    ...dmChannels.flatMap((c) => c.peer ? [`${c.peer.type}:${c.peer.id}`] : []),
    ...agents.filter((a) => a.dmChannelId).map((a) => `agent:${a.id}`),
  ]);
  const isLoading = loading || loadedServerSlug !== serverSlug;
  const { isMobile, isMobileOpen, setMobileOpen } = useSidebar();

  function openCreateDialog() {
    if (isMobile) setMobileOpen(false);
    setOpenCreate(true);
  }

  function openNewDmDialog() {
    if (isMobile) setMobileOpen(false);
    setOpenNewDm(true);
  }

  const sidebarContent = () => (
    <>
      <HeroSidebar.Header className="!flex-col !items-stretch !gap-2 !px-3 !pb-2 !pt-3">
        <div className="min-w-0">
          <Link
            href={`/s/${serverSlug}`}
            aria-label="Raltic workspace home"
            className="flex h-10 min-w-0 items-center rounded-[9px] px-1.5 text-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <RalticWordmark
              size={30}
              idSuffix={isMobile ? "workspace-sidebar-mobile" : "workspace-sidebar"}
              className="min-w-0 text-sm"
            />
          </Link>
        </div>
        <Button
          type="button"
          onPress={openCreateDialog}
          variant="outline"
          size="sm"
          fullWidth
          className="h-9 justify-start rounded-[8px] border-border bg-surface px-2.5 text-sm font-medium text-foreground hover:border-accent/25 hover:bg-surface-secondary"
          title="Start workflow"
          aria-label="Start workflow"
        >
          <Plus className="h-4 w-4 text-[var(--accent-soft-foreground)]" />
          Start workflow
        </Button>
      </HeroSidebar.Header>

      <HeroSidebar.Content
        data-testid="workspace-sidebar-scroll"
        className="!min-h-0 !flex-1 !gap-0 !px-3 !pb-2 !pt-0 text-sm"
      >
        <nav aria-label="Workspace navigation" className="text-sm">
          {isLoading ? (
            <p className="rounded-xl border border-border bg-default px-3 py-2 text-xs text-muted-foreground">Loading...</p>
          ) : loadError ? (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger-text">
              Workspace navigation unavailable: {loadError}
            </p>
          ) : (
            <>
              {/* Work cockpit destinations. Chat remains available below,
                  but the primary rail starts from work: where to begin,
                  what needs attention, what is running, and where agent
                  execution is visible. */}
              <HeroSidebar.Menu className="!gap-0.5 space-y-0" aria-label="Workspace destinations">
                <TopLevelLink
                  href={`/s/${serverSlug}`}
                  icon={<PlayCircle className="h-4 w-4" />}
                  label="Start"
                  active={pathname === `/s/${serverSlug}`}
                />
                <TopLevelLink
                  href={`/s/${serverSlug}/inbox`}
                  icon={<Activity className="h-4 w-4" />}
                  label="Work queue"
                  active={pathname === `/s/${serverSlug}/inbox`}
                  badge={workQueueAttentionCount}
                />
                <TopLevelLink
                  href={`/s/${serverSlug}/channels`}
                  icon={<Workflow className="h-4 w-4" />}
                  label="Workflows"
                  active={pathname === `/s/${serverSlug}/channels`}
                />
                <TopLevelLink
                  href={`/s/${serverSlug}/tasks`}
                  icon={<ListTodo className="h-4 w-4" />}
                  label="Tasks"
                  active={pathname === `/s/${serverSlug}/tasks`}
                />
                <TopLevelLink
                  href={`/s/${serverSlug}/agents`}
                  icon={<Cpu className="h-4 w-4" />}
                  label="Agent Work"
                  active={pathname === `/s/${serverSlug}/agents` || pathname.startsWith(`/s/${serverSlug}/agents/`)}
                />
              </HeroSidebar.Menu>
              {workDataError && (
                <p className="mt-2 rounded-lg border border-warning/30 bg-[var(--warning-soft)] px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
                  Work signals unavailable: {workDataError}
                </p>
              )}
              <ChannelGroup
                label="Active workflows"
                icon={<Workflow className="h-3.5 w-3.5" />}
                channels={workflowChannels}
                activeId={activeChannelId}
                serverSlug={serverSlug}
                serverId={serverId}
                summaries={workflowSummaryByChannel}
                // "+" reveals on group hover (same pattern as Messages).
                // Click → workspace's create-channel dialog if
                // admin, else routes to /s/{slug}/channels for browse +
                // join. Keeps the discovery path visible without taking
                // permanent sidebar real estate.
                headerAction={
                  <Link
                    href={`/s/${serverSlug}/channels`}
                    className={cn(
                      "ml-1 inline-flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/60 transition-all hover:bg-default hover:text-foreground focus-visible:opacity-100",
                      isMobile ? "opacity-100" : "opacity-0 group-hover/group:opacity-100",
                    )}
                    title="Browse workflows"
                    aria-label="Browse workflows"
                  >
                    <Workflow className="h-3 w-3" />
                  </Link>
                }
              />
              <ChannelGroup
                label="Messages"
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                channels={dmChannels}
                activeId={activeChannelId}
                serverSlug={serverSlug}
                serverId={serverId}
                // "+" reveals on group hover (group/group class on
                // SidebarGroup wrapper). Click opens the new-DM picker
                // covering both humans + agents — the discoverable entry
                // point for starting a DM with someone NOT yet in the
                // sidebar list (an invitee, a newly-created agent, etc.).
                headerAction={
                  <Button
                    type="button"
                    onClick={openNewDmDialog}
                    variant="ghost"
                    size="icon-xs"
                    className={cn(
                      "ml-1 h-5 w-5 text-muted-foreground/60 transition-all focus-visible:opacity-100",
                      isMobile || dmChannels.length === 0 ? "opacity-100" : "opacity-0 group-hover/group:opacity-100",
                    )}
                    title="Start a new direct message"
                    aria-label="Start a new direct message"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                }
                // Render the empty-state row so the "+" stays discoverable
                // for a brand-new workspace user who has zero DMs yet.
                emptyHint={
                  <p className="rounded-lg border border-dashed border-sidebar-border bg-sidebar-accent/45 px-2.5 py-2 text-[11px] text-sidebar-foreground">
                    No direct threads yet. Tap <span className="font-mono">+</span> to start one.
                  </p>
                }
              />
            </>
          )}
        </nav>
      </HeroSidebar.Content>

      {/* Footer: identity-only.
          - bottom-left: UserPill (avatar + name + visible "Online"
            status line + chevron). Click → account settings, workspace
            switching/settings, and sign out.
          - Workspace presence is real (useWorkspacePresence hook is
            wired); the inline "Online" label reflects the fact that
            other teammates see you as online when this tab is open. */}
      <HeroSidebar.Footer className="!gap-0 border-t border-sidebar-border bg-sidebar !px-3 !py-2.5">
        <UserPill
          serverSlug={serverSlug}
          serverId={serverId}
          serverName={serverName}
          serverIconUrl={serverIconUrl}
        />
      </HeroSidebar.Footer>
    </>
  );

  return (
    <>
      {!isMobile && (
        <HeroSidebar.Root
          data-testid="workspace-sidebar"
          className="!sticky !top-0 !min-h-0 !border-r !border-sidebar-border !bg-sidebar"
          style={{
            "--sidebar-width": "17rem",
            "--sidebar-width-collapsed": "17rem",
            height: "var(--raltic-visual-viewport-height)",
          } as CSSProperties}
        >
          {sidebarContent()}
        </HeroSidebar.Root>
      )}
      {isMobile && (
        <Sheet.Root isOpen={isMobileOpen} placement="left" onOpenChange={setMobileOpen}>
          <Sheet.Backdrop variant="blur">
            <Sheet.Content className="sidebar__mobile-sheet">
              <Sheet.Dialog className="sidebar__mobile-dialog">
                <Sheet.Heading className="sr-only">Workspace navigation</Sheet.Heading>
                <div
                  data-testid="workspace-sidebar-mobile"
                  data-slot="sidebar-mobile"
                  aria-label="Workspace navigation"
                  className="sidebar__mobile raltic-workspace-mobile-sidebar !h-[var(--raltic-visual-viewport-height)] !max-h-[var(--raltic-visual-viewport-height)] !bg-sidebar"
                >
                  {sidebarContent()}
                </div>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet.Root>
      )}

      <CreateChannelDialog
        serverId={serverId}
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={(id) => {
          setOpenCreate(false);
          reloadChannels();
          router.push(`/s/${serverSlug}/channel/${id}`);
        }}
      />
      {/* DM picker. Existing peers come from DM channel peer metadata so
          the "in DMs" hint is consistent for humans and agents. Agent
          dmChannelId stays as a fallback for older API payloads. */}
      <NewDmDialog
        serverId={serverId}
        serverSlug={serverSlug}
        existingDmPeers={existingDmPeers}
        open={openNewDm}
        onOpenChange={setOpenNewDm}
        onOpened={reloadChannels}
      />
    </>
  );
}

// ── Building blocks (one source of truth for sidebar row rhythm) ──

const SIDEBAR_ITEM_CLASS =
  "!my-0 !rounded-[8px] !outline-none !p-0";

const SIDEBAR_LINK_CLASS =
  "flex h-8 w-full min-w-0 items-center gap-2 rounded-[8px] border border-transparent px-2.5 text-sm text-sidebar-foreground transition-[background-color,color,border-color,box-shadow] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[current=true]:border-accent/25 data-[current=true]:bg-[var(--accent-soft)] data-[current=true]:text-sidebar-accent-foreground data-[current=true]:font-semibold data-[current=true]:shadow-xs";

/** Map each section name to a brand-tinted dot — visual rhythm that says
 *  "this is Raltic" without printing the logo on every group label. */
const GROUP_DOT: Record<string, string> = {
  "Active workflows": "bg-[var(--accent)]",
  Messages: "bg-[var(--warning)]",
};

function SidebarGroup({
  label, children, headerAction,
}: {
  label: string;
  children: React.ReactNode;
  // Optional trailing button in the section header (e.g. "+" to start a
  // new DM). Stays subtle until hovered so it doesn't compete with the
  // section title.
  headerAction?: React.ReactNode;
}) {
  const dot = GROUP_DOT[label] ?? "bg-muted-foreground/40";
  return (
    <HeroSidebar.Group className="group/group mt-4 !gap-1 first:mt-0">
      <HeroSidebar.GroupLabel className="!flex !items-center !gap-1.5 !px-2 !py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot)} aria-hidden />
        <span className="flex-1">{label}</span>
        {headerAction}
      </HeroSidebar.GroupLabel>
      {children}
    </HeroSidebar.Group>
  );
}

/** Sibling of section labels — a single nav destination like Tasks or
 *  Threads that lives at the same hierarchy as workflow and message
 *  lists. Uses the same row rhythm as channel rows so the cyan accent +
 *  hover treatment match. */
function TopLevelLink({ href, icon, label, active, badge = 0 }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number;
}) {
  const { isMobile, setMobileOpen } = useSidebar();
  const badgeDescriptionId = useId();

  return (
    <HeroSidebar.MenuItem
      id={href}
      isCurrent={active}
      textValue={label}
      className={cn(
        SIDEBAR_ITEM_CLASS,
      )}
    >
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-describedby={badge > 0 ? badgeDescriptionId : undefined}
        data-current={active ? "true" : undefined}
        className={cn(SIDEBAR_LINK_CLASS, "font-medium")}
        onClick={() => {
          if (isMobile) setMobileOpen(false);
        }}
      >
        <HeroSidebar.MenuIcon className="shrink-0 text-current">{icon}</HeroSidebar.MenuIcon>
        <HeroSidebar.MenuLabel className="min-w-0 flex-1 truncate !text-current [&_[data-slot=sidebar-menu-label-text]]:!text-current">{label}</HeroSidebar.MenuLabel>
        {badge > 0 && (
          <HeroSidebar.MenuChip
            aria-hidden="true"
            data-count={badge > 99 ? "99+" : String(badge)}
            className="min-w-5 justify-center !bg-[var(--warning-soft)] !text-[var(--warning-soft-foreground)] text-[10px] before:content-[attr(data-count)]"
          >
            {null}
          </HeroSidebar.MenuChip>
        )}
      </Link>
      {badge > 0 && (
        <span id={badgeDescriptionId} className="sr-only">
          {badge} work queue attention item{badge === 1 ? "" : "s"}
        </span>
      )}
    </HeroSidebar.MenuItem>
  );
}

function ChannelLink({ channel, activeId, serverSlug, serverId, icon, summary }: {
  channel: Channel; activeId?: string; serverSlug: string; serverId: string; icon: React.ReactNode; summary?: WorkflowSummary;
}) {
  const live = useChannelUnread(channel.id);
  const liveUnread = activeId === channel.id ? 0 : live;
  const isActive = activeId === channel.id;
  // Phase A — mute respects: suppress unread badge AND bold weight so
  // muted channels stay visible but don't fight for attention. The
  // count is still computed (we want @-mentions logic later to bypass
  // mute) but the visual treatment hides the noise.
  const isMuted = channel.mutedAt != null;
  const unread = isMuted ? 0 : liveUnread;
  // Workspace presence — only for human DM rows. The hook is refcounted
  // and shares a single WS subscription across all callers in the tree.
  const presence = useWorkspacePresence(serverId);
  const humanPeerPresence =
    channel.type === "dm" && channel.peer?.type === "human"
      ? presence[channel.peer.id]
      : undefined;
  // DM rows show the OTHER party's name, not channel.name (which for
  // human↔human DMs is a hex slug, never a person's name). Falls back
  // to channel.name if peer wasn't populated (older API, or non-DM).
  const displayName =
    channel.type === "dm" && channel.peer?.name
      ? channel.peer.name
      : channel.name;
  const href = `/s/${serverSlug}/${channel.type === "dm" ? "dm" : "channel"}/${channel.id}`;
  const { isMobile, setMobileOpen } = useSidebar();
  const isWorkflow = channel.type !== "dm";

  return (
    <HeroSidebar.MenuItem
      id={channel.id}
      isCurrent={isActive}
      textValue={displayName}
      className={cn(
        SIDEBAR_ITEM_CLASS,
        unread > 0 && "font-semibold",
        // Phase A — muted: switch to muted-foreground tint instead of
        // opacity-60 (codex PA2 MED — opacity dropped contrast below
        // AA 4.5:1). The semantic token keeps AA contrast in both
        // light + dark modes. Active state overrides so the user can
        // still see clearly which muted channel they're viewing.
        isMuted && !isActive && "text-muted-foreground",
      )}
    >
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        data-current={isActive ? "true" : undefined}
        className={cn(
          SIDEBAR_LINK_CLASS,
          isWorkflow && "h-auto min-h-10 items-start py-1.5",
          unread > 0 && "font-semibold",
          isMuted && !isActive && "text-muted-foreground",
        )}
        onClick={() => {
          if (isMobile) setMobileOpen(false);
        }}
      >
        <HeroSidebar.MenuIcon className="shrink-0 text-current">{icon}</HeroSidebar.MenuIcon>
        <HeroSidebar.MenuLabel className="min-w-0 flex-1 !text-current [&_[data-slot=sidebar-menu-label-text]]:!text-current">
          <span className="block min-w-0 truncate">{displayName}</span>
          {isWorkflow && summary && (
            <span className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[10.5px] font-normal leading-4 text-muted-foreground">
              <WorkflowStatusDot tone={summary.tone} />
              <span className="truncate">{summary.meta}</span>
            </span>
          )}
        </HeroSidebar.MenuLabel>
        {channel.type !== "dm" && channel.starredAt != null && (
          <Star className="h-3 w-3 shrink-0 fill-current text-[var(--warning)]" aria-label="Starred" />
        )}
        {channel.type !== "dm" && isMuted && (
          <BellOff className="h-3 w-3 shrink-0 text-muted-foreground" aria-label="Muted" />
        )}
        {isWorkflow && summary && (
          <WorkflowStatusChip summary={summary} />
        )}
        {/* For human DMs: success dot if peer's online, muted dot if seen
            recently, none if never connected. Real workspace presence —
            not the hardcoded green the user-pill used to show. */}
        {humanPeerPresence !== undefined && (
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              humanPeerPresence.online
                ? "bg-[var(--success)] shadow-xs"
                : "bg-muted-foreground/70",
            )}
            aria-label={humanPeerPresence.online ? "Online" : "Offline"}
          />
        )}
        {/* For agent DMs, show the runtime indicator inline so users can
            tell at a glance whether a DM peer is Claude or Codex without
            opening the channel. Humans show no chip. */}
        {channel.type === "dm" && channel.peer?.type === "agent" && channel.peer.runtime && (
          <RuntimeDot runtime={channel.peer.runtime} />
        )}
        {unread > 0 && (
          <HeroSidebar.MenuChip
            className={cn(
              "min-w-5 justify-center text-[10px]",
              isActive
                ? "!bg-sidebar-primary-foreground !text-sidebar-primary"
                : "!bg-sidebar-primary !text-sidebar-primary-foreground",
            )}
          >
            {unread > 99 ? "99+" : unread}
          </HeroSidebar.MenuChip>
        )}
      </Link>
    </HeroSidebar.MenuItem>
  );
}

function ChannelGroup({
  label, icon, channels, activeId, serverSlug, serverId, headerAction, emptyHint, summaries,
}: {
  label: string;
  icon: React.ReactNode;
  channels: Channel[];
  activeId?: string;
  serverSlug: string;
  /** Required — ChannelLink uses it to look up workspace presence for
   *  human DM peers. */
  serverId: string;
  // Optional "+" or similar trailing action shown in the section header.
  headerAction?: React.ReactNode;
  // Optional copy shown when there are zero channels in this group, IF
  // we want the group to render at all. Without this, the group hides
  // (the legacy behavior — channels.length === 0 returns null below).
  emptyHint?: React.ReactNode;
  summaries?: Map<string, WorkflowSummary>;
}) {
  if (channels.length === 0 && !emptyHint) return null;
  return (
    <SidebarGroup label={label} headerAction={headerAction}>
      {channels.length === 0 && emptyHint ? (
        emptyHint
      ) : (
        <HeroSidebar.Menu className="!gap-0.5 space-y-0" aria-label={label}>
          {channels.map((c) => (
            <ChannelLink
              key={c.id}
              channel={c}
              activeId={activeId}
              serverSlug={serverSlug}
              serverId={serverId}
              icon={iconForChannel(c, icon)}
              summary={summaries?.get(c.id)}
            />
          ))}
        </HeroSidebar.Menu>
      )}
    </SidebarGroup>
  );
}

type WorkflowTone = "accent" | "warning" | "danger" | "success" | "default";

interface WorkflowSummary {
  openTasks: number;
  reviewTasks: number;
  activeRuns: number;
  waitingRuns: number;
  failedRuns: number;
  agentCount: number;
  label: string;
  meta: string;
  tone: WorkflowTone;
}

function buildWorkflowSummaryByChannel(
  channels: Channel[],
  tasks: TaskRow[],
  runs: AgentRun[],
): Map<string, WorkflowSummary> {
  const map = new Map<string, WorkflowSummary>();
  for (const channel of channels) {
    if (channel.type === "dm" || channel.isMember === false || isSystemOnboardingWorkflow(channel)) continue;
    const channelTasks = tasks.filter((task) => task.channelId === channel.id);
    const channelRuns = runs.filter((run) => run.channelId === channel.id);
    const openTasks = channelTasks.filter((task) => task.status !== "done").length;
    const reviewTasks = channelTasks.filter((task) => task.status === "in_review").length;
    const activeRuns = channelRuns.filter((run) => isActiveRunStatus(run.status)).length;
    const waitingRuns = channelRuns.filter((run) => run.status === "waiting_input").length;
    const failedRuns = channelRuns.filter((run) => run.status === "failed").length;
    const agentCount = channel.agentIds?.length ?? 0;
    map.set(channel.id, summarizeWorkflow({ openTasks, reviewTasks, activeRuns, waitingRuns, failedRuns, agentCount }));
  }
  return map;
}

function isSystemOnboardingWorkflow(channel: Pick<Channel, "name" | "type">): boolean {
  return channel.type !== "dm" && channel.name === "onboarding";
}

function summarizeWorkflow(input: Pick<WorkflowSummary, "openTasks" | "reviewTasks" | "activeRuns" | "waitingRuns" | "failedRuns" | "agentCount">): WorkflowSummary {
  const { openTasks, reviewTasks, activeRuns, waitingRuns, failedRuns, agentCount } = input;
  if (reviewTasks > 0) {
    return {
      ...input,
      label: "Review",
      meta: `${reviewTasks} needs review${openTasks > reviewTasks ? ` · ${openTasks} open` : ""}`,
      tone: "warning",
    };
  }
  if (waitingRuns > 0) {
    return {
      ...input,
      label: "Waiting",
      meta: `${waitingRuns} waiting for input${openTasks > 0 ? ` · ${openTasks} open` : ""}`,
      tone: "warning",
    };
  }
  if (failedRuns > 0) {
    return {
      ...input,
      label: "Failed",
      meta: `${failedRuns} failed run${failedRuns === 1 ? "" : "s"}${openTasks > 0 ? ` · ${openTasks} open` : ""}`,
      tone: "danger",
    };
  }
  if (activeRuns > 0) {
    return {
      ...input,
      label: "Running",
      meta: `${activeRuns} agent run${activeRuns === 1 ? "" : "s"} active${openTasks > 0 ? ` · ${openTasks} open` : ""}`,
      tone: "accent",
    };
  }
  if (openTasks > 0) {
    return {
      ...input,
      label: "Open",
      meta: `${openTasks} open task${openTasks === 1 ? "" : "s"}${agentCount > 0 ? ` · ${agentCount} agent${agentCount === 1 ? "" : "s"}` : ""}`,
      tone: "default",
    };
  }
  if (agentCount > 0) {
    return {
      ...input,
      label: "Ready",
      meta: `${agentCount} agent${agentCount === 1 ? "" : "s"} ready`,
      tone: "success",
    };
  }
  return {
    ...input,
    label: "Ready",
    meta: "brief, run, approve",
    tone: "default",
  };
}

function isActiveRunStatus(status: AgentRun["status"]): boolean {
  return status === "queued" || status === "dispatched" || status === "running" || status === "waiting_input";
}

function workflowPriority(summary: WorkflowSummary | undefined): number {
  if (!summary) return 10;
  if (summary.reviewTasks > 0) return 0;
  if (summary.waitingRuns > 0) return 1;
  if (summary.failedRuns > 0) return 2;
  if (summary.activeRuns > 0) return 3;
  if (summary.openTasks > 0) return 4;
  if (summary.agentCount > 0) return 5;
  return 6;
}

function WorkflowStatusChip({ summary }: { summary: WorkflowSummary }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md px-1.5 text-[9.5px] font-semibold uppercase tracking-wide",
        workflowToneClass(summary.tone),
      )}
    >
      {summary.label}
    </span>
  );
}

function WorkflowStatusDot({ tone }: { tone: WorkflowTone }) {
  return <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", workflowDotClass(tone))} aria-hidden />;
}

function workflowToneClass(tone: WorkflowTone): string {
  switch (tone) {
    case "accent": return "bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)]";
    case "warning": return "bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)]";
    case "danger": return "bg-[var(--danger-soft)] text-[var(--danger-soft-foreground)]";
    case "success": return "bg-[var(--success-soft)] text-[var(--success-soft-foreground)]";
    default: return "bg-[var(--default-soft)] text-[var(--default-soft-foreground)]";
  }
}

function workflowDotClass(tone: WorkflowTone): string {
  switch (tone) {
    case "accent": return "bg-[var(--accent)]";
    case "warning": return "bg-[var(--warning)]";
    case "danger": return "bg-[var(--danger)]";
    case "success": return "bg-[var(--success)]";
    default: return "bg-muted-foreground/70";
  }
}

function iconForChannel(channel: Channel, fallback: React.ReactNode): React.ReactNode {
  if (channel.type === "private") return <Lock className="h-3.5 w-3.5" aria-label="Private workflow" />;
  return fallback;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Tiny runtime indicator next to the agent name. Color + letter glyph
 *  (not color-only) so it remains distinguishable for color-blind users
 *  and at WCAG-AA contrast on small sizes. Cyan square=Claude, amber
 *  circle=Codex; the differing SHAPE is the redundant non-color cue. */
function RuntimeDot({ runtime }: { runtime: string }) {
  // Accept `string` so a legacy "gemini"/"copilot" value from the DB
  // doesn't crash with palette.bg on undefined. Falls through to a
  // neutral zinc dot. Detected by review (backcompat H1).
  const palette: Record<string, { bg: string; fg: string; text: string; shape: string; label: string }> = {
    claude:   { bg: "bg-[var(--accent)]",  fg: "text-[var(--accent-foreground)]",  text: "C", shape: "rounded-sm",   label: "Claude" },
    codex:    { bg: "bg-[var(--warning)]", fg: "text-[var(--warning-foreground)]", text: "X", shape: "rounded-full", label: "Codex" },
    openclaw: { bg: "bg-[var(--default)]", fg: "text-[var(--default-foreground)]", text: "O", shape: "rounded-md",   label: "OpenClaw" },
    hermes:   { bg: "bg-[var(--default)]", fg: "text-[var(--default-foreground)]", text: "H", shape: "rounded-sm",   label: "Hermes" },
  };
  const entry = palette[runtime] ?? {
    bg: "bg-muted-foreground/70",
    fg: "text-background",
    text: "?",
    shape: "rounded-sm",
    label: runtime || "Unknown runtime",
  };
  return (
    <span
      title={entry.label}
      aria-label={`Runtime: ${entry.label}`}
      className={`inline-flex h-3 w-3 shrink-0 items-center justify-center ${entry.shape} ${entry.bg} ${entry.fg} text-[8px] font-bold leading-none`}
    >
      {entry.text}
    </span>
  );
}
