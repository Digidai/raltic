import { expect, test, type Page, type Route } from "@playwright/test";

const INVITE_ID = "inv-demo";
const PREVIEW = {
  server: {
    id: "srv-demo",
    name: "Gene's Workspace",
    slug: "gene-demo",
    description: "Shared AI workspace",
  },
  role: "member",
};

function json(body: unknown, init?: { status?: number }) {
  return {
    status: init?.status ?? 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

async function routeInvitePreview(page: Page) {
  await page.route(`**/api/v1/invites/${INVITE_ID}/preview`, (route) => route.fulfill(json(PREVIEW)));
}

async function routeAuthenticatedSession(page: Page) {
  await page.route("**/api/auth/**", (route) => route.fulfill(json({
    user: { id: "u1", name: "Gene", email: "dai@live.cn" },
    session: { id: "s1", userId: "u1", expiresAt: new Date(Date.now() + 86_400_000).toISOString() },
  })));
}

async function routePendingSession(page: Page) {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/auth/**", async (route) => {
    await pending;
    await route.fulfill(json({
      user: { id: "u1", name: "Gene", email: "dai@live.cn" },
      session: { id: "s1", userId: "u1", expiresAt: new Date(Date.now() + 86_400_000).toISOString() },
    }));
  });
  return release;
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.bodyScrollWidth, `${label} body overflow`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.documentScrollWidth, `${label} document overflow`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

test.describe("invite acceptance surface", () => {
  test("waits for session resolution before showing signed-out actions", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await routeInvitePreview(page);
    const releaseSession = await routePendingSession(page);

    await page.goto(`/invite/${INVITE_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Checking your account")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Create account" })).toBeHidden();
    await expectNoHorizontalOverflow(page, "invite session pending");

    releaseSession();
    await expect(page.getByRole("heading", { name: "Join Gene's Workspace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept invite" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "invite authenticated");
  });

  test("accept failure uses a HeroUI alert and keeps retry available", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await routeInvitePreview(page);
    await routeAuthenticatedSession(page);
    let acceptCalls = 0;
    await page.route(`**/api/v1/invites/${INVITE_ID}/accept`, async (route: Route) => {
      acceptCalls += 1;
      await route.fulfill(json({ error: { message: "This invite has expired." } }, { status: 410 }));
    });

    await page.goto(`/invite/${INVITE_ID}`, { waitUntil: "domcontentloaded" });
    const accept = page.getByRole("button", { name: "Accept invite" });
    await expect(accept).toBeVisible();
    await accept.click();

    await expect(page.getByRole("alert").filter({ hasText: "This invite has expired." })).toBeVisible();
    await expect(accept).toBeEnabled();
    expect(acceptCalls).toBe(1);
    await expectNoHorizontalOverflow(page, "invite accept error");
  });
});
