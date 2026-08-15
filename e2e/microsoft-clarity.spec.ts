import { expect, test } from "@playwright/test";
import {
  CLARITY_CONSENT_COOKIE,
  CLARITY_FIRST_PARTY_COOKIES,
  CLARITY_PROJECT_ID,
} from "../apps/web/src/lib/clarity";
import { isPreDeployProductionTarget } from "./helpers/env";

const BASE_URL = process.env.E2E_BASE_URL;
const CLARITY_TAG_URL = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;

test.describe("Microsoft Clarity privacy boundary", () => {
  test.beforeEach(() => {
    test.skip(
      isPreDeployProductionTarget(),
      "The Clarity integration requires the current bundle, not the pre-deploy production bundle.",
    );
  });

  test("does not request Clarity before opt-in and queues Consent V2 after opt-in", async ({ page }) => {
    let tagRequests = 0;
    await page.route(CLARITY_TAG_URL, async (route) => {
      tagRequests += 1;
      await route.fulfill({
        contentType: "application/javascript",
        body: "window.__ralticClarityTagLoaded = true;",
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    const preferences = page.locator("[data-analytics-preferences]");
    await expect(preferences).toBeVisible();
    await page.waitForTimeout(250);
    expect(tagRequests).toBe(0);
    expect((await page.context().cookies()).some((cookie) => cookie.name.startsWith("_cl"))).toBe(false);

    await preferences.getByRole("button", { name: "Allow analytics" }).click();

    await expect.poll(() => tagRequests).toBe(1);
    await expect.poll(() => page.evaluate(() => Boolean((window as Window & { __ralticClarityTagLoaded?: boolean }).__ralticClarityTagLoaded))).toBe(true);
    await expect(preferences).toBeHidden();

    const queuedConsent = await page.evaluate(() => {
      const clarity = (window as Window & { clarity?: { q?: IArguments[] } }).clarity;
      return (clarity?.q ?? [])
        .map((args) => Array.from(args))
        .find(([command]) => command === "consentv2");
    });
    expect(queuedConsent?.[1]).toMatchObject({
      ad_Storage: "denied",
      analytics_Storage: "granted",
    });

    const preferenceCookie = (await page.context().cookies()).find(
      (cookie) => cookie.name === CLARITY_CONSENT_COOKIE,
    );
    expect(preferenceCookie?.value).toBe("granted");
    expect(preferenceCookie?.sameSite).toBe("Lax");
  });

  test("declining keeps the tag unloaded and analytics settings can be reopened", async ({ page }) => {
    let tagRequests = 0;
    await page.route(CLARITY_TAG_URL, async (route) => {
      tagRequests += 1;
      await route.abort();
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const preferences = page.locator("[data-analytics-preferences]");
    await preferences.getByRole("button", { name: "Decline analytics" }).click();

    await expect(preferences).toBeHidden();
    expect(tagRequests).toBe(0);
    const preferenceCookie = (await page.context().cookies()).find(
      (cookie) => cookie.name === CLARITY_CONSENT_COOKIE,
    );
    expect(preferenceCookie?.value).toBe("denied");

    await page.getByRole("button", { name: "Analytics settings" }).click();
    await expect(preferences).toBeVisible();
    expect(tagRequests).toBe(0);
  });

  test("withdrawing a prior opt-in removes Clarity cookies and starts a tracker-free document", async ({ page }) => {
    let tagRequests = 0;
    await page.route(CLARITY_TAG_URL, async (route) => {
      tagRequests += 1;
      await route.fulfill({
        contentType: "application/javascript",
        body: "window.__ralticClarityTagLoaded = true;",
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const preferences = page.locator("[data-analytics-preferences]");
    await preferences.getByRole("button", { name: "Allow analytics" }).click();
    await expect.poll(() => tagRequests).toBe(1);

    await page.context().addCookies(CLARITY_FIRST_PARTY_COOKIES.map((name) => ({
      name,
      value: "test-clarity-id",
      url: page.url(),
      sameSite: "Lax" as const,
    })));
    await page.getByRole("button", { name: "Analytics settings" }).click();
    await preferences.getByRole("button", { name: "Decline analytics" }).click();

    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#microsoft-clarity")).toHaveCount(0);
    expect(tagRequests).toBe(1);
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === CLARITY_CONSENT_COOKIE)?.value).toBe("denied");
    for (const name of CLARITY_FIRST_PARTY_COOKIES) {
      expect(cookies.some((cookie) => cookie.name === name), `${name} should be removed`).toBe(false);
    }
  });

  test("direct auth visits never install Clarity, even with a stored opt-in", async ({ page, context }) => {
    expect(BASE_URL).toBeTruthy();
    await context.addCookies([{
      name: CLARITY_CONSENT_COOKIE,
      value: "granted",
      url: BASE_URL!,
      sameSite: "Lax",
    }]);

    let tagRequests = 0;
    await page.route(CLARITY_TAG_URL, async (route) => {
      tagRequests += 1;
      await route.abort();
    });

    const response = await page.goto("/login", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    expect(tagRequests).toBe(0);
    await expect(page.locator("#microsoft-clarity")).toHaveCount(0);
    expect(await page.evaluate(() => typeof (window as Window & { clarity?: unknown }).clarity)).toBe("undefined");
  });

  test("marketing-to-signup navigation starts a clean document without Clarity", async ({ page, context }) => {
    expect(BASE_URL).toBeTruthy();
    await context.addCookies([{
      name: CLARITY_CONSENT_COOKIE,
      value: "granted",
      url: BASE_URL!,
      sameSite: "Lax",
    }]);

    let tagRequests = 0;
    await page.route(CLARITY_TAG_URL, async (route) => {
      tagRequests += 1;
      await route.fulfill({
        contentType: "application/javascript",
        body: "window.__ralticClarityTagLoaded = true;",
      });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect.poll(() => tagRequests).toBe(1);
    await page.getByRole("link", { name: /Get started/i }).first().click();

    await expect(page).toHaveURL(/\/signup(?:\?|$)/);
    await expect(page.getByText(/Create your account, then/i)).toBeVisible();
    expect(tagRequests).toBe(1);
    expect(await page.evaluate(() => typeof (window as Window & { clarity?: unknown }).clarity)).toBe("undefined");
  });

  test("consent banner preserves the primary CTA on mobile and desktop", async ({ page }) => {
    const expectSafeLayout = async () => {
      const preferences = page.locator("[data-analytics-preferences]");
      await expect(preferences).toBeVisible();
      const primaryCta = page.getByRole("link", { name: /^Start a launch workflow$/ }).first();
      const supportingCopy = page.getByText(/No credit card.*no local install to start/i);
      await expect(primaryCta).toBeVisible();
      await expect(supportingCopy).toBeVisible();
      const metrics = await preferences.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          left: box.left,
          right: box.right,
          viewportWidth: window.innerWidth,
          bodyOverflow: document.body.scrollWidth > window.innerWidth + 1,
          documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        };
      });
      const ctaBottom = await primaryCta.evaluate((element) => element.getBoundingClientRect().bottom);
      const supportingCopyBottom = await supportingCopy.evaluate((element) => element.getBoundingClientRect().bottom);

      expect(metrics.top, "consent panel should not cover hero actions or supporting copy").toBeGreaterThanOrEqual(
        Math.max(ctaBottom, supportingCopyBottom) + 4,
      );
      expect(metrics.left).toBeGreaterThanOrEqual(0);
      expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(metrics.bodyOverflow).toBe(false);
      expect(metrics.documentOverflow).toBe(false);
    };

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expectSafeLayout();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expectSafeLayout();
  });

  test("CSP permits the documented Clarity endpoints without weakening core guards", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    const csp = response.headers()["content-security-policy"] ?? "";

    expect(csp).toMatch(/script-src[^;]*https:\/\/\*\.clarity\.ms/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/\*\.clarity\.ms/);
    expect(csp).toMatch(/connect-src[^;]*https:\/\/c\.bing\.com/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test("privacy policy explains Clarity scope, consent, and retention", async ({ page }) => {
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/only after you select "Allow analytics," Microsoft Clarity/i)).toBeVisible();
    await expect(page.getByText(/advertising storage is always denied/i)).toBeVisible();
    await expect(page.getByText(/does not load the Clarity script/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Clarity retention documentation" })).toHaveAttribute(
      "href",
      "https://learn.microsoft.com/en-us/clarity/setup-and-installation/data-retention",
    );
  });
});
