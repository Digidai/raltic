import { expect, test } from "@playwright/test";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION } from "../apps/web/src/lib/indexnow";
import { contrast, parseRgb } from "./helpers/heroui-workspace";

type MarketingRoute = {
  path: string;
  heading: RegExp;
  headingSelector?: "h1" | "h1, h2";
  robots?: "noindex,nofollow";
};

const marketingRoutes: MarketingRoute[] = [
  {
    path: "/workflows",
    heading: /AI agent workflows/i,
  },
  {
    path: "/workflows/customer-risk",
    heading: /AI customer-risk workflow/i,
    headingSelector: "h1",
  },
  {
    path: "/workflows/launch-readiness",
    heading: /AI launch readiness workflow/i,
    headingSelector: "h1",
  },
  {
    path: "/workflows/research-synthesis",
    heading: /AI research synthesis workflow/i,
    headingSelector: "h1",
  },
  {
    path: "/workflows/code-review",
    heading: /Local AI code review workflow/i,
    headingSelector: "h1",
  },
  {
    path: "/runtimes",
    heading: /Verified bridge runtimes|Experimental daemons/i,
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

  test("verified runtime pages preserve local-runtime signup intent", async ({ page }) => {
    for (const runtimePath of ["/runtimes/claude", "/runtimes/codex"]) {
      await page.goto(runtimePath, { waitUntil: "domcontentloaded" });

      const ctas = page.getByRole("link", { name: /Connect this runtime/i });
      await expect(ctas.first()).toBeVisible();
      const count = await ctas.count();
      expect(count, `${runtimePath} should expose runtime-intent CTAs`).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        await expect(ctas.nth(i)).toHaveAttribute("href", "/signup?intent=connect-runtime");
      }
    }
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

    const installHint = page.getByText(/This integration is visible for evaluation/i);
    await expect(installHint).toBeVisible();
    const hintMetrics = await installHint.evaluate((el) => {
      const hintStyle = getComputedStyle(el);
      let backgroundElement: HTMLElement | null = el.closest("section");
      let backgroundColor = "";
      while (backgroundElement) {
        const style = getComputedStyle(backgroundElement);
        if (style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)") {
          backgroundColor = style.backgroundColor;
          break;
        }
        backgroundElement = backgroundElement.parentElement;
      }
      return {
        hintText: el.textContent ?? "",
        hintColor: hintStyle.color,
        sectionBackground: backgroundColor,
      };
    });
    const foreground = parseRgb(hintMetrics.hintColor);
    const background = parseRgb(hintMetrics.sectionBackground);
    expect(hintMetrics.hintText).toContain("agent creation is locked");
    expect(
      foreground && background ? contrast(foreground, background) : 0,
      `install hint contrast ${JSON.stringify(hintMetrics)}`,
    ).toBeGreaterThanOrEqual(4.5);
  });

  test("/runtimes experimental detail pages show locked evaluation copy", async ({ page }) => {
    for (const runtimePath of ["/runtimes/openclaw", "/runtimes/hermes"]) {
      await page.goto(runtimePath, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Experimental runtime.")).toBeVisible();
      await expect(page.getByText(/agent creation is locked/i)).toBeVisible();
      await expect(page.getByText(/not production-critical work/i)).toBeVisible();
    }
  });

  test("SEO discovery files expose indexable workflow pages and AI crawler guidance", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const sitemapText = await sitemap.text();
    for (const path of [
      "/workflows",
      "/workflows/customer-risk",
      "/workflows/launch-readiness",
      "/workflows/research-synthesis",
      "/workflows/code-review",
    ]) {
      expect(sitemapText).toContain(`https://raltic.com${path}`);
    }
    expect(sitemapText).not.toContain("https://raltic.com/teams");
    expect(sitemapText).not.toContain("https://raltic.com/runtimes/openclaw");
    expect(sitemapText).not.toContain("https://raltic.com/runtimes/hermes");

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).toContain("OAI-SearchBot");
    expect(robotsText).toContain("Claude-User");
    expect(robotsText).toContain("Claude-SearchBot");
    expect(robotsText).toContain("PerplexityBot");
    expect(robotsText).toContain("Perplexity-User");
    expect(robotsText).toContain("Disallow: /s/");
    expect(robotsText).toContain("Sitemap: https://raltic.com/sitemap.xml");
    const appCrawlerBlockStart = robotsText.indexOf("User-Agent: Googlebot");
    expect(appCrawlerBlockStart).toBeGreaterThanOrEqual(0);
    const ralticCrawlerBlock = robotsText.slice(appCrawlerBlockStart);
    expect(ralticCrawlerBlock).not.toContain("User-Agent: ClaudeBot");
    expect(ralticCrawlerBlock).not.toContain("User-Agent: GPTBot");

    const llms = await request.get("/llms.txt");
    expect(llms.status()).toBe(200);
    expect(llms.headers()["content-type"]).toContain("text/plain");
    expect(llms.headers()["last-modified"]).toBeTruthy();
    expect(llms.headers()["x-robots-tag"]).toContain("index, follow");
    const llmsText = await llms.text();
    expect(llmsText).toContain("# Raltic");
    expect(llmsText).toContain("https://raltic.com/workflows/code-review");
    expect(llmsText).toContain("Claude Code and OpenAI Codex are verified bridge runtimes");
    expect(llmsText).toContain("AI Retrieval And Crawler Policy");
    expect(llmsText).toContain("Claude-User");
    expect(llmsText).toContain("Perplexity-User");
    expect(llmsText).toContain("IndexNow key");
    expect(llmsText).toContain(INDEXNOW_KEY_LOCATION);
    expect(llmsText).toContain(INDEXNOW_ENDPOINT);
    expect(llmsText).toContain("Training crawlers such as GPTBot and ClaudeBot are not product acquisition traffic");

    const indexNowKey = await request.get(`/${INDEXNOW_KEY}.txt`);
    expect(indexNowKey.status()).toBe(200);
    expect(indexNowKey.headers().location).toBeFalsy();
    expect(indexNowKey.headers()["content-type"]).toContain("text/plain");
    expect((await indexNowKey.text()).trim()).toBe(INDEXNOW_KEY);
  });

  test("workflow index exposes collection structured data and social preview image", async ({ page }) => {
    await page.goto("/workflows", { waitUntil: "domcontentloaded" });

    const jsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => script.textContent ?? "").join("\n"),
    );
    expect(jsonLd).toContain("CollectionPage");
    expect(jsonLd).toContain("ItemList");
    for (const path of [
      "/workflows/customer-risk",
      "/workflows/launch-readiness",
      "/workflows/research-synthesis",
      "/workflows/code-review",
    ]) {
      expect(jsonLd).toContain(`https://raltic.com${path}`);
    }

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image$/);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/opengraph-image$/);
  });

  test("workflow detail pages expose signup CTA, structured data, and mobile-safe layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workflows/code-review", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("link", { name: /Start this workflow free/i }).first()).toHaveAttribute("href", "/signup");
    await expect(page.locator("#step-1")).toBeVisible();
    const jsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => script.textContent ?? "").join("\n"),
    );
    expect(jsonLd).toContain("FAQPage");
    expect(jsonLd).toContain("HowTo");
    expect(jsonLd).toContain("HowToStep");
    expect(jsonLd).toContain("Local AI code review workflow");
    expect(jsonLd).toContain("https://raltic.com/opengraph-image");
    expect(jsonLd).toContain("https://raltic.com/workflows/code-review#step-1");
    expect(jsonLd).toContain("dateModified");

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/opengraph-image$/);

    const metrics = await page.evaluate(() => ({
      bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
      documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    expect(metrics.bodyOverflowX).toBe(false);
    expect(metrics.documentOverflowX).toBe(false);
  });

  test("marketing pages emit page-specific structured data and entity signals", async ({ page }) => {
    const ldFor = async (path: string) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
        scripts.map((s) => s.textContent ?? "").join("\n"),
      );
    };

    // Organization entity signals (global graph) — sameAs + knowsAbout +
    // contactPoint strengthen knowledge-graph + AI-engine entity recognition.
    const home = await ldFor("/");
    expect(home).toContain("https://github.com/Digidai/raltic");
    expect(home).toContain("knowsAbout");
    expect(home).toContain("ContactPoint");
    expect(home).toContain("featureList");

    // Runtimes hub: collection + item list + breadcrumb.
    const runtimes = await ldFor("/runtimes");
    expect(runtimes).toContain("CollectionPage");
    expect(runtimes).toContain("ItemList");
    expect(runtimes).toContain("BreadcrumbList");
    expect(runtimes).toContain("https://raltic.com/runtimes/claude");

    // Verified runtime detail: webpage + FAQ + breadcrumb.
    const claude = await ldFor("/runtimes/claude");
    expect(claude).toContain("FAQPage");
    expect(claude).toContain("BreadcrumbList");
    expect(claude).toContain("https://raltic.com/runtimes/claude#webpage");

    // Experimental (noindex) runtime detail: NO page-specific rich data.
    const openclaw = await ldFor("/runtimes/openclaw");
    expect(openclaw).not.toContain("FAQPage");
    expect(openclaw).not.toContain("#webpage");

    // Indie page surfaces its FAQ as structured data.
    const indie = await ldFor("/indie");
    expect(indie).toContain("FAQPage");
    expect(indie).toContain("BreadcrumbList");

    // Connectors + Security: webpage + breadcrumb.
    for (const path of ["/connectors", "/security"]) {
      const ld = await ldFor(path);
      expect(ld, path).toContain("BreadcrumbList");
      expect(ld, path).toContain(`https://raltic.com${path}#webpage`);
    }
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

      // Light (ando.so) theme: muted legal metadata uses zinc-500, which
      // is more readable on the warm-white surface than the old zinc-400.
      await expect(legal).toHaveClass(/text-zinc-500/);
      await expect(updated).toHaveClass(/text-zinc-500/);
    });
  }
});
