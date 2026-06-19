import { describe, expect, it } from "vitest";
import { bridgeKeysFromConfig, replacePrimaryBridgeKey } from "../src/main/config";

describe("desktop bridge config normalization", () => {
  it("drops a primary key with a malformed non-empty server URL instead of falling back to production", () => {
    expect(bridgeKeysFromConfig({
      apiKey: " ck_valid_12345678 ",
      serverUrl: "not a url",
      serverId: "srv_1",
    })).toEqual([]);
  });

  it("keeps existing primary metadata when Settings saves the same key without serverId", () => {
    const cfg = {
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com",
      serverId: "srv_existing",
      keys: [{
        apiKey: "ck_existing_12345678",
        serverUrl: "https://api.raltic.com",
        serverId: "srv_existing",
        addedAt: 123,
      }],
    };

    expect(replacePrimaryBridgeKey(cfg, {
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com",
    })).toEqual(cfg);
  });

  it("keeps existing primary metadata when IPC normalizes serverId to undefined", () => {
    const cfg = {
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com",
      serverId: "srv_existing",
      keys: [{
        apiKey: "ck_existing_12345678",
        serverUrl: "https://api.raltic.com",
        serverId: "srv_existing",
        addedAt: 123,
      }],
    };

    expect(replacePrimaryBridgeKey(cfg, {
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com",
      serverId: undefined,
    })).toEqual(cfg);
  });

  it("does not keep the previous workspace id when Settings saves a different key", () => {
    const cfg = {
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com",
      serverId: "srv_existing",
      keys: [{
        apiKey: "ck_existing_12345678",
        serverUrl: "https://api.raltic.com",
        serverId: "srv_existing",
        addedAt: 123,
      }],
    };

    expect(replacePrimaryBridgeKey(cfg, {
      apiKey: "ck_replacement_12345678",
      serverUrl: "https://api.raltic.com",
    }).keys?.[0]).toMatchObject({
      apiKey: "ck_replacement_12345678",
      serverUrl: "https://api.raltic.com",
    });
    expect(replacePrimaryBridgeKey(cfg, {
      apiKey: "ck_replacement_12345678",
      serverUrl: "https://api.raltic.com",
    }).keys?.[0]).not.toHaveProperty("serverId");
  });

  it("clears the saved server URL when Settings submits an empty URL", () => {
    const cfg = {
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com/custom",
      serverId: "srv_existing",
      keys: [{
        apiKey: "ck_existing_12345678",
        serverUrl: "https://api.raltic.com/custom",
        serverId: "srv_existing",
        addedAt: 123,
      }],
    };

    const next = replacePrimaryBridgeKey(cfg, {
      apiKey: "ck_existing_12345678",
      serverUrl: "",
    });
    expect(next.keys?.[0]).toMatchObject({
      apiKey: "ck_existing_12345678",
      serverId: "srv_existing",
      addedAt: 123,
    });
    expect(next.keys?.[0]).not.toHaveProperty("serverUrl");
    expect(next.serverUrl).toBeUndefined();
  });

  it("normalizes valid server URLs before bridge startup", () => {
    expect(bridgeKeysFromConfig({
      apiKey: "ck_existing_12345678",
      serverUrl: "https://API.RALTIC.COM/v1/?q=1#ignored",
      serverId: " srv_existing ",
    })).toEqual([{
      apiKey: "ck_existing_12345678",
      serverUrl: "https://api.raltic.com/v1",
      serverId: "srv_existing",
    }]);
  });
});
