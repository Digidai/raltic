import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@raltic/db/schema";
import app from "../src/index";
import { backfillTaskMessageAndRunLinks } from "../src/routes/tasks";
import { bridgeKey, db, request, seedAgent, seedChannel, seedServer, seedUser, userBearer } from "./helpers";

async function seedTask(
  channelId: string,
  senderId: string,
  taskNumber: number,
): Promise<{ id: string; messageId: string }> {
  const id = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const now = new Date();
  await db().insert(schema.messages).values({
    id: messageId,
    channelId,
    senderId,
    senderType: "human",
    content: `Task #${taskNumber}`,
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
    channelId,
    taskNumber,
    status: "todo",
    assigneeId: null,
    assigneeType: null,
    createdAt: now,
    updatedAt: now,
  });
  return { id, messageId };
}

async function seedTaskRun(input: {
  serverId: string;
  channelId: string;
  agentId: string;
  taskId: string;
  status: "running" | "completed" | "failed";
  createdAt: Date;
  error?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  const terminal = input.status === "completed" || input.status === "failed";
  await db().insert(schema.agentRuns).values({
    id,
    serverId: input.serverId,
    channelId: input.channelId,
    agentId: input.agentId,
    taskId: input.taskId,
    source: "channel_message",
    status: input.status,
    runtimeMode: "bridge",
    callerId: null,
    callerType: null,
    triggerMessageId: null,
    outputMessageId: null,
    inputPreview: "test run",
    error: input.error ?? null,
    metadata: null,
    startedAt: input.createdAt,
    completedAt: terminal ? input.createdAt : null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
  return id;
}

describe("GET /api/v1/tasks", () => {
  it("includes latest agent run evidence for visible tasks only", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const hiddenChannel = await seedChannel(srv, "private", []);
    const agent = await seedAgent(srv, owner);
    const task = await seedTask(channel.id, owner.id, 1);
    const hiddenTask = await seedTask(hiddenChannel.id, owner.id, 2);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    await seedTaskRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      taskId: task.id,
      status: "completed",
      createdAt: new Date("2026-06-05T08:00:00.000Z"),
    });
    const latestRunId = await seedTaskRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      taskId: task.id,
      status: "failed",
      createdAt: new Date("2026-06-05T09:00:00.000Z"),
      error: "runtime exited with code 1",
    });
    await seedTaskRun({
      serverId: srv.id,
      channelId: hiddenChannel.id,
      agentId: agent.id,
      taskId: hiddenTask.id,
      status: "running",
      createdAt: new Date("2026-06-05T10:00:00.000Z"),
    });
    const auth = await userBearer(owner);

    const res = await request(app as never, `https://test.local/api/v1/tasks?serverId=${srv.id}`, {
      headers: { authorization: auth },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as {
      tasks: Array<{
        id: string;
        latestRun: {
          id: string;
          status: string;
          agentId: string;
          runtimeMode: string;
          error: string | null;
          updatedAt: string;
        } | null;
      }>;
    };
    expect(body.tasks.map((row) => row.id)).toEqual([task.id]);
    expect(body.tasks[0].latestRun?.id).toBe(latestRunId);
    expect(body.tasks[0].latestRun?.status).toBe("failed");
    expect(body.tasks[0].latestRun?.agentId).toBe(agent.id);
    expect(body.tasks[0].latestRun?.runtimeMode).toBe("bridge");
    expect(body.tasks[0].latestRun?.error).toBe("runtime exited with code 1");
    expect(new Date(body.tasks[0].latestRun?.updatedAt ?? "").toString()).not.toBe("Invalid Date");
  });

  it("deduplicates bridge-visible tasks when multiple bound agents share a channel", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agentA = await seedAgent(srv, owner);
    const agentB = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values([
      {
        channelId: channel.id,
        memberId: agentA.id,
        memberType: "agent",
        joinedAt: new Date(),
        lastReadSeq: 0,
      },
      {
        channelId: channel.id,
        memberId: agentB.id,
        memberType: "agent",
        joinedAt: new Date(),
        lastReadSeq: 0,
      },
    ]);
    const task = await seedTask(channel.id, owner.id, 1);
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const res = await request(app as never, `https://test.local/api/v1/tasks?serverId=${srv.id}`, {
      headers: { authorization: `Bearer sy_bridge_${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { tasks: Array<{ id: string }> };
    expect(body.tasks.map((row) => row.id)).toEqual([task.id]);
  });

  it("scopes bridge task latestRun evidence to bound agents", async () => {
    const owner = await seedUser({ name: "Owner" });
    const otherOwner = await seedUser({ name: "Other Owner" });
    const srv = await seedServer(owner);
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: otherOwner.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const channel = await seedChannel(srv, "public", [owner, otherOwner]);
    const ownedAgent = await seedAgent(srv, owner);
    const otherAgent = await seedAgent(srv, otherOwner);
    await db().insert(schema.channelMembers).values([
      {
        channelId: channel.id,
        memberId: ownedAgent.id,
        memberType: "agent",
        joinedAt: new Date(),
        lastReadSeq: 0,
      },
      {
        channelId: channel.id,
        memberId: otherAgent.id,
        memberType: "agent",
        joinedAt: new Date(),
        lastReadSeq: 0,
      },
    ]);
    const task = await seedTask(channel.id, owner.id, 1);
    const ownedRunId = await seedTaskRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: ownedAgent.id,
      taskId: task.id,
      status: "completed",
      createdAt: new Date("2026-06-05T08:00:00.000Z"),
    });
    await seedTaskRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: otherAgent.id,
      taskId: task.id,
      status: "failed",
      createdAt: new Date("2026-06-05T09:00:00.000Z"),
      error: "other agent failed",
    });
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };

    const res = await request(app as never, `https://test.local/api/v1/tasks?serverId=${srv.id}`, {
      headers: { authorization: `Bearer sy_bridge_${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as {
      tasks: Array<{
        id: string;
        latestRun: { id: string; agentId: string; status: string; error: string | null } | null;
      }>;
    };
    expect(body.tasks.map((row) => row.id)).toEqual([task.id]);
    expect(body.tasks[0].latestRun?.id).toBe(ownedRunId);
    expect(body.tasks[0].latestRun?.agentId).toBe(ownedAgent.id);
    expect(body.tasks[0].latestRun?.status).toBe("completed");
    expect(body.tasks[0].latestRun?.error).toBeNull();
  });

  it("filters by taskId without exposing hidden-channel tasks", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visibleChannel = await seedChannel(srv, "public", [owner]);
    const hiddenChannel = await seedChannel(srv, "private", []);
    const visibleTask = await seedTask(visibleChannel.id, owner.id, 1);
    const hiddenTask = await seedTask(hiddenChannel.id, owner.id, 2);
    const auth = await userBearer(owner);

    const visibleRes = await request(app as never, `https://test.local/api/v1/tasks?serverId=${srv.id}&taskId=${visibleTask.id}`, {
      headers: { authorization: auth },
    });
    expect(visibleRes.status).toBe(200);
    const visibleBody = await visibleRes.json() as { tasks: Array<{ id: string }> };
    expect(visibleBody.tasks.map((row) => row.id)).toEqual([visibleTask.id]);

    const hiddenRes = await request(app as never, `https://test.local/api/v1/tasks?serverId=${srv.id}&taskId=${hiddenTask.id}`, {
      headers: { authorization: auth },
    });
    expect(hiddenRes.status).toBe(200);
    const hiddenBody = await hiddenRes.json() as { tasks: Array<{ id: string }> };
    expect(hiddenBody.tasks).toEqual([]);
  });
});

describe("POST /api/v1/tasks", () => {
  it("rejects assigning a task to an agent outside the selected channel", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    const auth = await userBearer(owner);

    const res = await request(app as never, "https://test.local/api/v1/tasks", {
      method: "POST",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        title: "Research competitors",
        assigneeId: agent.id,
        assigneeType: "agent",
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_ASSIGNEE");
  });
});

describe("task message/run backfill", () => {
  it("links a racing bridge run after task message backfill", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    const taskId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const runId = crypto.randomUUID();
    const now = new Date();
    await db().insert(schema.messages).values({
      id: messageId,
      channelId: channel.id,
      senderId: owner.id,
      senderType: "human",
      content: "📋 Task #1: racing bridge run",
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
    await db().insert(schema.tasks).values({
      id: taskId,
      messageId: null,
      channelId: channel.id,
      taskNumber: 1,
      status: "todo",
      assigneeId: agent.id,
      assigneeType: "agent",
      createdAt: now,
      updatedAt: now,
    });
    await db().insert(schema.agentRuns).values({
      id: runId,
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      taskId: null,
      source: "channel_message",
      status: "queued",
      runtimeMode: "bridge",
      callerId: owner.id,
      callerType: "human",
      triggerMessageId: messageId,
      outputMessageId: null,
      inputPreview: "test",
      error: null,
      metadata: null,
      startedAt: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await backfillTaskMessageAndRunLinks(db(), {
      taskId,
      channelId: channel.id,
      messageId,
    });

    const [task] = await db().select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).limit(1);
    const [run] = await db().select().from(schema.agentRuns).where(eq(schema.agentRuns.id, runId)).limit(1);
    expect(task.messageId).toBe(messageId);
    expect(run.taskId).toBe(taskId);
  });
});

describe("PATCH /api/v1/tasks/:ref", () => {
  it("resolves visible tasks by task number and message id prefix", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const auth = await userBearer(owner);
    const task = await seedTask(channel.id, owner.id, 7);

    const byNumber = await request(app as never, "https://test.local/api/v1/tasks/7", {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(byNumber.status).toBe(200);

    const afterNumber = await db().select().from(schema.tasks).where(eq(schema.tasks.id, task.id)).limit(1);
    expect(afterNumber[0].status).toBe("in_progress");

    const byMessagePrefix = await request(app as never, `https://test.local/api/v1/tasks/${task.messageId.slice(0, 8)}`, {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    expect(byMessagePrefix.status).toBe(200);

    const afterPrefix = await db().select().from(schema.tasks).where(eq(schema.tasks.id, task.id)).limit(1);
    expect(afterPrefix[0].status).toBe("done");
  });

  it("returns 409 for ambiguous visible task numbers", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channelA = await seedChannel(srv, "public", [owner]);
    const channelB = await seedChannel(srv, "public", [owner]);
    const auth = await userBearer(owner);
    await seedTask(channelA.id, owner.id, 3);
    await seedTask(channelB.id, owner.id, 3);

    const res = await request(app as never, "https://test.local/api/v1/tasks/3", {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("AMBIGUOUS_TASK");
  });

  it("lets bridge-scoped agents resolve their visible task numbers only", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const hiddenChannel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    await db().insert(schema.channelMembers).values({
      channelId: channel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });
    const visible = await seedTask(channel.id, owner.id, 11);
    const hidden = await seedTask(hiddenChannel.id, owner.id, 12);
    const key = await bridgeKey(owner, srv);
    const connected = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: key }),
    });
    expect(connected.status).toBe(200);
    const { token } = await connected.json() as { token: string };
    const auth = `Bearer sy_bridge_${token}`;

    const visiblePatch = await request(app as never, "https://test.local/api/v1/tasks/11", {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
    expect(visiblePatch.status).toBe(200);
    const visibleRows = await db().select().from(schema.tasks).where(eq(schema.tasks.id, visible.id)).limit(1);
    expect(visibleRows[0].status).toBe("in_progress");

    const hiddenPatch = await request(app as never, "https://test.local/api/v1/tasks/12", {
      method: "PATCH",
      headers: { authorization: auth, "content-type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    expect(hiddenPatch.status).toBe(404);
    const hiddenRows = await db().select().from(schema.tasks).where(eq(schema.tasks.id, hidden.id)).limit(1);
    expect(hiddenRows[0].status).toBe("todo");
  });
});
