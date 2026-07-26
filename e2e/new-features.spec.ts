import { test, expect } from "@playwright/test";

const API_URL = process.env.E2E_API_URL;
if (!API_URL) throw new Error("E2E_API_URL must be set; do not default API smoke tests to production.");

/**
 * Coverage for the audit-fix + collab batch (commit 6609b5e):
 *   - new endpoints: /api/v1/invites/email, /servers/:id/members
 *   - new pages: /not-existing → not-found.tsx, /__force_error
 *   - landing copy + collab framing
 *   - sidebar/login brand cyan applied
 *
 * All assertions hit the deployed staging — no local servers spun up.
 */

test.describe("new endpoints — auth gating + zod validation", () => {
  test("POST /api/v1/invites/email rejects unauthenticated callers (401)", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/invites/email`, {
      data: { serverId: "srv_x", email: "test@example.com" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/v1/invites/email rejects malformed body (still 401 — auth runs first)", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/invites/email`, {
      data: { serverId: "srv_x", email: "not-an-email" },
    });
    // Auth gate fires before zod parse for unauthed requests.
    expect(res.status()).toBe(401);
  });

  test("GET /api/v1/servers/:id/members rejects unauthed (401)", async ({ request }) => {
    const res = await request.get(`${API_URL}/api/v1/servers/srv_x/members`);
    expect(res.status()).toBe(401);
  });

  test("DELETE /api/v1/servers/:id/members/:userId rejects unauthed (401)", async ({ request }) => {
    const res = await request.delete(`${API_URL}/api/v1/servers/srv_x/members/user_y`);
    expect(res.status()).toBe(401);
  });
});

test.describe("error surfaces — auth-gated not-found", () => {
  test("/random-path bounces unauthed visitors to /login (no info leak)", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    // Middleware redirects unauth + unknown paths to /login; the branded
    // not-found.tsx is reserved for authed users hitting bad URLs.
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("landing — workflow-room framing (post-rewrite)", () => {
  test("hero lands the agent-workflow workspace choice", async ({ page }) => {
    await page.goto("/");
    const heroSection = page.locator("section").first();
    await expect(page.getByRole("heading", { name: /Launch your first\s+agent workflow/i })).toBeVisible();
    await expect(heroSection.getByText(/Turn launch readiness or code review into one accountable room/i)).toBeVisible();
    await expect(heroSection.getByText(/brief a cloud or local agent/i)).toBeVisible();
    await expect(heroSection.getByText(/no local install to start/i)).toBeVisible();
  });

  test("TwoWaysToRun explicitly names the two workflow paths", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Run a workflow/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bring your agents/i })).toBeVisible();
  });

  test("RuntimeBadges shows all 4 with experimental on openclaw + hermes", async ({ page }) => {
    await page.goto("/");
    // Scope to the RuntimeBadges section — runtime names also appear
    // in FAQ answers, which trips Playwright's strict-mode.
    const badges = page.locator("section", { hasText: /Verified Claude \+ Codex/i });
    await expect(badges.getByText("Anthropic Claude", { exact: true })).toBeVisible();
    await expect(badges.getByText("OpenAI Codex", { exact: true })).toBeVisible();
    await expect(badges.getByText("OpenClaw", { exact: true })).toBeVisible();
    await expect(badges.getByText("Hermes", { exact: true })).toBeVisible();
    const runtimeStrip = badges.locator("div.mt-5").first();
    const experimentalCards = runtimeStrip.locator("div.text-center").filter({ hasText: "Experimental" });
    await expect(experimentalCards).toHaveCount(2);
  });
});

test.describe("public pages still work after migration", () => {
  test("/login renders without regression", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Your password")).toBeVisible();
  });

  test("/signup renders all 3 fields", async ({ page }) => {
    await page.goto("/signup");
    // Name placeholder evolved to "Your name (shown to teammates)" —
    // match by prefix. Password placeholder uses MIN_PASSWORD_LENGTH
    // which bumped from 6 → 8 — match by pattern.
    await expect(page.getByPlaceholder(/Your name/)).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder(/At least \d+ characters/)).toBeVisible();
  });
});

test.describe("api health + bridge connect surface (post-serverId-fix)", () => {
  test("/health stays green", async ({ request }) => {
    const res = await request.get(`${API_URL}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test("bridge/connect with bad api key returns 401 (not 500)", async ({ request }) => {
    // ck_ prefix + 32+ alphanumeric chars (matches bridgeConnectRequest schema
    // pattern), but no row in DB → resolveMachineKey null → 401.
    const fakeKey = "ck_" + "a".repeat(40);
    const res = await request.post(`${API_URL}/api/v1/bridge/connect`, {
      data: { apiKey: fakeKey },
    });
    expect(res.status()).toBe(401);
  });

  test("bridge/connect with malformed body returns 400 (zod rejected)", async ({ request }) => {
    const res = await request.post(`${API_URL}/api/v1/bridge/connect`, {
      data: { not_an_apikey: "x" },
    });
    expect(res.status()).toBe(400);
  });
});
