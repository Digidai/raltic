import { describe, expect, it } from "vitest";
import app from "../src/index";
import { db, request, seedAgent, seedChannel, seedServer, seedUser, userBearer } from "./helpers";
import * as schema from "@raltic/db/schema";
import { and, eq, inArray } from "drizzle-orm";

describe("GET /api/v1/servers/by-slug/:slug", () => {
  it("marks public visible channels without explicit membership as not joined", async () => {
    const owner = await seedUser({ name: "Owner" });
    const viewer = await seedUser({ name: "Viewer" });
    const srv = await seedServer(owner);
    await db().insert(schema.serverMembers).values({
      serverId: srv.id,
      memberId: viewer.id,
      memberType: "human",
      role: "member",
      joinedAt: new Date(),
    });
    const joined = await seedChannel(srv, "public", [viewer]);
    const discoverable = await seedChannel(srv, "public", []);
    const hidden = await seedChannel(srv, "private", []);

    const res = await request(app as never, `https://test.local/api/v1/servers/by-slug/${srv.slug}`, {
      headers: { authorization: await userBearer(viewer) },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { channels: Array<{ id: string; isMember: boolean }> };
    const channelById = new Map(body.channels.map((channel) => [channel.id, channel]));

    expect(channelById.get(joined.id)?.isMember).toBe(true);
    expect(channelById.get(discoverable.id)?.isMember).toBe(false);
    expect(channelById.has(hidden.id)).toBe(false);
  });

  it("marks private channels visible through an owned agent as not joined by the human", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const agent = await seedAgent(srv, owner);
    const privateChannel = await seedChannel(srv, "private", []);
    await db().insert(schema.channelMembers).values({
      channelId: privateChannel.id,
      memberId: agent.id,
      memberType: "agent",
      joinedAt: new Date(),
      lastReadSeq: 0,
    });

    const res = await request(app as never, `https://test.local/api/v1/servers/by-slug/${srv.slug}`, {
      headers: { authorization: await userBearer(owner) },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { channels: Array<{ id: string; isMember: boolean }> };
    expect(body.channels.find((channel) => channel.id === privateChannel.id)?.isMember).toBe(false);
  });
});

describe("POST /api/v1/servers/:id/seed", () => {
  it("repairs a legacy bridge-mode onboarding agent during force restore", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const agent = await seedAgent(srv, owner);
    await db().update(schema.agents)
      .set({
        name: "onboarding",
        displayName: "Onboarding Assistant",
        runtimeMode: "bridge",
        runtime: "claude",
        model: "sonnet",
        status: "offline",
      })
      .where(eq(schema.agents.id, agent.id));

    const res = await request(app as never, `https://test.local/api/v1/servers/${srv.id}/seed`, {
      method: "POST",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({ force: true }),
    });

    expect(res.status).toBe(200);
    const rows = await db().select({
      id: schema.agents.id,
      runtimeMode: schema.agents.runtimeMode,
      model: schema.agents.model,
      status: schema.agents.status,
    })
      .from(schema.agents)
      .where(and(eq(schema.agents.serverId, srv.id), eq(schema.agents.name, "onboarding")));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: agent.id,
      runtimeMode: "raltic",
      model: "claude-haiku-4-5",
      status: "online",
    });
  });

  it("does not rewrite a user-configured local onboarding agent during force restore", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const agent = await seedAgent(srv, owner);
    const createdAt = new Date(Date.now() - 60_000);
    const updatedAt = new Date();
    await db().update(schema.agents)
      .set({
        name: "onboarding",
        displayName: "Onboarding Assistant",
        runtimeMode: "bridge",
        runtime: "claude",
        model: "sonnet",
        status: "offline",
        createdAt,
        updatedAt,
      })
      .where(eq(schema.agents.id, agent.id));

    const res = await request(app as never, `https://test.local/api/v1/servers/${srv.id}/seed`, {
      method: "POST",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({ force: true }),
    });

    expect(res.status).toBe(200);
    const [row] = await db().select({
      runtimeMode: schema.agents.runtimeMode,
      model: schema.agents.model,
      status: schema.agents.status,
    })
      .from(schema.agents)
      .where(eq(schema.agents.id, agent.id));
    expect(row).toMatchObject({
      runtimeMode: "bridge",
      model: "sonnet",
      status: "offline",
    });
  });

  it("restores missing onboarding channel memberships without duplicating existing channels", async () => {
    const owner = await seedUser({ name: "Owner" });
    const srv = await seedServer(owner);
    const agent = await seedAgent(srv, owner);
    await db().update(schema.agents)
      .set({
        name: "onboarding",
        displayName: "Onboarding Assistant",
        runtimeMode: "raltic",
        model: "claude-haiku-4-5",
        status: "online",
      })
      .where(eq(schema.agents.id, agent.id));
    const onboardingChannelId = crypto.randomUUID();
    const dmChannelId = crypto.randomUUID();
    const now = new Date();
    await db().batch([
      db().insert(schema.channels).values({
        id: onboardingChannelId,
        serverId: srv.id,
        name: "onboarding",
        description: "Get familiar with Raltic",
        type: "public",
        createdBy: owner.id,
        createdAt: now,
      }),
      db().insert(schema.channels).values({
        id: dmChannelId,
        serverId: srv.id,
        name: "onboarding-assistant",
        description: "Direct messages with the Onboarding Assistant",
        type: "dm",
        createdBy: owner.id,
        createdAt: now,
      }),
      db().insert(schema.channelMembers).values({
        channelId: onboardingChannelId,
        memberId: owner.id,
        memberType: "human",
        joinedAt: now,
      }),
    ]);

    const res = await request(app as never, `https://test.local/api/v1/servers/${srv.id}/seed`, {
      method: "POST",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({ force: true }),
    });

    expect(res.status).toBe(200);
    const channels = await db().select({ id: schema.channels.id, name: schema.channels.name })
      .from(schema.channels)
      .where(and(
        eq(schema.channels.serverId, srv.id),
        inArray(schema.channels.name, ["onboarding", "onboarding-assistant"]),
      ));
    expect(channels).toHaveLength(2);
    const members = await db().select({
      channelId: schema.channelMembers.channelId,
      memberId: schema.channelMembers.memberId,
      memberType: schema.channelMembers.memberType,
    })
      .from(schema.channelMembers)
      .where(inArray(schema.channelMembers.channelId, [onboardingChannelId, dmChannelId]));
    expect(members).toEqual(expect.arrayContaining([
      { channelId: onboardingChannelId, memberId: owner.id, memberType: "human" },
      { channelId: onboardingChannelId, memberId: agent.id, memberType: "agent" },
      { channelId: dmChannelId, memberId: owner.id, memberType: "human" },
      { channelId: dmChannelId, memberId: agent.id, memberType: "agent" },
    ]));
  });
});
