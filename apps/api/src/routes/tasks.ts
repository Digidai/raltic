import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { requirePolicy, policy } from "@raltic/auth-core";
import { createTaskRequest, updateTaskRequest, listTasksQuery, sanitizeUserVisibleError } from "@raltic/protocol";
import { agentRuns, channelMembers, channels, messages, tasks } from "@raltic/db";
import { and, desc, eq, inArray, isNull, like, or } from "drizzle-orm";
import type { Env, Variables } from "../lib/env";
import { requireAuth, ctxFor } from "../lib/auth";
import { rateLimit } from "../lib/rate-limit";

export const tasksRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ---------------------------------------------------------------------------
// /api/v1/tasks — list / create / update (incl. claim/unclaim)
// ---------------------------------------------------------------------------
tasksRoutes.get("/api/v1/tasks", requireAuth, async (c) => {
  const q = listTasksQuery.parse(Object.fromEntries(new URL(c.req.url).searchParams));
  const ctx = ctxFor(c);
  const subject = c.get("subject");
  const db = drizzle(c.env.DB);

  // Helper to derive title from the linked message — strips the standard
  // "📋 Task #N: " prefix the DO inserts on task creation. Falls back to
  // the raw content if the prefix isn't present (older rows).
  const titleFromMessage = (content: string | null): string => {
    if (!content) return "(no title)";
    const m = /^📋\s*Task\s*#\d+:\s*(.+)$/s.exec(content);
    return (m ? m[1] : content).slice(0, 200);
  };

  if (q.channelId) {
    await requirePolicy(policy.tasks.canRead(ctx, q.channelId));
    const conds = [eq(tasks.channelId, q.channelId)];
    if (q.status) conds.push(eq(tasks.status, q.status));
    if (q.assigneeId) conds.push(eq(tasks.assigneeId, q.assigneeId));
    if (q.taskId) conds.push(eq(tasks.id, q.taskId));
    const rows = await db
      .select({ t: tasks, content: messages.content })
      .from(tasks)
      .leftJoin(messages, eq(messages.id, tasks.messageId))
      .where(and(...conds))
      .orderBy(desc(tasks.createdAt))
      .limit(q.limit);
    const listed = rows.map(r => ({ ...r.t, title: titleFromMessage(r.content) }));
    return c.json({ tasks: await attachLatestRunEvidence(
      c.env.DB,
      listed,
      subject.kind === "bridge" ? { agentIds: subject.agentIds } : undefined,
    ) });
  }

  // No channel filter → list across channels visible to subject's agents/self.
  // Membership join below already constrains to subject's channels (humans).
  // For machine subjects we additionally constrain via the channel's serverId
  // so a key for serverA can't enumerate serverB tasks even if the user is
  // a member of both servers.
  const conds = [
    eq(channelMembers.channelId, tasks.channelId),
  ];
  if (subject.kind === "bridge") {
    if (subject.agentIds.length === 0) return c.json({ tasks: [] });
    conds.push(eq(channelMembers.memberType, "agent"));
  } else {
    conds.push(eq(channelMembers.memberId, subject.userId));
    conds.push(eq(channelMembers.memberType, "human"));
  }
  const rows = await db
    .select({ t: tasks, content: messages.content, serverId: channels.serverId })
    .from(tasks)
    .innerJoin(channelMembers, and(...conds))
    .innerJoin(channels, eq(channels.id, tasks.channelId))
    .leftJoin(messages, eq(messages.id, tasks.messageId))
    .where(and(
      q.status ? eq(tasks.status, q.status) : undefined,
      subject.kind === "machine" ? eq(channels.serverId, subject.serverId) : undefined,
      subject.kind === "bridge" ? eq(channels.serverId, subject.serverId) : undefined,
      q.serverId ? eq(channels.serverId, q.serverId) : undefined,
      subject.kind === "bridge" ? inArray(channelMembers.memberId, subject.agentIds) : undefined,
      q.assigneeId ? eq(tasks.assigneeId, q.assigneeId) : undefined,
      q.taskId ? eq(tasks.id, q.taskId) : undefined,
    ))
    .orderBy(desc(tasks.createdAt))
    .limit(q.limit);
  const listed = dedupeListedTasks(rows.map(r => ({ ...r.t, title: titleFromMessage(r.content) })));
  return c.json({ tasks: await attachLatestRunEvidence(
    c.env.DB,
    listed,
    subject.kind === "bridge" ? { agentIds: subject.agentIds } : undefined,
  ) });
});

tasksRoutes.post("/api/v1/tasks", requireAuth, async (c) => {
  const subject = c.get("subject");
  // 100/hour/user — task creation can be bursty (agent triages incoming
  // messages into tasks), but anything beyond this is more likely a bug
  // or abuse than legitimate human flow.
  const limited = await rateLimit(c, "task_create", subject.userId, 100, 3600);
  if (limited) return limited;
  const body = createTaskRequest.parse(await c.req.json());
  const ctx = ctxFor(c);
  await requirePolicy(policy.tasks.canManage(ctx, body.channelId));
  // Per-channel cap — task creation is bursty per agent but a channel
  // shouldn't legitimately accumulate >500 new tasks/hour from any combo
  // of members. Caught after policy to avoid probing.
  const chanLimited = await rateLimit(c, "task_create_chan", body.channelId, 500, 3600);
  if (chanLimited) return chanLimited;

  const db = drizzle(c.env.DB);
  const senderId = body.as ?? subject.userId;
  const senderType = body.as ? "agent" : "human";
  await requirePolicy(policy.messages.canSendAs(ctx, {
    channelId: body.channelId,
    senderId,
    senderType,
  }));
  const assignee = normalizeAssignee(body.assigneeId, body.assigneeType);
  if ("error" in assignee) return c.json({ error: assignee.error }, 400);
  if (assignee.assigneeId && assignee.assigneeType) {
    const ok = await isChannelMember(db, body.channelId, assignee.assigneeId, assignee.assigneeType);
    if (!ok) {
      return c.json({
        error: { code: "INVALID_ASSIGNEE", message: "task assignee must be a member of the task channel" },
      }, 400);
    }
  }

  // 1. Allocate task_number atomically via INSERT-then-retry on UNIQUE
  //    collision. Row is inserted with messageId=null; the DO send happens
  //    AFTER we know the committed task_number, then we back-fill messageId.
  //    This avoids the prior bug where retry posted duplicate user-visible
  //    chat messages with diverging task numbers.
  const id = crypto.randomUUID();
  const now = new Date();
  let taskNumber = 0;
  let inserted = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.select({ max: tasks.taskNumber })
      .from(tasks).where(eq(tasks.channelId, body.channelId));
    taskNumber = (existing.reduce((m, r) => Math.max(m, r.max ?? 0), 0)) + 1;
    try {
      await db.insert(tasks).values({
        id, messageId: null, channelId: body.channelId,
        taskNumber, status: "todo",
        assigneeId: assignee.assigneeId,
        assigneeType: assignee.assigneeType,
        createdAt: now, updatedAt: now,
      });
      inserted = true;
      break;
    } catch (e) {
      // Unique-constraint codes vary by D1 version; "UNIQUE" or "constraint"
      // both cover SQLite's text. Retry on conflict, surface anything else.
      const m = String(e);
      if ((m.includes("UNIQUE") || m.includes("constraint")) && attempt < 4) continue;
      throw e;
    }
  }
  if (!inserted) {
    return c.json({ error: { code: "TASK_CONFLICT", message: "could not allocate task number after retries" } }, 409);
  }

  // 2. Now post the chat message with the COMMITTED task_number. Idempotency
  //    key is stable (per task id) so any retry of THIS endpoint dedupes.
  const stub = c.env.CHAT_ROOM.get(c.env.CHAT_ROOM.idFromName(body.channelId));
  const sendRes = await stub.fetch("https://chat-room/internal/send", {
    method: "POST",
    headers: { "x-internal-secret": c.env.CHAT_ROOM_AUTH_SECRET, "content-type": "application/json" },
    body: JSON.stringify({
      channelId: body.channelId,
      senderId,
      senderType,
      content: `📋 Task #${taskNumber}: ${body.title}`,
      threadParentId: null,
      idempotencyKey: `task-create-${id}`,
    }),
  });
  if (!sendRes.ok) {
    // Row exists but message didn't post — leave row with null messageId so
    // a manual retry endpoint (future work) can backfill it. Return success
    // since the task itself was created.
    return c.json({ id, taskNumber, messageId: null, seq: null, warning: "task created but chat message failed" });
  }
  const messageRes = await sendRes.json() as { ok: boolean; seq: number; messageId: string };

  // 3. Backfill the messageId so the UI can link task ↔ message, then
  // attach any bridge run that raced in between ChatRoom broadcast and
  // task.messageId persistence.
  await backfillTaskMessageAndRunLinks(db, {
    taskId: id,
    channelId: body.channelId,
    messageId: messageRes.messageId,
  });

  return c.json({ id, taskNumber, messageId: messageRes.messageId, seq: messageRes.seq });
});

tasksRoutes.patch("/api/v1/tasks/:id", requireAuth, async (c) => {
  const ref = c.req.param("id");
  const subject = c.get("subject");
  // 200 task-patches/min/user — Kanban drag/drop fires rapid status
  // updates; agents bulk-triage in bursts. Cap protects D1 from a
  // runaway script.
  const limited = await rateLimit(c, "task_patch", subject.userId, 200, 60);
  if (limited) return limited;
  const body = updateTaskRequest.parse(await c.req.json());
  const db = drizzle(c.env.DB);
  const ctx = ctxFor(c);
  const resolved = await resolveTaskRef(db, ctx, ref);
  if (resolved.status === "not_found") return c.json({ error: { code: "NOT_FOUND", message: "no such task" } }, 404);
  if (resolved.status === "forbidden") return c.json({ error: { code: "FORBIDDEN", message: "forbidden" } }, 403);
  if (resolved.status === "ambiguous") {
    return c.json({ error: { code: "AMBIGUOUS_TASK", message: "task reference matches multiple visible tasks; use the full task id" } }, 409);
  }
  const existing = resolved.task;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) patch.status = body.status;
  if (body.assigneeId !== undefined || body.assigneeType !== undefined) {
    const assignee = normalizeAssignee(
      body.assigneeId !== undefined ? body.assigneeId : existing.assigneeId,
      body.assigneeType !== undefined ? body.assigneeType : existing.assigneeType,
    );
    if ("error" in assignee) return c.json({ error: assignee.error }, 400);
    if (assignee.assigneeId && assignee.assigneeType) {
      const ok = await isChannelMember(db, existing.channelId, assignee.assigneeId, assignee.assigneeType);
      if (!ok) {
        return c.json({
          error: { code: "INVALID_ASSIGNEE", message: "task assignee must be a member of the task channel" },
        }, 400);
      }
    }
    patch.assigneeId = assignee.assigneeId;
    patch.assigneeType = assignee.assigneeType;
  }
  await db.update(tasks).set(patch).where(eq(tasks.id, existing.id));
  return c.json({ ok: true });
});

async function resolveTaskRef(
  db: ReturnType<typeof drizzle>,
  ctx: ReturnType<typeof ctxFor>,
  ref: string,
): Promise<
  | { status: "ok"; task: typeof tasks.$inferSelect }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "ambiguous" }
> {
  const trimmed = ref.trim().replace(/^#/, "");
  const exact = await db.select().from(tasks).where(eq(tasks.id, trimmed)).limit(1);
  if (exact.length > 0) {
    return await policy.tasks.canManage(ctx, exact[0].channelId)
      ? { status: "ok", task: exact[0] }
      : { status: "forbidden" };
  }

  const candidates: Array<typeof tasks.$inferSelect> = [];
  if (/^\d+$/.test(trimmed)) {
    candidates.push(...await db.select().from(tasks)
      .where(eq(tasks.taskNumber, Number(trimmed)))
      .limit(20));
  }
  if (trimmed.length >= 4) {
    candidates.push(...await db.select().from(tasks)
      .where(or(
        like(tasks.id, `${trimmed}%`),
        eq(tasks.messageId, trimmed),
        like(tasks.messageId, `${trimmed}%`),
      ))
      .limit(20));
  }

  const visible: Array<typeof tasks.$inferSelect> = [];
  const seen = new Set<string>();
  for (const t of candidates) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    if (await policy.tasks.canManage(ctx, t.channelId)) visible.push(t);
  }
  if (visible.length === 0) return { status: "not_found" };
  if (visible.length > 1) return { status: "ambiguous" };
  return { status: "ok", task: visible[0] };
}

type DB = ReturnType<typeof drizzle>;
type ListedTask = typeof tasks.$inferSelect & { title: string };
type Assignee = {
  assigneeId: string | null;
  assigneeType: "human" | "agent" | null;
};
type LatestTaskRun = {
  id: string;
  agentId: string;
  status: string;
  source: string;
  runtimeMode: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

function normalizeAssignee(
  assigneeId: string | null | undefined,
  assigneeType: "human" | "agent" | null | undefined,
): Assignee | { error: { code: string; message: string } } {
  if (assigneeId == null || assigneeId === "") {
    if (assigneeType && assigneeType !== null) {
      return { error: { code: "INVALID_ASSIGNEE", message: "assigneeType requires assigneeId" } };
    }
    return { assigneeId: null, assigneeType: null };
  }
  return { assigneeId, assigneeType: assigneeType ?? "agent" };
}

async function isChannelMember(
  db: DB,
  channelId: string,
  memberId: string,
  memberType: "human" | "agent",
): Promise<boolean> {
  const rows = await db.select({ memberId: channelMembers.memberId })
    .from(channelMembers)
    .where(and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.memberId, memberId),
      eq(channelMembers.memberType, memberType),
    ))
    .limit(1);
  return rows.length > 0;
}

export async function backfillTaskMessageAndRunLinks(
  db: DB,
  input: { taskId: string; channelId: string; messageId: string },
): Promise<void> {
  await db.update(tasks)
    .set({ messageId: input.messageId })
    .where(eq(tasks.id, input.taskId));
  await db.update(agentRuns)
    .set({ taskId: input.taskId })
    .where(and(
      eq(agentRuns.channelId, input.channelId),
      eq(agentRuns.triggerMessageId, input.messageId),
      isNull(agentRuns.taskId),
    ));
}

function dedupeListedTasks(listed: ListedTask[]): ListedTask[] {
  const seen = new Set<string>();
  const out: ListedTask[] = [];
  for (const task of listed) {
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    out.push(task);
  }
  return out;
}

async function attachLatestRunEvidence(
  d1: D1Database,
  listed: ListedTask[],
  opts?: { agentIds?: string[] },
): Promise<Array<ListedTask & { latestRun: LatestTaskRun | null }>> {
  const taskIds = listed.map((task) => task.id);
  if (taskIds.length === 0) return listed.map((task) => ({ ...task, latestRun: null }));
  if (opts?.agentIds && opts.agentIds.length === 0) {
    return listed.map((task) => ({ ...task, latestRun: null }));
  }

  const placeholders = taskIds.map(() => "?").join(",");
  const agentIds = opts?.agentIds ?? [];
  const agentPlaceholders = agentIds.map(() => "?").join(",");
  const outerAgentFilter = agentIds.length > 0 ? `AND ar.agent_id IN (${agentPlaceholders})` : "";
  const innerAgentFilter = agentIds.length > 0 ? `AND ar2.agent_id IN (${agentPlaceholders})` : "";
  const runRows = await d1.prepare(`
    SELECT
      ar.id,
      ar.task_id AS taskId,
      ar.agent_id AS agentId,
      ar.status,
      ar.source,
      ar.runtime_mode AS runtimeMode,
      ar.error,
      ar.created_at AS createdAt,
      ar.updated_at AS updatedAt,
      ar.completed_at AS completedAt
    FROM agent_runs ar
    WHERE ar.task_id IN (${placeholders})
      ${outerAgentFilter}
      AND ar.id = (
        SELECT ar2.id
        FROM agent_runs ar2
        WHERE ar2.task_id = ar.task_id
          ${innerAgentFilter}
        ORDER BY ar2.created_at DESC, ar2.id DESC
        LIMIT 1
      )
  `).bind(...taskIds, ...agentIds, ...agentIds).all<{
    id: string;
    taskId: string | null;
    agentId: string;
    status: string;
    source: string;
    runtimeMode: string;
    error: string | null;
    createdAt: number | string | null;
    updatedAt: number | string | null;
    completedAt: number | string | null;
  }>();

  const latestByTaskId = new Map<string, LatestTaskRun>();
  for (const row of runRows.results ?? []) {
    if (!row.taskId || latestByTaskId.has(row.taskId)) continue;
    latestByTaskId.set(row.taskId, {
      id: row.id,
      agentId: row.agentId,
      status: row.status,
      source: row.source,
      runtimeMode: row.runtimeMode,
      error: sanitizeUserVisibleError(row.error),
      createdAt: dateToIso(row.createdAt) ?? new Date(0).toISOString(),
      updatedAt: dateToIso(row.updatedAt) ?? new Date(0).toISOString(),
      completedAt: dateToIso(row.completedAt),
    });
  }

  return listed.map((task) => ({
    ...task,
    latestRun: latestByTaskId.get(task.id) ?? null,
  }));
}

function dateToIso(value: Date | number | string | null): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date(value).toISOString();
}
