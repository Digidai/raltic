import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requirePolicy, policy, type Subject } from "@raltic/auth-core";
import { agentRuns, agents, channelMembers, channels, messages, serverMembers, tasks } from "@raltic/db";
import { createAgentRunRequest, listAgentRunsQuery, sanitizeUserVisibleError, updateAgentRunRequest } from "@raltic/protocol";
import type { Env, Variables } from "../lib/env";
import { ctxFor, requireAuth } from "../lib/auth";

export const agentRunsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();
const TERMINAL_AGENT_RUN_STATUSES = ["completed", "failed", "cancelled"] as const;
const ACTIVE_AGENT_RUN_STATUSES = ["queued", "dispatched", "running", "waiting_input"] as const;

// ---------------------------------------------------------------------------
// /api/v1/agent-runs — durable execution ledger for agent work.
// ---------------------------------------------------------------------------
agentRunsRoutes.post("/api/v1/agent-runs", requireAuth, async (c) => {
  const subject = c.get("subject");
  if (subject.kind !== "bridge") {
    return c.json({ error: { code: "FORBIDDEN", message: "bridge token required" } }, 403);
  }

  const body = createAgentRunRequest.parse(await c.req.json());
  const ctx = ctxFor(c);
  await requirePolicy(policy.agents.canRead(ctx, body.agentId));
  await requirePolicy(policy.channels.canRead(ctx, body.channelId));

  const db = drizzle(c.env.DB);
  const rows = await db
    .select({
      serverId: agents.serverId,
      runtimeMode: agents.runtimeMode,
    })
    .from(agents)
    .innerJoin(channels, eq(channels.serverId, agents.serverId))
    .innerJoin(channelMembers, and(
      eq(channelMembers.channelId, channels.id),
      eq(channelMembers.memberId, agents.id),
      eq(channelMembers.memberType, "agent"),
    ))
    .where(and(
      eq(agents.id, body.agentId),
      eq(channels.id, body.channelId),
      eq(agents.runtimeMode, "bridge"),
    ))
    .limit(1);
  if (rows.length === 0) {
    return c.json({ error: { code: "FORBIDDEN", message: "agent is not available in this channel" } }, 403);
  }
  const taskId = body.triggerMessageId
    ? await resolveTaskIdForMessage(db, body.channelId, body.triggerMessageId)
    : null;
  const caller = await resolveRunCaller(db, {
    channelId: body.channelId,
    triggerMessageId: body.triggerMessageId ?? null,
    fallbackUserId: subject.userId,
  });

  const now = new Date();
  const run: typeof agentRuns.$inferInsert = {
    id: crypto.randomUUID(),
    serverId: rows[0].serverId,
    channelId: body.channelId,
    agentId: body.agentId,
    taskId,
    source: body.source,
    status: body.status,
    runtimeMode: rows[0].runtimeMode,
    callerId: caller.id,
    callerType: caller.type,
    triggerMessageId: body.triggerMessageId ?? null,
    outputMessageId: null,
    inputPreview: body.inputPreview ?? null,
    error: null,
    metadata: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(agentRuns).values(run);
  return c.json({ run: serializeRun(run as AgentRunRow) });
});

agentRunsRoutes.patch("/api/v1/agent-runs/:id", requireAuth, async (c) => {
  const subject = c.get("subject");
  if (subject.kind !== "bridge") {
    return c.json({ error: { code: "FORBIDDEN", message: "bridge token required" } }, 403);
  }
  const id = c.req.param("id");
  const body = updateAgentRunRequest.parse(await c.req.json());
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
  if (rows.length === 0) return c.json({ error: { code: "NOT_FOUND", message: "no such agent run" } }, 404);
  const row = rows[0];
  if (row.serverId !== subject.serverId || !subject.agentIds.includes(row.agentId)) {
    return c.json({ error: { code: "FORBIDDEN", message: "agent run is outside this bridge scope" } }, 403);
  }
  if (row.runtimeMode !== "bridge") {
    return c.json({ error: { code: "FORBIDDEN", message: "bridge can only update bridge runtime runs" } }, 403);
  }
  if (isTerminalStatus(row.status)) {
    return c.json({ error: { code: "RUN_FINALIZED", message: "agent run is already finalized" } }, 409);
  }
  if (body.outputMessageId) {
    const ok = await outputMessageBelongsToRun(db, row.channelId, row.agentId, body.outputMessageId);
    if (!ok) {
      return c.json({
        error: { code: "INVALID_OUTPUT_MESSAGE", message: "outputMessageId must be an agent message in the run channel" },
      }, 400);
    }
  }

  const now = new Date();
  const terminal = isTerminalStatus(body.status);
  const patch: Partial<typeof agentRuns.$inferInsert> = {
    status: body.status,
    updatedAt: now,
  };
  if (body.status === "running" || body.status === "waiting_input" || terminal) {
    patch.startedAt = row.startedAt ?? now;
  }
  if (terminal) patch.completedAt = now;
  if (body.outputMessageId !== undefined) patch.outputMessageId = body.outputMessageId;
  if (body.status === "completed") patch.error = null;
  else if (body.error !== undefined) patch.error = sanitizeUserVisibleError(body.error);

  await db.update(agentRuns).set(patch).where(and(
    eq(agentRuns.id, id),
    eq(agentRuns.runtimeMode, "bridge"),
    inArray(agentRuns.status, [...ACTIVE_AGENT_RUN_STATUSES]),
  ));
  const fresh = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
  const updated = fresh[0] ?? row;
  if (updated.status !== body.status && isTerminalStatus(updated.status)) {
    return c.json({ error: { code: "RUN_FINALIZED", message: "agent run is already finalized" } }, 409);
  }
  return c.json({ run: serializeRun(updated) });
});

agentRunsRoutes.get("/api/v1/agent-runs", requireAuth, async (c) => {
  const q = listAgentRunsQuery.parse(Object.fromEntries(new URL(c.req.url).searchParams));
  const ctx = ctxFor(c);
  const subject = c.get("subject");
  const db = drizzle(c.env.DB);

  if (q.channelId) {
    await requirePolicy(policy.channels.canRead(ctx, q.channelId));
  }
  if (q.serverId) {
    await requirePolicy(policy.servers.canRead(ctx, q.serverId));
  }

  const conds = [
    q.serverId ? eq(agentRuns.serverId, q.serverId) : undefined,
    q.channelId ? eq(agentRuns.channelId, q.channelId) : undefined,
    q.agentId ? eq(agentRuns.agentId, q.agentId) : undefined,
    q.taskId ? eq(agentRuns.taskId, q.taskId) : undefined,
    q.status ? eq(agentRuns.status, q.status) : undefined,
    q.source ? eq(agentRuns.source, q.source) : undefined,
    subject.kind === "bridge" ? inArray(agentRuns.agentId, subject.agentIds) : undefined,
    subject.kind === "machine" || subject.kind === "bridge"
      ? eq(agentRuns.serverId, subject.serverId)
      : undefined,
  ].filter(Boolean);

  if (!q.channelId) {
    const visibleChannelIds = await listVisibleRunChannelIds(db, subject, q.serverId);
    if (visibleChannelIds.length === 0) return c.json({ runs: [] });
    conds.push(inArray(agentRuns.channelId, visibleChannelIds));
  }

  const rows = await db
    .select()
    .from(agentRuns)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(agentRuns.createdAt))
    .limit(q.limit);

  return c.json({ runs: rows.map(serializeRun) });
});

agentRunsRoutes.get("/api/v1/agent-runs/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  const ctx = ctxFor(c);
  const subject = c.get("subject");
  const db = drizzle(c.env.DB);
  const rows = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1);
  if (rows.length === 0) return c.json({ error: { code: "NOT_FOUND", message: "no such agent run" } }, 404);
  if (subject.kind === "bridge" && !subject.agentIds.includes(rows[0].agentId)) {
    return c.json({ error: { code: "NOT_FOUND", message: "no such agent run" } }, 404);
  }
  const canRead = await policy.channels.canRead(ctx, rows[0].channelId);
  if (!canRead) return c.json({ error: { code: "NOT_FOUND", message: "no such agent run" } }, 404);
  return c.json({ run: serializeRun(rows[0]) });
});

type AgentRunRow = typeof agentRuns.$inferSelect;
type DB = ReturnType<typeof drizzle>;

async function listVisibleRunChannelIds(
  db: DB,
  subject: Subject,
  serverId?: string,
): Promise<string[]> {
  const scopedServerId = subject.kind === "user" ? serverId : subject.serverId;
  const ids = new Set<string>();

  if (subject.kind === "bridge") {
    if (subject.agentIds.length === 0) return [];
    const rows = await db
      .select({ id: channelMembers.channelId })
      .from(channelMembers)
      .innerJoin(channels, eq(channels.id, channelMembers.channelId))
      .where(and(
        eq(channelMembers.memberType, "agent"),
        inArray(channelMembers.memberId, subject.agentIds),
        scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
      ));
    for (const row of rows) ids.add(row.id);
    return [...ids];
  }

  const humanRows = await db
    .select({ id: channelMembers.channelId })
    .from(channelMembers)
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(and(
      eq(channelMembers.memberId, subject.userId),
      eq(channelMembers.memberType, "human"),
      scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
    ));
  for (const row of humanRows) ids.add(row.id);

  const ownedAgentRows = await db
    .select({ id: channelMembers.channelId })
    .from(channelMembers)
    .innerJoin(agents, eq(agents.id, channelMembers.memberId))
    .innerJoin(channels, eq(channels.id, channelMembers.channelId))
    .where(and(
      eq(channelMembers.memberType, "agent"),
      eq(agents.ownerId, subject.userId),
      scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
    ));
  for (const row of ownedAgentRows) ids.add(row.id);

  const publicRows = await db
    .select({ id: channels.id })
    .from(channels)
    .innerJoin(serverMembers, eq(serverMembers.serverId, channels.serverId))
    .where(and(
      eq(channels.type, "public"),
      eq(serverMembers.memberId, subject.userId),
      eq(serverMembers.memberType, "human"),
      scopedServerId ? eq(channels.serverId, scopedServerId) : undefined,
    ));
  for (const row of publicRows) ids.add(row.id);

  return [...ids];
}

async function resolveTaskIdForMessage(
  db: DB,
  channelId: string,
  messageId: string,
): Promise<string | null> {
  const row = await db.select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.channelId, channelId), eq(tasks.messageId, messageId)))
    .limit(1);
  return row[0]?.id ?? null;
}

async function resolveRunCaller(
  db: DB,
  input: {
    channelId: string;
    triggerMessageId: string | null;
    fallbackUserId: string;
  },
): Promise<{ id: string; type: "human" | "agent" }> {
  if (input.triggerMessageId) {
    const rows = await db.select({
      senderId: messages.senderId,
      senderType: messages.senderType,
    })
      .from(messages)
      .where(and(eq(messages.channelId, input.channelId), eq(messages.id, input.triggerMessageId)))
      .limit(1);
    const sender = rows[0];
    if (sender?.senderId && (sender.senderType === "human" || sender.senderType === "agent")) {
      return { id: sender.senderId, type: sender.senderType };
    }
  }

  return { id: input.fallbackUserId, type: "human" };
}

async function outputMessageBelongsToRun(
  db: DB,
  channelId: string,
  agentId: string,
  messageId: string,
): Promise<boolean> {
  const row = await db.select({
    channelId: messages.channelId,
    senderId: messages.senderId,
    senderType: messages.senderType,
  })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  if (row.length === 0) return false;
  return row[0].channelId === channelId
    && row[0].senderType === "agent"
    && row[0].senderId === agentId;
}

function isTerminalStatus(status: string): boolean {
  return TERMINAL_AGENT_RUN_STATUSES.includes(status as typeof TERMINAL_AGENT_RUN_STATUSES[number]);
}

function serializeRun(row: AgentRunRow) {
  return {
    id: row.id,
    serverId: row.serverId,
    channelId: row.channelId,
    agentId: row.agentId,
    taskId: row.taskId,
    source: row.source,
    status: row.status,
    runtimeMode: row.runtimeMode,
    callerId: row.callerId,
    callerType: row.callerType,
    triggerMessageId: row.triggerMessageId,
    outputMessageId: row.outputMessageId,
    inputPreview: row.inputPreview,
    error: sanitizeUserVisibleError(row.error),
    metadata: row.metadata,
    startedAt: dateToIso(row.startedAt),
    completedAt: dateToIso(row.completedAt),
    createdAt: dateToIso(row.createdAt) ?? new Date(0).toISOString(),
    updatedAt: dateToIso(row.updatedAt) ?? new Date(0).toISOString(),
  };
}

function dateToIso(value: Date | number | string | null): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date(value).toISOString();
}
