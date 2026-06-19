import { describe, expect, it } from "vitest";

import app from "../src/index";
import { request } from "./helpers";

describe("POST /api/v1/bridge/connect", () => {
  it("rejects a well-formed but unknown machine key with 401", async () => {
    const res = await request(app as never, "https://test.local/api/v1/bridge/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey: `ck_${"a".repeat(40)}` }),
    });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      error: {
        code: "BAD_KEY",
      },
    });
  });
});
