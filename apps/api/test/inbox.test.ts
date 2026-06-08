import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import * as schema from "@raltic/db/schema";
import { inboxResponse } from "@raltic/protocol";
import app from "../src/index";
import { bridgeKey, db, request, seedAgent, seedChannel, seedServer, seedUser, userBearer } from "./helpers";

async function seedTask(input: {
  channelId: string;
  senderId: string;
  taskNumber: number;
  status: "todo" | "in_progress" | "in_review" | "done";
  assigneeId?: string | null;
  assigneeType?: "human" | "agent" | null;
  createdAt: Date;
}): Promise<{ id: string; messageId: string }> {
  const id = crypto.randomUUID();
  const messageId = crypto.randomUUID();
  await db().insert(schema.messages).values({
    id: messageId,
    channelId: input.channelId,
    senderId: input.senderId,
    senderType: "human",
    content: `📋 Task #${input.taskNumber}: queue item ${input.taskNumber}`,
    seq: input.taskNumber,
    threadParentId: null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
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
    taskNumber: input.taskNumber,
    status: input.status,
    assigneeId: input.assigneeId ?? null,
    assigneeType: input.assigneeType ?? null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
  return { id, messageId };
}

async function seedRun(input: {
  serverId: string;
  channelId: string;
  agentId: string;
  status: "waiting_input" | "failed" | "running";
  createdAt: Date;
  inputPreview?: string;
  error?: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db().insert(schema.agentRuns).values({
    id,
    serverId: input.serverId,
    channelId: input.channelId,
    agentId: input.agentId,
    taskId: null,
    source: "channel_mention",
    status: input.status,
    runtimeMode: "raltic",
    callerId: null,
    callerType: "human",
    triggerMessageId: crypto.randomUUID(),
    outputMessageId: null,
    inputPreview: input.inputPreview ?? "needs a human decision",
    error: input.error ?? (input.status === "failed" ? "agent failed" : null),
    metadata: null,
    startedAt: input.createdAt,
    completedAt: input.status === "failed" ? input.createdAt : null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  });
  return id;
}

describe("GET /api/v1/inbox", () => {
  it("returns attention work from visible workflows without leaking hidden private channels", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visible = await seedChannel(srv, "public", [owner]);
    const hidden = await seedChannel(srv, "private", []);
    const agent = await seedAgent(srv, owner);

    const reviewTask = await seedTask({
      channelId: visible.id,
      senderId: owner.id,
      taskNumber: 1,
      status: "in_review",
      assigneeId: agent.id,
      assigneeType: "agent",
      createdAt: new Date("2026-06-07T00:00:00.000Z"),
    });
    const assignedTask = await seedTask({
      channelId: visible.id,
      senderId: owner.id,
      taskNumber: 2,
      status: "todo",
      assigneeId: owner.id,
      assigneeType: "human",
      createdAt: new Date("2026-06-07T00:01:00.000Z"),
    });
    const hiddenTask = await seedTask({
      channelId: hidden.id,
      senderId: owner.id,
      taskNumber: 3,
      status: "in_review",
      assigneeId: owner.id,
      assigneeType: "human",
      createdAt: new Date("2026-06-07T00:02:00.000Z"),
    });
    const waitingRun = await seedRun({
      serverId: srv.id,
      channelId: visible.id,
      agentId: agent.id,
      status: "waiting_input",
      createdAt: new Date("2026-06-07T00:03:00.000Z"),
    });
    const hiddenRun = await seedRun({
      serverId: srv.id,
      channelId: hidden.id,
      agentId: agent.id,
      status: "failed",
      createdAt: new Date("2026-06-07T00:04:00.000Z"),
    });
    await seedRun({
      serverId: srv.id,
      channelId: visible.id,
      agentId: agent.id,
      status: "running",
      createdAt: new Date("2026-06-07T00:05:00.000Z"),
    });

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json()) as {
      items: Array<{ id: string; kind: string; status?: string; priority: number; href: string; preview: string }>;
      count: number;
    };
    expect(body.items.map((item) => item.id)).toEqual([
      `task:${reviewTask.id}`,
      `run:${waitingRun}`,
      `task:${assignedTask.id}`,
    ]);
    expect(body.items.map((item) => item.priority)).toEqual([0, 1, 4]);
    expect(body.items.find((item) => item.id === `task:${reviewTask.id}`)?.status).toBe("in_review");
    expect(body.items.find((item) => item.id === `run:${waitingRun}`)?.status).toBe("waiting_input");
    expect(body.items.some((item) => item.id === `task:${hiddenTask.id}`)).toBe(false);
    expect(body.items.some((item) => item.id === `run:${hiddenRun}`)).toBe(false);
    expect(body.items.every((item) => item.href.startsWith(`/s/${srv.slug}/`))).toBe(true);
  });

  it("redacts raw agent errors and input previews before they enter the queue", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const channel = await seedChannel(srv, "public", [owner]);
    const agent = await seedAgent(srv, owner);
    const rawSecret = "failed with Bearer abc.def sk-ant-secretvalue token=plain-secret at /Users/dai/project";
    const failedRun = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "failed",
      error: rawSecret,
      createdAt: new Date("2026-06-07T01:00:00.000Z"),
    });
    const waitingRun = await seedRun({
      serverId: srv.id,
      channelId: channel.id,
      agentId: agent.id,
      status: "waiting_input",
      inputPreview: "open /Users/dai/private with ck_abcdefghijklmnopqrstuvwxyz123456 token=plain-secret",
      createdAt: new Date("2026-06-07T01:01:00.000Z"),
    });

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json());
    const failed = body.items.find((item) => item.id === `run:${failedRun}`);
    const waiting = body.items.find((item) => item.id === `run:${waitingRun}`);
    expect(failed?.preview).toContain("[redacted token]");
    expect(failed?.preview).toContain("[local path]");
    expect(waiting?.preview).toContain("[local path]");
    expect(waiting?.preview).toContain("[redacted token]");
    for (const preview of [failed?.preview, waiting?.preview]) {
      expect(preview).not.toContain("sk-ant-");
      expect(preview).not.toContain("Bearer abc");
      expect(preview).not.toContain("ck_abcdefghijklmnopqrstuvwxyz123456");
      expect(preview).not.toContain("/Users/dai");
      expect(preview).not.toContain("plain-secret");
    }
  });

  it("keeps non-joined public and private workflow attention out of the personal queue", async () => {
    const owner = await seedUser({ name: "Owner" });
    const viewer = await seedUser({ name: "Viewer" });
    const outsider = await seedUser({ name: "Outsider" });
    const srv = await seedServer(owner);
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: viewer.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const publicChannel = await seedChannel(srv, "public", []);
    const privateChannel = await seedChannel(srv, "private", []);
    const agent = await seedAgent(srv, owner);
    const publicTask = await seedTask({
      channelId: publicChannel.id,
      senderId: owner.id,
      taskNumber: 10,
      status: "in_review",
      createdAt: new Date("2026-06-07T02:00:00.000Z"),
    });
    const publicRun = await seedRun({
      serverId: srv.id,
      channelId: publicChannel.id,
      agentId: agent.id,
      status: "waiting_input",
      createdAt: new Date("2026-06-07T02:01:00.000Z"),
    });
    const privateTask = await seedTask({
      channelId: privateChannel.id,
      senderId: owner.id,
      taskNumber: 11,
      status: "in_review",
      createdAt: new Date("2026-06-07T02:02:00.000Z"),
    });
    const privateRun = await seedRun({
      serverId: srv.id,
      channelId: privateChannel.id,
      agentId: agent.id,
      status: "failed",
      createdAt: new Date("2026-06-07T02:03:00.000Z"),
    });

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: await userBearer(viewer) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json());
    expect(body.items.some((item) => item.id === `task:${publicTask.id}`)).toBe(false);
    expect(body.items.some((item) => item.id === `run:${publicRun}`)).toBe(false);
    expect(body.items.some((item) => item.id === `task:${privateTask.id}`)).toBe(false);
    expect(body.items.some((item) => item.id === `run:${privateRun}`)).toBe(false);
    expect(body.totalCount).toBe(0);

    const outsiderRes = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: await userBearer(outsider) },
    });
    expect(outsiderRes.status).toBe(403);
  });

  it("excludes archived channel work from the queue", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const active = await seedChannel(srv, "public", [owner]);
    const archived = await seedChannel(srv, "public", [owner]);
    await db().update(schema.channels)
      .set({ archivedAt: new Date("2026-06-07T02:00:00.000Z"), archivedBy: owner.id })
      .where(eq(schema.channels.id, archived.id));
    const agent = await seedAgent(srv, owner);
    const activeTask = await seedTask({
      channelId: active.id,
      senderId: owner.id,
      taskNumber: 20,
      status: "in_review",
      createdAt: new Date("2026-06-07T03:00:00.000Z"),
    });
    const archivedTask = await seedTask({
      channelId: archived.id,
      senderId: owner.id,
      taskNumber: 21,
      status: "in_review",
      createdAt: new Date("2026-06-07T03:01:00.000Z"),
    });
    const archivedRun = await seedRun({
      serverId: srv.id,
      channelId: archived.id,
      agentId: agent.id,
      status: "failed",
      createdAt: new Date("2026-06-07T03:02:00.000Z"),
    });

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json());
    expect(body.items.some((item) => item.id === `task:${activeTask.id}`)).toBe(true);
    expect(body.items.some((item) => item.id === `task:${archivedTask.id}`)).toBe(false);
    expect(body.items.some((item) => item.id === `run:${archivedRun}`)).toBe(false);
    expect(body.count).toBe(body.items.length);
  });

  it("returns only unread DM handoffs from other senders", async () => {
    const owner = await seedUser({ name: "Owner" });
    const peer = await seedUser({ name: "Peer" });
    const srv = await seedServer(owner);
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: peer.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const unread = await seedChannel(srv, "dm", [owner, peer]);
    const read = await seedChannel(srv, "dm", [owner, peer]);
    const ownLatest = await seedChannel(srv, "dm", [owner, peer]);
    const empty = await seedChannel(srv, "dm", [owner, peer]);
    await db().insert(schema.messages).values([
      {
        id: "msg-unread",
        channelId: unread.id,
        senderId: peer.id,
        senderType: "human",
        content: "a".repeat(180),
        seq: 2,
        threadParentId: null,
        createdAt: new Date("2026-06-07T04:00:00.000Z"),
        updatedAt: new Date("2026-06-07T04:00:00.000Z"),
        editedAt: null,
        deletedAt: null,
        vectorIndexedAt: null,
        pinnedAt: null,
        pinnedBy: null,
      },
      {
        id: "msg-read",
        channelId: read.id,
        senderId: peer.id,
        senderType: "human",
        content: "already read",
        seq: 1,
        threadParentId: null,
        createdAt: new Date("2026-06-07T04:01:00.000Z"),
        updatedAt: new Date("2026-06-07T04:01:00.000Z"),
        editedAt: null,
        deletedAt: null,
        vectorIndexedAt: null,
        pinnedAt: null,
        pinnedBy: null,
      },
      {
        id: "msg-own",
        channelId: ownLatest.id,
        senderId: owner.id,
        senderType: "human",
        content: "my latest",
        seq: 1,
        threadParentId: null,
        createdAt: new Date("2026-06-07T04:02:00.000Z"),
        updatedAt: new Date("2026-06-07T04:02:00.000Z"),
        editedAt: null,
        deletedAt: null,
        vectorIndexedAt: null,
        pinnedAt: null,
        pinnedBy: null,
      },
    ]);
    await db().update(schema.channelMembers)
      .set({ lastReadSeq: 1 })
      .where(eq(schema.channelMembers.channelId, read.id));

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json());
    const item = body.items.find((entry) => entry.id === "dm:msg-unread");
    expect(item).toMatchObject({
      kind: "dm",
      priority: 5,
      href: `/s/${srv.slug}/dm/${unread.id}`,
    });
    expect(item?.preview.length).toBe(140);
    expect(body.items.some((entry) => entry.channelId === read.id)).toBe(false);
    expect(body.items.some((entry) => entry.channelId === ownLatest.id)).toBe(false);
    expect(body.items.some((entry) => entry.channelId === empty.id)).toBe(false);
  });

  it("returns contract-compliant empty queue for machine subjects", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const key = await bridgeKey(owner, srv);
    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}`, {
      headers: { authorization: `Bearer ${key}` },
    });
    expect(res.status).toBe(200);
    expect(inboxResponse.parse(await res.json())).toEqual({ items: [], count: 0, totalCount: 0 });
  });

  it("rejects missing and unsafe query parameters at the route boundary", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const auth = await userBearer(owner);
    for (const query of ["", `serverId=${srv.id}&limit=0`, `serverId=${srv.id}&limit=51`, `serverId=${srv.id}&limit=NaN`]) {
      const suffix = query ? `?${query}` : "";
      const res = await request(app as never, `https://test.local/api/v1/inbox${suffix}`, {
        headers: { authorization: auth },
      });
      expect(res.status, query || "missing serverId").toBe(400);
      const body = await res.json() as { error: { code: string } };
      expect(body.error.code).toBe("BAD_REQ");
    }
  });

  it("applies limit after visibility filtering and reports total visible queue size", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visible = await seedChannel(srv, "public", [owner]);
    const hidden = await seedChannel(srv, "private", []);
    const created: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      const task = await seedTask({
        channelId: visible.id,
        senderId: owner.id,
        taskNumber: 30 + i,
        status: "in_review",
        createdAt: new Date(Date.UTC(2026, 5, 7, 5, i, 0)),
      });
      created.push(`task:${task.id}`);
    }
    await seedTask({
      channelId: hidden.id,
      senderId: owner.id,
      taskNumber: 99,
      status: "in_review",
      createdAt: new Date("2026-06-07T06:00:00.000Z"),
    });

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}&limit=3`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json());
    expect(body.items).toHaveLength(3);
    expect(body.count).toBe(3);
    expect(body.totalCount).toBe(6);
    expect(body.items.map((item) => item.id)).toEqual(created.slice().reverse().slice(0, 3));
  });

  it("keeps count and totalCount accurate when one queue source exceeds thirty rows", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const visible = await seedChannel(srv, "public", [owner]);
    const created: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      const task = await seedTask({
        channelId: visible.id,
        senderId: owner.id,
        taskNumber: 100 + i,
        status: "in_review",
        createdAt: new Date(Date.UTC(2026, 5, 7, 7, i, 0)),
      });
      created.push(`task:${task.id}`);
    }

    const res = await request(app as never, `https://test.local/api/v1/inbox?serverId=${srv.id}&limit=50`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = inboxResponse.parse(await res.json());
    expect(body.count).toBe(40);
    expect(body.totalCount).toBe(40);
    expect(body.items).toHaveLength(40);
    expect(body.items.map((item) => item.id)).toEqual(created.slice().reverse());
  });
});
