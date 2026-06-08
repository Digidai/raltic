import { describe, expect, it } from "vitest";
import app from "../src/index";
import { db, request, seedAgent, seedChannel, seedServer, seedUser, userBearer } from "./helpers";
import * as schema from "@raltic/db/schema";

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
