import { describe, expect, it } from "vitest";
import app from "../src/index";
import * as schema from "@raltic/db/schema";
import { bridgeKey, db, request, seedAgent, seedChannel, seedServer, seedUser } from "./helpers";

describe("POST /api/v1/messages auth boundaries", () => {
  it("rejects raw machine keys attempting to send as an agent", async () => {
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
    const key = await bridgeKey(owner, srv);

    const res = await request(app as never, "https://test.local/api/v1/messages", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        channelId: channel.id,
        content: "raw machine key should not speak as agent",
        as: agent.id,
        idempotencyKey: crypto.randomUUID(),
      }),
    });

    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
