/**
 * GET /api/v1/inbox?serverId=… — unified inbox surface.
 *
 * Aggregates high-signal work into a single attention list:
 *   1. Unread DMs: every DM channel the caller is in where the latest
 *      message's seq exceeds their last_read_seq AND the latest sender
 *      isn't the caller themselves.
 *   2. Open task assignments: tasks where assignee_id = caller and
 *      status ∈ (todo, in_progress), ordered by created_at desc.
 *   3. Review tasks: tasks in joined workflow rooms with status
 *      in_review.
 *   4. Agent runs waiting for input or failed in joined workflow rooms.
 *
 * Why no @-mention source yet:
 *   The messages table doesn't index mentioned user ids — adding one
 *   means a schema migration and a write-time extraction step. MVP
 *   inbox covers the two highest-signal sources without DB churn;
 *   mentions land in a follow-up.
 *
 * Why server-scoped (`?serverId=` required):
 *   A user can be in N workspaces; surfacing all inboxes mixed together
 *   would conflict with our existing "you're in one workspace at a time"
 *   sidebar mental model. Workspace switcher handles cross-workspace
 *   awareness; inbox stays scoped.
 *
 * Why no persisted "last inbox read":
 *   We piggyback on channelMembers.last_read_seq for DM unread; for tasks
 *   we always show open ones. UI can mark items as "seen" client-side
 *   via localStorage to fade them visually; deciding-they're-handled is
 *   the user clicking through to the source channel.
 */
import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { requirePolicy, policy } from "@raltic/auth-core";
import { agentRuns, agents, messages, channels, channelMembers, tasks, servers } from "@raltic/db";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { inboxResponse, listInboxQuery, sanitizeUserVisibleError, type InboxItemRecord } from "@raltic/protocol";
import type { Env, Variables } from "../lib/env";
import { requireAuth, ctxFor } from "../lib/auth";
import { listVisibleChannelIds } from "../lib/visible-channels";

export const inboxRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

inboxRoutes.get("/api/v1/inbox", requireAuth, async (c) => {
  const subject = c.get("subject");
  if (subject.kind !== "user") {
    return c.json(inboxResponse.parse({ items: [], count: 0, totalCount: 0 }));
  }
  const parsed = listInboxQuery.safeParse(Object.fromEntries(new URL(c.req.url).searchParams));
  if (!parsed.success) {
    return c.json({ error: { code: "BAD_REQ", message: parsed.error.issues[0]?.message ?? "bad inbox query" } }, 400);
  }
  const { serverId: serverIdParam, limit } = parsed.data;
  const ctx = ctxFor(c);
  await requirePolicy(policy.servers.canRead(ctx, serverIdParam));

  const db = drizzle(c.env.DB);

  // Workspace slug used for href construction. One small lookup; we
  // could pass slug in the URL instead, but server_id is the stable
  // identifier and the slug can change (via PATCH /servers/:id).
  const srv = await db.select({ slug: servers.slug })
    .from(servers).where(eq(servers.id, serverIdParam)).limit(1);
  const slug = srv[0]?.slug ?? serverIdParam;

  // ── 1. Unread DMs ──────────────────────────────────────────────────────
  const dmMemberships = await db
    .select({
      channelId: channels.id,
      channelName: channels.name,
      lastReadSeq: channelMembers.lastReadSeq,
    })
    .from(channelMembers)
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(and(
      eq(channelMembers.memberId, subject.userId),
      eq(channelMembers.memberType, "human"),
      eq(channels.type, "dm"),
      eq(channels.serverId, serverIdParam),
      isNull(channels.archivedAt),
    ));

  const dmItems: InboxItemRecord[] = [];
  for (const dm of dmMemberships) {
    const latest = await db.select({
      id: messages.id, seq: messages.seq, content: messages.content,
      createdAt: messages.createdAt, senderId: messages.senderId,
    })
      .from(messages)
      .where(eq(messages.channelId, dm.channelId))
      .orderBy(desc(messages.seq))
      .limit(1);
    const top = latest[0];
    if (!top) continue;
    if ((dm.lastReadSeq ?? 0) >= top.seq) continue;
    if (top.senderId === subject.userId) continue;
    dmItems.push({
      id: `dm:${top.id}`,
      kind: "dm",
      priority: 5,
      createdAt: top.createdAt instanceof Date ? top.createdAt.getTime() : Number(top.createdAt),
      channelId: dm.channelId,
      channelName: dm.channelName,
      channelType: "dm",
      preview: top.content.slice(0, 140),
      href: `/s/${slug}/dm/${dm.channelId}`,
    });
  }

  const visibleChannelIds = await listVisibleChannelIds(db, subject, {
    serverId: serverIdParam,
    includePublic: false,
  });

  // ── 2. Open tasks assigned to me ───────────────────────────────────────
  // tasks doesn't store a title — the title is the source message's content.
  // LEFT JOIN messages so a task whose message got hard-deleted still
  // surfaces (preview falls back to "Task #N").
  const myTasks = visibleChannelIds.length === 0 ? [] : await db
    .select({
      tId: tasks.id, tNumber: tasks.taskNumber,
      tStatus: tasks.status, tCreatedAt: tasks.createdAt, tChannelId: tasks.channelId,
      tMessageId: tasks.messageId,
      mContent: messages.content,
      cName: channels.name, cType: channels.type,
    })
    .from(tasks)
    .innerJoin(channels, eq(channels.id, tasks.channelId))
    .leftJoin(messages, eq(messages.id, tasks.messageId))
    .where(and(
      eq(channels.serverId, serverIdParam),
      inArray(tasks.channelId, visibleChannelIds),
      or(
        and(
          eq(tasks.assigneeId, subject.userId),
          eq(tasks.assigneeType, "human"),
          or(eq(tasks.status, "todo"), eq(tasks.status, "in_progress")),
        ),
        eq(tasks.status, "in_review"),
      ),
    ))
    .orderBy(desc(tasks.createdAt));

  const taskItems: InboxItemRecord[] = myTasks.map((t) => ({
    id: `task:${t.tId}`,
    kind: "task",
    priority: t.tStatus === "in_review" ? 0 : 4,
    createdAt: t.tCreatedAt instanceof Date ? t.tCreatedAt.getTime() : Number(t.tCreatedAt),
    channelId: t.tChannelId,
    channelName: t.cName,
    channelType: t.cType,
    preview: (t.mContent ?? `Task #${t.tNumber}`).slice(0, 140),
    href: `/s/${slug}/${t.cType === "dm" ? "dm" : "channel"}/${t.tChannelId}`,
    status: t.tStatus,
  }));

  // ── 3. Agent run blockers / failures ──────────────────────────────────
  const runRows = visibleChannelIds.length === 0 ? [] : await db
    .select({
      rId: agentRuns.id,
      rStatus: agentRuns.status,
      rCreatedAt: agentRuns.createdAt,
      rUpdatedAt: agentRuns.updatedAt,
      rAgentId: agentRuns.agentId,
      rRuntimeMode: agentRuns.runtimeMode,
      rInputPreview: agentRuns.inputPreview,
      rError: agentRuns.error,
      cId: channels.id,
      cName: channels.name,
      cType: channels.type,
      aDisplayName: agents.displayName,
    })
    .from(agentRuns)
    .innerJoin(channels, eq(channels.id, agentRuns.channelId))
    .leftJoin(agents, eq(agents.id, agentRuns.agentId))
    .where(and(
      eq(channels.serverId, serverIdParam),
      inArray(agentRuns.channelId, visibleChannelIds),
      inArray(agentRuns.status, ["waiting_input", "failed"]),
    ))
    .orderBy(desc(agentRuns.updatedAt));

  const runItems: InboxItemRecord[] = runRows.map((r) => {
    const agentName = r.aDisplayName ?? `Agent ${r.rAgentId.slice(0, 6)}`;
    const status = r.rStatus;
    const waiting = status === "waiting_input";
    const safeInput = sanitizeUserVisibleError(r.rInputPreview, 160);
    const safeError = sanitizeUserVisibleError(r.rError, 160);
    const detail = waiting
      ? (safeInput ? ` · ${safeInput}` : "")
      : (safeError ? ` · ${safeError}` : "");
    return {
      id: `run:${r.rId}`,
      kind: "agent_run",
      priority: waiting ? 1 : 2,
      createdAt: r.rUpdatedAt instanceof Date ? r.rUpdatedAt.getTime() : Number(r.rUpdatedAt ?? r.rCreatedAt),
      channelId: r.cId,
      channelName: r.cName,
      channelType: r.cType,
      preview: `${agentName} ${waiting ? "is waiting for input" : "failed"}${detail}`.slice(0, 160),
      href: `/s/${slug}/agents/${r.rAgentId}?tab=runs&runId=${r.rId}`,
      status,
      agentId: r.rAgentId,
      runtimeMode: r.rRuntimeMode,
    };
  });

  const allItems = [...dmItems, ...taskItems, ...runItems]
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.createdAt - a.createdAt;
    });
  const items = allItems.slice(0, limit);

  return c.json(inboxResponse.parse({ items, count: items.length, totalCount: allItems.length }));
});
