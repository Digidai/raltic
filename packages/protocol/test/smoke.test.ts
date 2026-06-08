import { describe, it, expect } from "vitest";
import {
  PROTOCOL_VERSION,
  clientMessage,
  createAgentRequest,
  sendMessageRequest,
  serverMessage,
  detectedRuntimeSnapshot,
  inboxResponse,
  listInboxQuery,
  encode,
} from "../src/index.js";

describe("@raltic/protocol smoke", () => {
  it("publishes PROTOCOL_VERSION = 1", () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it("encode() returns a JSON string", () => {
    const msg = encode({
      v: 1,
      t: "hello",
      id: "abc",
    });
    expect(typeof msg).toBe("string");
    expect(JSON.parse(msg)).toMatchObject({ t: "hello", id: "abc" });
  });

  it("clientMessage round-trips a valid hello", () => {
    const parsed = clientMessage.parse({
      v: 1,
      t: "hello",
      id: "id-1",
      agentIds: ["agent-1"],
    });
    expect(parsed.t).toBe("hello");
  });

  it("sendMessageRequest validates a known-good sample", () => {
    const parsed = sendMessageRequest.parse({
      channelId: "ch-1",
      content: "hi there",
      idempotencyKey: "k1",
    });
    expect(parsed.channelId).toBe("ch-1");
    expect(parsed.content).toBe("hi there");
  });

  it("createAgentRequest accepts cloud model namespace for raltic mode", () => {
    const parsed = createAgentRequest.parse({
      serverId: "srv-1",
      name: "researcher",
      displayName: "Researcher",
      runtimeMode: "raltic",
      runtime: "claude",
      model: "claude-haiku-4-5",
    });
    expect(parsed.model).toBe("claude-haiku-4-5");
  });

  it("createAgentRequest rejects model namespaces that do not match runtime mode", () => {
    const bridgeResult = createAgentRequest.safeParse({
      serverId: "srv-1",
      name: "bridge-agent",
      displayName: "Bridge Agent",
      runtimeMode: "bridge",
      runtime: "claude",
      model: "claude-haiku-4-5",
    });
    expect(bridgeResult.success).toBe(false);
    if (!bridgeResult.success) {
      expect(bridgeResult.error.issues[0]?.message).toContain('runtime "claude"');
    }

    const cloudResult = createAgentRequest.safeParse({
      serverId: "srv-1",
      name: "cloud-agent",
      displayName: "Cloud Agent",
      runtimeMode: "raltic",
      runtime: "codex",
      model: "gpt-5.3-codex-spark",
    });
    expect(cloudResult.success).toBe(false);
    if (!cloudResult.success) {
      expect(cloudResult.error.issues[0]?.message).toContain("cloud agents");
    }
  });

  it("serverMessage accepts cloud-agent text deltas", () => {
    const parsed = serverMessage.parse({
      v: 1,
      t: "agent_text_delta",
      agentId: "agent-1",
      text: "Streaming",
    });
    expect(parsed.t).toBe("agent_text_delta");
  });

  it("detectedRuntimeSnapshot rejects an unknown runtime id", () => {
    expect(() =>
      detectedRuntimeSnapshot.parse({
        id: "bogus",
        detected: true,
        version: null,
        authed: null,
        authMethod: null,
        error: null,
      })
    ).toThrow();
  });

  it("listInboxQuery coerces limit and rejects unsafe bounds", () => {
    expect(listInboxQuery.parse({ serverId: "srv-1", limit: "10" }).limit).toBe(10);
    expect(listInboxQuery.parse({ serverId: "srv-1" }).limit).toBe(50);
    expect(() => listInboxQuery.parse({ serverId: "srv-1", limit: "0" })).toThrow();
    expect(() => listInboxQuery.parse({ serverId: "srv-1", limit: "51" })).toThrow();
    expect(() => listInboxQuery.parse({ serverId: "srv-1", limit: "NaN" })).toThrow();
  });

  it("inboxResponse validates the Work Queue contract", () => {
    const parsed = inboxResponse.parse({
      items: [{
        id: "run:1",
        kind: "agent_run",
        priority: 1,
        createdAt: Date.now(),
        channelId: "ch-1",
        channelName: "launch-readiness",
        channelType: "public",
        preview: "Agent is waiting for input",
        href: "/s/demo/agents/a1?tab=runs&runId=1",
        status: "waiting_input",
        agentId: "a1",
        runtimeMode: "raltic",
      }],
      count: 1,
      totalCount: 1,
    });
    expect(parsed.items[0].kind).toBe("agent_run");
    expect(parsed.items[0].status).toBe("waiting_input");
    expect(() => inboxResponse.parse({
      items: [{ id: "bad", kind: "note", priority: 0, createdAt: 1, channelId: "c", channelName: "c", channelType: "public", preview: "x", href: "/" }],
      count: 1,
    })).toThrow();
  });
});
