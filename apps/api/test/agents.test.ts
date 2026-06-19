import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import * as schema from "@raltic/db/schema";
import { signWsToken } from "@raltic/auth-core";
import { env } from "cloudflare:test";
import app from "../src/index";
import { bridgeKey, db, request, seedAgent, seedServer, seedUser, userBearer } from "./helpers";

async function connectBridge(apiKey: string): Promise<{ token: string; agents: Array<{ id: string }> }> {
  const res = await request(app as never, "https://test.local/api/v1/bridge/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apiKey }),
  });
  expect(res.status).toBe(200);
  return await res.json() as { token: string; agents: Array<{ id: string }> };
}

describe("GET /api/v1/agents", () => {
  it("scopes bridge tokens to their bound server and bridge-mode agents", async () => {
    const owner = await seedUser({ name: "Owner" });
    const serverA = await seedServer(owner);
    const serverB = await seedServer(owner);
    const bridgeAgent = await seedAgent(serverA, owner);
    const cloudAgent = await seedAgent(serverA, owner);
    const otherServerAgent = await seedAgent(serverB, owner);

    await db()
      .update(schema.agents)
      .set({ runtimeMode: "raltic", model: "claude-haiku-4-5" })
      .where(eq(schema.agents.id, cloudAgent.id));

    const key = await bridgeKey(owner, serverA);
    const connected = await connectBridge(key);
    expect(connected.agents.map((a) => a.id)).toEqual([bridgeAgent.id]);

    const res = await request(app as never, "https://test.local/api/v1/agents", {
      headers: { authorization: `Bearer sy_bridge_${connected.token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { agents: Array<{ id: string }> };
    expect(body.agents.map((a) => a.id)).toEqual([bridgeAgent.id]);
    expect(body.agents.map((a) => a.id)).not.toContain(cloudAgent.id);
    expect(body.agents.map((a) => a.id)).not.toContain(otherServerAgent.id);
  });
});

describe("bearer token audience separation", () => {
  it("rejects a bridge JWT presented with the sy_api_ prefix", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);
    const agent = await seedAgent(server, owner);
    const bridgeToken = await signWsToken(env.CHAT_ROOM_AUTH_SECRET, {
      sub: owner.id,
      aud: "bridge",
      bridgeId: "mk_test",
      serverId: server.id,
      agents: [agent.id],
      ttlSeconds: 60,
    });

    const res = await request(app as never, "https://test.local/api/v1/me/default-server", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer sy_api_${bridgeToken}`,
      },
      body: JSON.stringify({ serverId: server.id }),
    });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/v1/agents/:id runtime mode", () => {
  it("allows an owner to move an onboarding-style cloud agent onto the local bridge", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);
    const agent = await seedAgent(server, owner);

    await db()
      .update(schema.agents)
      .set({ runtimeMode: "raltic", runtime: "claude", model: "claude-haiku-4-5" })
      .where(eq(schema.agents.id, agent.id));

    const res = await request(app as never, `https://test.local/api/v1/agents/${agent.id}`, {
      method: "PATCH",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        runtimeMode: "bridge",
        runtime: "codex",
        model: "gpt-5.5",
      }),
    });

    expect(res.status).toBe(200);
    const [row] = await db()
      .select({
        runtimeMode: schema.agents.runtimeMode,
        runtime: schema.agents.runtime,
        model: schema.agents.model,
      })
      .from(schema.agents)
      .where(eq(schema.agents.id, agent.id));
    expect(row).toEqual({
      runtimeMode: "bridge",
      runtime: "codex",
      model: "gpt-5.5",
    });
  });

  it("rejects a bridge runtime patch that carries a cloud-only model", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);
    const agent = await seedAgent(server, owner);

    await db()
      .update(schema.agents)
      .set({ runtimeMode: "raltic", runtime: "claude", model: "claude-haiku-4-5" })
      .where(eq(schema.agents.id, agent.id));

    const res = await request(app as never, `https://test.local/api/v1/agents/${agent.id}`, {
      method: "PATCH",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        runtimeMode: "bridge",
        runtime: "claude",
        model: "claude-sonnet-4-6",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("INVALID_RUNTIME_MODEL");
    expect(body.error.message).toContain("runtime \"claude\"");
  });

  it("allows runtimeMode-only patches when the current runtime and model are compatible", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);
    const agent = await seedAgent(server, owner);

    await db()
      .update(schema.agents)
      .set({ runtimeMode: "raltic", runtime: "codex", model: "gpt-5.5" })
      .where(eq(schema.agents.id, agent.id));

    const res = await request(app as never, `https://test.local/api/v1/agents/${agent.id}`, {
      method: "PATCH",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({ runtimeMode: "bridge" }),
    });

    expect(res.status).toBe(200);
    const [row] = await db()
      .select({
        runtimeMode: schema.agents.runtimeMode,
        runtime: schema.agents.runtime,
        model: schema.agents.model,
      })
      .from(schema.agents)
      .where(eq(schema.agents.id, agent.id));
    expect(row).toEqual({
      runtimeMode: "bridge",
      runtime: "codex",
      model: "gpt-5.5",
    });
  });

  it("rejects runtimeMode-only patches when the current model is incompatible with the target boundary", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);
    const agent = await seedAgent(server, owner);

    await db()
      .update(schema.agents)
      .set({ runtimeMode: "raltic", runtime: "claude", model: "claude-haiku-4-5" })
      .where(eq(schema.agents.id, agent.id));

    const res = await request(app as never, `https://test.local/api/v1/agents/${agent.id}`, {
      method: "PATCH",
      headers: {
        authorization: await userBearer(owner),
        "content-type": "application/json",
      },
      body: JSON.stringify({ runtimeMode: "bridge" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe("INVALID_RUNTIME_MODEL");
    expect(body.error.message).toContain("runtime \"claude\"");
  });

  it("rejects OpenClaw and Hermes bridge runtime patches until smoke verification passes", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);
    const agent = await seedAgent(server, owner);

    await db()
      .update(schema.agents)
      .set({ runtimeMode: "bridge", runtime: "claude", model: "sonnet" })
      .where(eq(schema.agents.id, agent.id));

    for (const runtime of ["openclaw", "hermes"] as const) {
      const res = await request(app as never, `https://test.local/api/v1/agents/${agent.id}`, {
        method: "PATCH",
        headers: {
          authorization: await userBearer(owner),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          runtimeMode: "bridge",
          runtime,
          model: "auto",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json() as { error: { code: string; message: string } };
      expect(body.error.code).toBe("EXPERIMENTAL_RUNTIME_LOCKED");
      expect(body.error.message).toContain("smoke-test runbook");
    }
  });
});

describe("POST /api/v1/agents runtime validation", () => {
  it("rejects OpenClaw and Hermes bridge agents until smoke verification passes", async () => {
    const owner = await seedUser({ name: "Owner" });
    const server = await seedServer(owner);

    for (const runtime of ["openclaw", "hermes"] as const) {
      const res = await request(app as never, "https://test.local/api/v1/agents", {
        method: "POST",
        headers: {
          authorization: await userBearer(owner),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          serverId: server.id,
          name: `${runtime}-agent`,
          displayName: `${runtime} agent`,
          runtimeMode: "bridge",
          runtime,
          model: "auto",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json() as { error: { code: string; message: string } };
      expect(body.error.code).toBe("EXPERIMENTAL_RUNTIME_LOCKED");
    }
  });
});
