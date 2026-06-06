import { expect, test } from "@playwright/test";
import { contrast, parseRgb } from "./helpers/heroui-workspace";

type MarketingRoute = {
  path: string;
  heading: RegExp;
  headingSelector?: "h1" | "h1, h2";
  robots?: "noindex,nofollow";
};

const marketingRoutes: MarketingRoute[] = [
  {
    path: "/runtimes",
    heading: /Four agent runtimes|One chat surface/i,
  },
  {
    path: "/runtimes/claude",
    heading: /Claude/i,
    headingSelector: "h1",
  },
  {
    path: "/runtimes/codex",
    heading: /Codex/i,
    headingSelector: "h1",
  },
  {
    path: "/runtimes/openclaw",
    heading: /OpenClaw/i,
    headingSelector: "h1",
    robots: "noindex,nofollow",
  },
  {
    path: "/runtimes/hermes",
    heading: /Hermes/i,
    headingSelector: "h1",
    robots: "noindex,nofollow",
  },
  {
    path: "/indie",
    heading: /All your AI agents|indie devs/i,
  },
  {
    path: "/teams",
    heading: /Your team's AI workspace|Waitlist/i,
    robots: "noindex,nofollow",
  },
  {
    path: "/connectors",
    heading: /Give your agents access|Connectors/i,
  },
  {
    path: "/desktop",
    heading: /Raltic Desktop beta/i,
    headingSelector: "h1",
    robots: "noindex,nofollow",
  },
  {
    path: "/security",
    heading: /What we see|What we don't|Security/i,
  },
  {
    path: "/privacy",
    heading: /Privacy Policy/i,
  },
  {
    path: "/terms",
    heading: /Terms of Service/i,
  },
];

test.describe("marketing public access", () => {
  for (const route of marketingRoutes) {
    test(`${route.path} is reachable anonymously and renders marketing chrome`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

      expect(response?.status(), `${route.path} should return 200`).toBe(200);
      expect(new URL(page.url()).pathname, `${route.path} should not redirect to /login`).toBe(route.path);

      const headingSelector = route.headingSelector ?? "h1, h2";
      await expect(
        page.locator(headingSelector).filter({ hasText: route.heading }).first(),
      ).toBeVisible();

      const footer = page.locator("footer .raltic-marketing-footer-grid");
      await expect(footer.getByRole("link", { name: /privacy policy/i })).toBeVisible();
      await expect(footer.getByRole("link", { name: /terms of service/i })).toBeVisible();

      if (route.robots) {
        const robots = await page.locator("meta[name='robots']").getAttribute("content");
        expect(robots?.replace(/\s+/g, "")).toBe(route.robots);
      }
    });
  }

  test("/security keeps full-bleed sections and avoids mobile horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto("/security", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(200);
    await expect(page.locator("main > section").first()).toBeVisible();

    const metrics = await page.evaluate(() => {
      const firstSection = document.querySelector("main > section");
      const box = firstSection?.getBoundingClientRect();
      return {
        viewportWidth: window.innerWidth,
        bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
        documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        firstSection: box
          ? { left: box.left, right: box.right, width: box.width }
          : null,
      };
    });

    expect(metrics.bodyOverflowX).toBe(false);
    expect(metrics.documentOverflowX).toBe(false);
    expect(metrics.firstSection).not.toBeNull();
    expect(metrics.firstSection!.left).toBeCloseTo(0, 1);
    expect(metrics.firstSection!.right).toBeCloseTo(metrics.viewportWidth, 1);
  });

  test("/404 uses the token brand monogram and avoids mobile horizontal overflow", async ({ page }) => {
    const response = await page.goto("/connectors/missing-heroui-brand-check", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Raltic/ })).toBeVisible();

    const brandMetrics = await page.getByRole("link", { name: /Raltic/ }).evaluate((brand) => {
      const mark = brand.querySelector<HTMLElement>("[aria-hidden='true']");
      const style = mark ? getComputedStyle(mark) : null;
      return {
        className: mark?.getAttribute("class") ?? "",
        backgroundImage: style?.backgroundImage ?? "",
        color: style?.color ?? "",
      };
    });

    expect(brandMetrics.className).not.toMatch(/(?:cyan|amber)-\d{2,3}/);
    expect(brandMetrics.backgroundImage).toContain("linear-gradient");
    expect(brandMetrics.color, "monogram text should not rely on low-contrast white over accent").not.toBe("rgb(255, 255, 255)");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/connectors/missing-heroui-brand-check-mobile", { waitUntil: "domcontentloaded" });
    const mobileMetrics = await page.evaluate(() => ({
      bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
      documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      headingVisible: Boolean(document.querySelector("h1")?.textContent?.includes("Page not found")),
    }));

    expect(mobileMetrics.headingVisible).toBe(true);
    expect(mobileMetrics.bodyOverflowX).toBe(false);
    expect(mobileMetrics.documentOverflowX).toBe(false);
  });

  test("/runtimes keeps experimental Hermes neutral instead of danger red", async ({ page }) => {
    await page.goto("/runtimes", { waitUntil: "domcontentloaded" });

    const hermesCard = page.locator('a[href="/runtimes/hermes"]');
    await expect(hermesCard).toBeVisible();
    const cardMetrics = await hermesCard.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        className: el.getAttribute("class") ?? "",
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(cardMetrics.className, `Hermes card should not use danger/rose classes: ${JSON.stringify(cardMetrics)}`).not.toMatch(/danger|rose/);
    expect(cardMetrics.borderColor, `Hermes card border should not be danger red: ${JSON.stringify(cardMetrics)}`).not.toContain("222, 54, 92");

    await hermesCard.click();
    await expect(page).toHaveURL(/\/runtimes\/hermes$/);
    const heroPill = page.locator("section").first().locator("span.inline-flex").first();
    const pillClass = await heroPill.getAttribute("class");
    expect(pillClass ?? "", "Hermes detail pill should not use danger/rose classes").not.toMatch(/danger|rose/);

    const installHint = page.getByText(/Then sign up and pick Hermes/i);
    await expect(installHint).toBeVisible();
    const hintMetrics = await installHint.evaluate((el) => {
      const runtimeName = el.querySelector("span");
      const section = el.closest("section");
      const runtimeStyle = runtimeName instanceof HTMLElement ? getComputedStyle(runtimeName) : null;
      const sectionStyle = section instanceof HTMLElement ? getComputedStyle(section) : null;
      return {
        runtimeName: runtimeName?.textContent ?? "",
        runtimeColor: runtimeStyle?.color ?? "",
        sectionBackground: sectionStyle?.backgroundColor ?? "",
      };
    });
    const foreground = parseRgb(hintMetrics.runtimeColor);
    const background = parseRgb(hintMetrics.sectionBackground);
    expect(hintMetrics.runtimeName).toBe("Hermes");
    expect(
      foreground && background ? contrast(foreground, background) : 0,
      `install hint runtime name contrast ${JSON.stringify(hintMetrics)}`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("/indie newsletter error stays in normal flow on desktop widths", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 844 });
    await page.route("**/api/v1/marketing/newsletter", (route) => route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Newsletter service unavailable" } }),
    }));
    await page.route("**:8787/api/v1/marketing/newsletter", (route) => route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Newsletter service unavailable" } }),
    }));

    await page.goto("/indie", { waitUntil: "networkidle" });
    await page.getByLabel("Your email address").fill("gene@example.com");
    await page.getByRole("button", { name: /Keep me in the loop/ }).click();

    const alert = page.getByText("Newsletter service unavailable");
    await expect(alert).toBeVisible();

    const metrics = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.includes("Keep me in the loop") || candidate.textContent?.includes("Sending"));
      const alert = Array.from(document.querySelectorAll<HTMLElement>("[role='alert']"))
        .find((candidate) => candidate.textContent?.includes("Newsletter service unavailable"));
      const buttonBox = button?.getBoundingClientRect();
      const alertBox = alert?.getBoundingClientRect();
      return {
        bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
        documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        buttonBottom: buttonBox?.bottom ?? null,
        alertTop: alertBox?.top ?? null,
        alertWidth: alertBox?.width ?? null,
        viewportWidth: window.innerWidth,
      };
    });

    expect(metrics.bodyOverflowX).toBe(false);
    expect(metrics.documentOverflowX).toBe(false);
    expect(metrics.buttonBottom).not.toBeNull();
    expect(metrics.alertTop).not.toBeNull();
    expect(metrics.alertTop!, "newsletter error should render below the form controls").toBeGreaterThanOrEqual(metrics.buttonBottom! - 1);
    expect(metrics.alertWidth!, "newsletter error should fit inside the viewport").toBeLessThanOrEqual(metrics.viewportWidth);
  });

  test("/teams waitlist error stays in normal flow on desktop widths", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 844 });
    await page.route("**/api/v1/marketing/waitlist", (route) => route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Waitlist service unavailable" } }),
    }));
    await page.route("**:8787/api/v1/marketing/waitlist", (route) => route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: { message: "Waitlist service unavailable" } }),
    }));

    await page.goto("/teams", { waitUntil: "networkidle" });
    await page.getByLabel("Your name").fill("Gene");
    await page.getByLabel("Work email").fill("gene@example.com");
    await page.getByRole("button", { name: /Request access/ }).click();

    const alert = page.getByText("Waitlist service unavailable");
    await expect(alert).toBeVisible();

    const metrics = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.includes("Request access") || candidate.textContent?.includes("Sending"));
      const alert = Array.from(document.querySelectorAll<HTMLElement>("[role='alert']"))
        .find((candidate) => candidate.textContent?.includes("Waitlist service unavailable"));
      const buttonBox = button?.getBoundingClientRect();
      const alertBox = alert?.getBoundingClientRect();
      return {
        bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
        documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        buttonTop: buttonBox?.top ?? null,
        alertBottom: alertBox?.bottom ?? null,
        alertWidth: alertBox?.width ?? null,
        viewportWidth: window.innerWidth,
      };
    });

    expect(metrics.bodyOverflowX).toBe(false);
    expect(metrics.documentOverflowX).toBe(false);
    expect(metrics.buttonTop).not.toBeNull();
    expect(metrics.alertBottom).not.toBeNull();
    expect(metrics.alertBottom!, "waitlist error should render above the submit row").toBeLessThanOrEqual(metrics.buttonTop! + 1);
    expect(metrics.alertWidth!, "waitlist error should fit inside the viewport").toBeLessThanOrEqual(metrics.viewportWidth);
  });

  for (const path of ["/privacy", "/terms"]) {
    test(`${path} legal metadata keeps readable contrast tokens`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const legal = page.getByText("Legal", { exact: true });
      const updated = page.getByText(/Last updated:/);

      await expect(legal).toHaveClass(/text-zinc-400/);
      await expect(updated).toHaveClass(/text-zinc-400/);
    });
  }
});
