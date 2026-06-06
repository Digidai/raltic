import { describe, expect, it, vi } from "vitest";
import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import * as schema from "@raltic/db/schema";
import app from "../src/index";
import { dispatchToAgents } from "../src/lib/agent-dispatch";
import { runAgentRunSweeper } from "../src/scheduled";
import { bridgeKey, db, request, seedAgent, seedChannel, seedServer, seedUser, userBearer } from "./helpers";

async function seedRun(input: {
  serverId: string;
  channelId: string;
  agentId: string;
  status?: "queued" | "dispatched" | "running" | "waiting_input" | "completed" | "failed";
  source?: "channel_mention" | "channel_message" | "dm" | "scheduled";
  runtimeMode?: "bridge" | "raltic";
  createdAt?: Date;
}): Promise<string> {
  const id = crypto.randomUUID();
  const now = input.createdAt ?? new Date();
  const status = input.status ?? "completed";
  const active = status === "queued" || status === "dispatched" || status === "running" || status === "waiting_input";
  await db().insert(schema.agentRuns).values({
    id,
    serverId: input.serverId,
    channelId: input.channelId,
    agentId: input.agentId,
    taskId: null,
    source: input.source ?? "channel_mention",
    status,
    runtimeMode: input.runtimeMode ?? "raltic",
    callerId: null,
    callerType: null,
    triggerMessageId: crypto.randomUUID(),
    outputMessageId: crypto.randomUUID(),
    inputPreview: "test run",
    error: status === "failed" ? "agent failed" : null,
    metadata: null,
    startedAt: status === "queued" || status === "dispatched" ? null : now,
    completedAt: active ? null : now,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function seedTaskMessage(input: {
  channelId: string;
  senderId: string;
  taskNumber?: number;
  messageId?: string;
}): Promise<{ id: string; messageId: string }> {
  const id = crypto.randomUUID();
  const messageId = input.messageId ?? crypto.randomUUID();
  const taskNumber = input.taskNumber ?? 1;
  const now = new Date();
  await db().insert(schema.messages).values({
    id: messageId,
    channelId: input.channelId,
    senderId: input.senderId,
    senderType: "human",
    content: `📋 Task #${taskNumber}: test task`,
    seq: taskNumber,
    threadParentId: null,
    createdAt: now,
    updatedAt: now,
    editedAt: null,
    deletedAt: null,
    vectorIndexedAt: null,
    pinnedAt: null,
    pinnedBy: null,
  });
  await db().insert(schema.tasks).values({
    id,
    messageId,
    channelId: input.channelId,
    taskNumber,
    status: "todo",
    assigneeId: null,
    assigneeType: null,
    createdAt: now,
    updatedAt: now,
  });
  return { id, messageId };
}

describe("GET /api/v1/agent-runs", () => {
  it("lists only runs in channels the subject can read", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visibleChannel = await seedChannel(srv, "public", [owner]);
    const hiddenPrivateChannel = await seedChannel(srv, "private", []);
    const agent = await seedAgent(srv, owner);
    const visibleRun = await seedRun({
      serverId: srv.id,
      channelId: visibleChannel.id,
      agentId: agent.id,
      status: "completed",
    });
    await seedRun({
      serverId: srv.id,
      channelId: hiddenPrivateChannel.id,
      agentId: agent.id,
      status: "failed",
    });
    const auth = await userBearer(owner);

    const res = await request(app as never, `https://test.local/api/v1/agent-runs?serverId=${srv.id}`, {
      headers: { authorization: auth },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { runs: Array<{ id: string; channelId: string; status: string }> };
    expect(body.runs.map((r) => r.id)).toEqual([visibleRun]);
    expect(body.runs[0].channelId).toBe(visibleChannel.id);
    expect(body.runs[0].status).toBe("completed");
  });

  it("requires channel visibility for run details", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const hiddenPrivateChannel = await seedChannel(srv, "private", []);
    const agent = await seedAgent(srv, owner);
    const hiddenRun = await seedRun({
      serverId: srv.id,
      channelId: hiddenPrivateChannel.id,
      agentId: agent.id,
      status: "running",
    });
    const auth = await userBearer(owner);

    const res = await request(app as never, `https://test.local/api/v1/agent-runs/${hiddenRun}`, {
      headers: { authorization: auth },
    });
    expect(res.status).toBe(404);
  });

  it("returns visible run detail with serialized timestamps", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    const runId = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      source: "dm",
      status: "completed",
    });
    const auth = await userBearer(owner);

    const res = await request(app as never, `https://test.local/api/v1/agent-runs/${runId}`, {
      headers: { authorization: auth },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { run: { id: string; source: string; createdAt: string; completedAt: string | null } };
    expect(body.run.id).toBe(runId);
    expect(body.run.source).toBe("dm");
    expect(new Date(body.run.createdAt).toString()).not.toBe("Invalid Date");
    expect(body.run.completedAt).not.toBeNull();
  });

  it("does not let hidden newer runs crowd out older visible runs", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visibleChannel = await seedChannel(srv, "public", [owner]);
    const hiddenPrivateChannel = await seedChannel(srv, "private", []);
    const agent = await seedAgent(srv, owner);
    const visibleRun = await seedRun({
      serverId: srv.id,
      channelId: visibleChannel.id,
      agentId: agent.id,
      status: "completed",
      createdAt: new Date("2026-06-05T09:00:00.000Z"),
    });
    await seedRun({
      serverId: srv.id,
      channelId: hiddenPrivateChannel.id,
      agentId: agent.id,
      status: "failed",
      createdAt: new Date("2026-06-05T10:00:00.000Z"),
    });
    const auth = await userBearer(owner);

    const res = await request(app as never, `https://test.local/api/v1/agent-runs?serverId=${srv.id}&limit=1`, {
      headers: { authorization: auth },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { runs: Array<{ id: string }> };
    expect(body.runs.map((r) => r.id)).toEqual([visibleRun]);
  });

  it("scopes bridge callers to channels containing their bound agents", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visibleChannel = await seedChannel(srv, "public", [owner]);
    const hiddenChannel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    const otherOwner = await seedUser({ name: "Other Owner" });
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: otherOwner.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const otherAgent = await seedAgent(srv, otherOwner);
    await db().insert(schema.channelMembers).values({
      channelId: visibleChannel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    await db().insert(schema.channelMembers).values({
      channelId: visibleChannel.id,
      memberId: otherAgent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const visibleRun = await seedRun({
      serverId: srv.id,
      channelId: visibleChannel.id,
      agentId: agent.id,
      status: "running",
    });
    const otherAgentRun = await seedRun({
      serverId: srv.id,
      channelId: visibleChannel.id,
      agentId: otherAgent.id,
      status: "running",
    });
    await seedRun({
      serverId: srv.id,
      channelId: hiddenChannel.id,
      agentId: agent.id,
      status: "running",
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const res = await request(app as never, `https://test.local/api/v1/agent-runs?serverId=${srv.id}`, {
      headers: { authorization: `Bearer sy_bridge_${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { runs: Array<{ id: string; channelId: string }> };
    expect(body.runs.map((r) => r.id)).toEqual([visibleRun]);
    expect(body.runs[0].channelId).toBe(visibleChannel.id);

    const detail = await request(app as never, `https://test.local/api/v1/agent-runs/${otherAgentRun}`, {
      headers: { authorization: `Bearer sy_bridge_${token}` },
    });
    expect(detail.status).toBe(404);
  });

  it("lets a bridge create and update runs for its channel agent", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const task = await seedTaskMessage({ channelId: channel.id, senderId: owner.id });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };
    const auth = `Bearer sy_bridge_${token}`;

    const created = await request(app as never, "https://test.local/api/v1/agent-runs", {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        agentId: agent.id,
        source: "channel_message",
        status: "queued",
        triggerMessageId: task.messageId,
        inputPreview: "please do the work",
        metadata: { ignoredSecret: "ck_12345678901234567890123456789012" },
      }),
    });
    expect(created.status).toBe(200);
    const createdBody = await created.json() as { run: { id: string; status: string; source: string; runtimeMode: string; taskId: string | null; metadata: unknown } };
    expect(createdBody.run.status).toBe("queued");
    expect(createdBody.run.source).toBe("channel_message");
    expect(createdBody.run.runtimeMode).toBe("bridge");
    expect(createdBody.run.taskId).toBe(task.id);
    expect(createdBody.run.metadata).toBeNull();

    const running = await request(app as never, `https://test.local/api/v1/agent-runs/${createdBody.run.id}`, {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "running" }),
    });
    expect(running.status).toBe(200);
    const runningBody = await running.json() as { run: { status: string; startedAt: string | null } };
    expect(runningBody.run.status).toBe("running");
    expect(runningBody.run.startedAt).not.toBeNull();

    const rawError = "runtime failed with sk-ant-secret-abcdef123456 ck_12345678901234567890123456789012 sy_bridge_secretabcdef123456 at /Users/dai/project/app.ts token=plain-secret";
    const failed = await request(app as never, `https://test.local/api/v1/agent-runs/${createdBody.run.id}`, {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "failed", error: rawError, metadata: { ignored: "secret" } }),
    });
    expect(failed.status).toBe(200);
    const failedBody = await failed.json() as { run: { status: string; error: string | null; completedAt: string | null } };
    expect(failedBody.run.status).toBe("failed");
    expect(failedBody.run.error).toContain("[redacted token]");
    expect(failedBody.run.error).toContain("[local path]");
    expect(failedBody.run.error).not.toContain("sk-ant-secret");
    expect(failedBody.run.error).not.toContain("ck_123456");
    expect(failedBody.run.error).not.toContain("sy_bridge_secret");
    expect(failedBody.run.error).not.toContain("/Users/dai");
    expect(failedBody.run.error).not.toContain("plain-secret");
    expect(failedBody.run.completedAt).not.toBeNull();
    const [stored] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, createdBody.run.id)).limit(1);
    expect(stored.error).toBe(failedBody.run.error);
    expect(stored.metadata).toBeNull();
  });

  it("rejects bridge output messages from another channel", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const otherChannel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const otherMessage = await seedTaskMessage({ channelId: otherChannel.id, senderId: owner.id });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };
    const auth = `Bearer sy_bridge_${token}`;

    const created = await request(app as never, "https://test.local/api/v1/agent-runs", {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        agentId: agent.id,
        source: "channel_message",
        status: "queued",
        inputPreview: "please do the work",
      }),
    });
    expect(created.status).toBe(200);
    const createdBody = await created.json() as { run: { id: string } };

    const patched = await request(app as never, `https://test.local/api/v1/agent-runs/${createdBody.run.id}`, {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        outputMessageId: otherMessage.messageId,
      }),
    });
    expect(patched.status).toBe(400);
    const body = await patched.json() as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_OUTPUT_MESSAGE");
    const [stored] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, createdBody.run.id)).limit(1);
    expect(stored.status).toBe("queued");
    expect(stored.outputMessageId).toBeNull();

    const sameChannelHumanMessage = await seedTaskMessage({ channelId: channel.id, senderId: owner.id, taskNumber: 3 });
    const patchedHuman = await request(app as never, `https://test.local/api/v1/agent-runs/${createdBody.run.id}`, {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        outputMessageId: sameChannelHumanMessage.messageId,
      }),
    });
    expect(patchedHuman.status).toBe(400);
    const humanBody = await patchedHuman.json() as { error: { code: string } };
    expect(humanBody.error.code).toBe("INVALID_OUTPUT_MESSAGE");
    const [afterHuman] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, createdBody.run.id)).limit(1);
    expect(afterHuman.status).toBe("queued");
    expect(afterHuman.outputMessageId).toBeNull();

    const patchedMissing = await request(app as never, `https://test.local/api/v1/agent-runs/${createdBody.run.id}`, {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        outputMessageId: crypto.randomUUID(),
      }),
    });
    expect(patchedMissing.status).toBe(400);
    const missingBody = await patchedMissing.json() as { error: { code: string } };
    expect(missingBody.error.code).toBe("INVALID_OUTPUT_MESSAGE");
    const [afterMissing] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, createdBody.run.id)).limit(1);
    expect(afterMissing.status).toBe("queued");
    expect(afterMissing.outputMessageId).toBeNull();
  });

  it("rejects bridge run creation when the requested agent is not in the channel", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const requestedAgent = await seedAgent(srv, owner);
    const channelAgent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: channelAgent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const res = await request(app as never, "https://test.local/api/v1/agent-runs", {
      method: "POST",
      headers: { authorization: `Bearer sy_bridge_${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        agentId: requestedAgent.id,
        source: "channel_message",
        status: "queued",
        triggerMessageId: "trigger-message",
      }),
    });
    expect(res.status).toBe(403);
  });

  it("rejects bridge updates to non-bridge runtime runs", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const runId = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "running",
      runtimeMode: "raltic",
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const res = await request(app as never, `https://test.local/api/v1/agent-runs/${runId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer sy_bridge_${token}`, "content-type": "application/json" },
      body: JSON.stringify({ status: "failed", error: "local bridge should not own cloud run" }),
    });
    expect(res.status).toBe(403);
    const [row] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, runId)).limit(1);
    expect(row.status).toBe("running");
  });

  it("rejects bridge updates after a run reaches a terminal status", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const runId = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "completed",
      runtimeMode: "bridge",
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const res = await request(app as never, `https://test.local/api/v1/agent-runs/${runId}`, {
      method: "PATCH",
      headers: { authorization: `Bearer sy_bridge_${token}`, "content-type": "application/json" },
      body: JSON.stringify({ status: "running" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("RUN_FINALIZED");
    const [row] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, runId)).limit(1);
    expect(row.status).toBe("completed");
  });

  it("records the persisted trigger message sender as the run caller", async () => {
    const owner = await seedUser({ name: "Owner" });
    const caller = await seedUser({ name: "Requester" });
    const srv = await seedServer(owner);
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: caller.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const channel = await seedChannel(srv, "public", [owner, caller]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const messageId = crypto.randomUUID();
    const now = new Date();
    await db().insert(schema.messages).values({
      id: messageId,
      channelId: channel.id,
      senderId: caller.id,
      senderType: "human",
      content: "please run this",
      seq: 1,
      threadParentId: null,
      createdAt: now,
      updatedAt: now,
      editedAt: null,
      deletedAt: null,
      vectorIndexedAt: null,
      pinnedAt: null,
      pinnedBy: null,
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const created = await request(app as never, "https://test.local/api/v1/agent-runs", {
      method: "POST",
      headers: { authorization: `Bearer sy_bridge_${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        agentId: agent.id,
        source: "channel_message",
        status: "queued",
        triggerMessageId: messageId,
        callerId: owner.id,
        callerType: "human",
      }),
    });
    expect(created.status).toBe(200);
    const body = await created.json() as { run: { callerId: string | null; callerType: string | null } };
    expect(body.run.callerId).toBe(caller.id);
    expect(body.run.callerType).toBe("human");
  });

  it("does not trust caller fields when no trigger message is persisted", async () => {
    const owner = await seedUser({ name: "Owner" });
    const caller = await seedUser({ name: "Requester" });
    const srv = await seedServer(owner);
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: caller.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const channel = await seedChannel(srv, "public", [owner, caller]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const created = await request(app as never, "https://test.local/api/v1/agent-runs", {
      method: "POST",
      headers: { authorization: `Bearer sy_bridge_${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        agentId: agent.id,
        source: "channel_message",
        status: "queued",
        callerId: caller.id,
        callerType: "human",
      }),
    });
    expect(created.status).toBe(200);
    const body = await created.json() as { run: { callerId: string | null; callerType: string | null } };
    expect(body.run.callerId).toBe(owner.id);
    expect(body.run.callerType).toBe("human");
  });
});

describe("dispatchToAgents run ledger", () => {
  it("creates a run before invoking a cloud agent", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    await db().update(schema.agents)
      .set({ runtimeMode: "raltic", status: "online" })
      .where(eq(schema.agents.id, agent.id));
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const stub = {
      bind: vi.fn().mockResolvedValue(undefined),
      onInvoke: vi.fn().mockResolvedValue({ ok: true, messageId: "agent-output" }),
    };
    const mockEnv = {
      DB: env.DB,
      RALTIC_AGENT: {
        idFromName: (id: string) => id,
        get: () => stub,
      },
    };
    const task = await seedTaskMessage({
      channelId: channel.id,
      senderId: owner.id,
      messageId: "trigger-message",
    });

    await dispatchToAgents(mockEnv as never, {
      channelId: channel.id,
      messageId: "trigger-message",
      threadParentId: null,
      text: "hello @agent",
      callerId: owner.id,
      callerType: "human",
      source: "channel_mention",
      mentionedAgentIds: [agent.id],
    });

    expect(stub.bind).toHaveBeenCalledWith({
      agentId: agent.id,
      workspaceId: srv.id,
      ownerId: owner.id,
    });
    const invokeArg = stub.onInvoke.mock.calls[0][0] as { runId?: string; source: string };
    expect(invokeArg.runId).toMatch(/[0-9a-f-]{36}/);
    expect(invokeArg.source).toBe("channel_mention");
    const rows = await db().select().from(schema.agentRuns)
      .where(eq(schema.agentRuns.id, invokeArg.runId!))
      .limit(1);
    expect(rows[0].status).toBe("dispatched");
    expect(rows[0].triggerMessageId).toBe("trigger-message");
    expect(rows[0].agentId).toBe(agent.id);
    expect(rows[0].taskId).toBe(task.id);
  });
});

describe("scheduled agent run sweeper", () => {
  it("marks only stale active runs failed", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    const now = new Date("2026-06-05T12:00:00.000Z");
    const staleAt = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const freshAt = new Date(now.getTime() - 60 * 60 * 1000);

    const staleQueued = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "queued",
      createdAt: staleAt,
    });
    const staleRunning = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "running",
      createdAt: staleAt,
    });
    const freshRunning = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "running",
      createdAt: freshAt,
    });
    const completedOld = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "completed",
      createdAt: staleAt,
    });

    const result = await runAgentRunSweeper(env, { now });
    expect(result.failed).toBe(2);

    const rows = await db().select().from(schema.agentRuns)
      .where(eq(schema.agentRuns.serverId, srv.id));
    const byId = new Map(rows.map((r) => [r.id, r]));

    expect(byId.get(staleQueued)?.status).toBe("failed");
    expect(byId.get(staleRunning)?.status).toBe("failed");
    expect(byId.get(staleRunning)?.error).toContain("scheduled sweeper");
    expect(byId.get(staleRunning)?.completedAt?.toISOString()).toBe(now.toISOString());
    expect(byId.get(freshRunning)?.status).toBe("running");
    expect(byId.get(completedOld)?.status).toBe("completed");
  });
});
