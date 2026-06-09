import { expect, test } from "@playwright/test";
import { login, missingAuthSkipReason } from "./helpers/auth";

const RUN = process.env.E2E_RUN_WORKSPACE === "1";
const AUTH_SKIP = missingAuthSkipReason();
const API_URL = process.env.E2E_API_URL ?? "";

async function openFirstConversation(page: import("@playwright/test").Page) {
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  const firstConversation = nav.getByRole("link", { name: /^onboarding\b/i }).first();
  await expect(firstConversation).toBeVisible({ timeout: 15000 });
  await firstConversation.click();
  await expect(page).toHaveURL(/\/s\/[^/]+\/(?:channel|dm)\/[0-9a-f-]+$/, { timeout: 15000 });
  await waitForWorkspaceMainReady(page);
}

async function waitForWorkspaceMainReady(page: import("@playwright/test").Page) {
  const main = page.getByTestId("workspace-main");
  await expect(main).toBeVisible({ timeout: 20000 });
  await expect(main).not.toHaveText(/^Loading…$/, { timeout: 20000 });
}

async function waitForWorkQueueTerminalState(page: import("@playwright/test").Page) {
  await expect.poll(async () => {
    const hasFilterToolbar = await page.getByRole("toolbar", { name: "Work queue filters" }).isVisible().catch(() => false);
    const body = await page.locator("body").innerText();
    if (body.includes("Couldn't load inbox")) return "error";
    if (hasFilterToolbar) return "filters";
    if (body.includes("You're caught up.")) return "empty";
    return "loading";
  }, {
    message: "Work queue should finish loading with filters or an empty state",
    timeout: 20000,
  }).toMatch(/^(filters|empty)$/);
}

test.describe(RUN ? "workspace shell read-only" : "workspace shell read-only (skipped — set E2E_RUN_WORKSPACE=1)", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(!RUN, "read-only authenticated workspace gate is opt-in");
  test.skip(RUN && Boolean(AUTH_SKIP), AUTH_SKIP ?? "");

  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15000 });
    await waitForWorkspaceMainReady(page);
  });

  test("renders shell navigation with link semantics and stable browser state", async ({ page, context }) => {
    const shell = page.getByTestId("workspace-shell");
    const sidebar = page.getByTestId("workspace-sidebar");
    const main = page.getByTestId("workspace-main");
    const nav = page.getByRole("navigation", { name: "Workspace navigation" });

    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute("data-visual-pass", "heroui-pro-v2");
    await expect(sidebar).toHaveAttribute("data-state", "expanded");
    await expect(nav).toBeVisible();
    await expect(main).toBeVisible();

    const workspaceMatch = new URL(page.url()).pathname.match(/^\/s\/([^/]+)/);
    expect(workspaceMatch, "login should land on a workspace route").toBeTruthy();
    const slug = workspaceMatch?.[1];

    const destinations = [
      { label: "Start", href: `/s/${slug}` },
      { label: "Work queue", href: `/s/${slug}/inbox` },
      { label: "Workflows", href: `/s/${slug}/channels` },
      { label: "Tasks", href: `/s/${slug}/tasks` },
      { label: "Agent Work", href: `/s/${slug}/agents` },
    ];
    for (const item of destinations) {
      const link = nav.getByRole("link", { name: item.label, exact: true });
      await expect(link, `${item.label} should remain a real link`).toBeVisible();
      await expect(link).toHaveAttribute("href", item.href);
    }

    await nav.getByRole("link", { name: "Work queue", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/s/${slug}/inbox$`), { timeout: 15000 });
    await waitForWorkspaceMainReady(page);
    await expect(page.getByRole("navigation", { name: "Workspace navigation" })).toBeVisible();

    await page.keyboard.press(process.platform === "darwin" ? "Meta+B" : "Control+B");
    await expect(page.getByTestId("workspace-sidebar")).toHaveAttribute("data-state", "expanded");

    await page.getByTestId("user-pill-trigger").click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Account" })).toBeVisible();
    await page.keyboard.press("Escape");

    const cookies = await context.cookies();
    expect(cookies.filter((cookie) => /^(sidebar_state|aside_state)$/.test(cookie.name))).toEqual([]);
  });

  test("guides a user through the simple Start to queue to workflows path", async ({ page }) => {
    const workspaceMatch = new URL(page.url()).pathname.match(/^\/s\/([^/]+)/);
    expect(workspaceMatch, "login should land on a workspace route").toBeTruthy();
    const slug = workspaceMatch?.[1];
    const nav = page.getByRole("navigation", { name: "Workspace navigation" });

    await nav.getByRole("link", { name: "Start", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/s/${slug}$`), { timeout: 15000 });
    await waitForWorkspaceMainReady(page);
    await expect(page.getByRole("heading", { name: "Pick one workflow and make the agent work visible." })).toBeVisible();
    await expect(page.getByText("Start on cloud; bring local runtimes later")).toBeVisible();
    for (const step of ["1. Pick", "2. Send", "3. Prove"]) {
      await expect(page.getByText(step, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "Start with one workflow your team can finish today." })).toBeVisible();
    await expect(page.getByRole("group", { name: "Workflow outcome picker" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Make a decision/ })).toBeVisible();
    await expect(page.getByRole("article", { name: /workflow starter/i }).first().getByRole("button", {
      name: /Start workflow|Join workflow|Open workflow|Connect runtime/i,
    })).toBeVisible();

    await nav.getByRole("link", { name: "Work queue", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/s/${slug}/inbox$`), { timeout: 15000 });
    await waitForWorkspaceMainReady(page);
    await expect(page.getByRole("heading", { name: "Work queue", exact: true })).toBeVisible();
    await expect(page.getByText("Team-visible review gates")).toBeVisible();
    await waitForWorkQueueTerminalState(page);

    await nav.getByRole("link", { name: "Workflows", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/s/${slug}/channels$`), { timeout: 15000 });
    await waitForWorkspaceMainReady(page);
    await expect(page.getByRole("heading", { name: "Workflows", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "My workflows", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Discover public workflows", exact: true })).toBeVisible();
    await expect(page.getByText("Workflow rooms you can open, brief, run, and approve.")).toBeVisible();
  });

  test("hands the signed-in web session to the production API without exposing the token", async ({ page }) => {
    test.skip(!API_URL, "E2E_API_URL required for the API handoff check");

    const webOrigin = new URL(page.url()).origin;
    const tokenResponse = await page.request.get(`${webOrigin}/api/me/api-token`);
    expect(tokenResponse.status(), "/api/me/api-token should return a browser-scoped token").toBe(200);
    const tokenJson = await tokenResponse.json();
    expect(typeof tokenJson.token).toBe("string");
    expect(tokenJson.token.length).toBeGreaterThan(12);

    const meResponse = await page.request.get(new URL("/api/v1/me", API_URL).toString(), {
      headers: { authorization: `Bearer sy_api_${tokenJson.token}` },
    });
    expect(meResponse.status(), "API should accept the web-scoped bearer token").toBe(200);
    const meJson = await meResponse.json();
    expect(Array.isArray(meJson.servers)).toBe(true);
  });

  test("keeps page scrolling locked to the workspace shell", async ({ page }) => {
    const shellScroll = await page.evaluate(() => ({
      bodyScrollable: document.body.scrollHeight > document.body.clientHeight,
      documentScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      shellOverflow: getComputedStyle(document.querySelector("[data-testid='workspace-shell']")!).overflow,
      mainOverflow: getComputedStyle(document.querySelector("[data-testid='workspace-main']")!).overflow,
    }));

    expect(shellScroll).toEqual({
      bodyScrollable: false,
      documentScrollable: false,
      shellOverflow: "hidden",
      mainOverflow: "hidden",
    });
  });

  test("keeps the message composer as a card composer surface", async ({ page }) => {
    await openFirstConversation(page);

    const composer = page.getByTestId("message-composer");
    await expect(composer).toBeVisible({ timeout: 20000 });

    const composerMetrics = await page.evaluate(() => {
      const composer = document.querySelector("[data-testid='message-composer']")?.getBoundingClientRect();
      const attach = document.querySelector("[aria-label='Attach file or image']")?.getBoundingClientRect();
      const input = document.querySelector("[data-testid='message-composer-input']")?.getBoundingClientRect();
      const send = document.querySelector("[aria-label='Send message']")?.getBoundingClientRect();
      const editor = document.querySelector("[data-testid='message-composer-input'] [role='textbox']");
      const editorStyle = editor ? getComputedStyle(editor) : null;
      if (!composer || !attach || !input || !send) return null;
      return {
        attachInsideComposer:
          attach.top >= composer.top &&
          attach.left >= composer.left &&
          attach.bottom <= composer.bottom &&
          attach.right <= composer.right,
        inputInsideComposer:
          input.top >= composer.top &&
          input.left >= composer.left &&
          input.bottom <= composer.bottom &&
          input.right <= composer.right,
        sendInsideComposer:
          send.top >= composer.top &&
          send.left >= composer.left &&
          send.bottom <= composer.bottom &&
          send.right <= composer.right,
        toolbarBelowInput: attach.top >= input.bottom - 1 && send.top >= input.bottom - 1,
        composerVisibleInViewport: composer.top >= 0 && composer.bottom <= window.innerHeight,
        composerHeight: composer.height,
        editorFontSize: editorStyle?.fontSize ?? "",
      };
    });

    expect(composerMetrics).toMatchObject({
      attachInsideComposer: true,
      inputInsideComposer: true,
      sendInsideComposer: true,
      toolbarBelowInput: true,
      composerVisibleInViewport: true,
    });
    expect(composerMetrics?.composerHeight).toBeGreaterThanOrEqual(96);
    expect(parseInt(composerMetrics?.editorFontSize ?? "", 10)).toBeGreaterThanOrEqual(14);
  });

  test("opens workspace navigation from the mobile shell", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    const openNav = page.getByRole("button", { name: "Open workspace navigation" });
    await expect(openNav).toBeVisible();
    await openNav.click();

    const mobileSidebar = page.getByTestId("workspace-sidebar-mobile");
    await expect(mobileSidebar).toBeVisible();
    await expect(mobileSidebar.getByRole("navigation", { name: "Workspace navigation" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(mobileSidebar).toBeHidden();

    const cookies = await context.cookies();
    expect(cookies.filter((cookie) => /^(sidebar_state|aside_state)$/.test(cookie.name))).toEqual([]);
  });
});
