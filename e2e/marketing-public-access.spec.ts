import { expect, test } from "@playwright/test";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION } from "../apps/web/src/lib/indexnow";
import { contrast, parseRgb } from "./helpers/heroui-workspace";
import { isPreDeployProductionTarget } from "./helpers/env";
import { ANSWER_PAGES, BLOG_ARTICLES } from "../apps/web/src/lib/editorial-content";
import { AUDIENCE_PAGES, FEATURE_PAGES } from "../apps/web/src/lib/growth-content";
import { COMPARISON_PAGES } from "../apps/web/src/lib/comparison-seo";
import { BUYER_GUIDES } from "../apps/web/src/lib/buyer-guide-content";

type MarketingRoute = {
  path: string;
  heading: RegExp;
  headingSelector?: "h1" | "h1, h2";
  robots?: "noindex,nofollow";
};

const roundTwoComparisonSlugs = [
  "dify",
  "flowise",
  "langflow",
  "openai-agents-sdk",
  "google-adk",
  "microsoft-agent-framework",
];
const roundTwoBuyerGuideSlugs = [
  "visual-ai-agent-builders",
  "ai-agent-observability-evaluation-tools",
];
const roundTwoBlogSlugs = [
  "ai-agent-stack-layers",
  "ai-agent-evaluation-scorecard",
  "visual-ai-agent-builder-production-checklist",
];
const roundTwoAnswerSlugs = [
  "what-is-an-ai-agent-builder",
  "what-is-an-ai-agent-sdk",
  "what-is-ai-agent-observability",
  "what-is-an-ai-agent-evaluation",
  "what-is-multi-agent-orchestration",
  "what-is-an-ai-agent-control-plane",
];

function exactText(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

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
    heading: /Local-runtime AI code review/i,
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

marketingRoutes.push(
  { path: "/compare", heading: /How Raltic compares/i, headingSelector: "h1" },
  ...COMPARISON_PAGES.map((page) => ({ path: `/compare/${page.slug}`, heading: exactText(page.h1), headingSelector: "h1" as const })),
  { path: "/best", heading: /best AI agent platforms/i, headingSelector: "h1" },
  ...BUYER_GUIDES.map((guide) => ({ path: `/best/${guide.slug}`, heading: exactText(guide.title), headingSelector: "h1" as const })),
  { path: "/connectors/github", heading: /GitHub/i, headingSelector: "h1" },
  { path: "/connectors/linear", heading: /Linear/i, headingSelector: "h1" },
  { path: "/connectors/notion", heading: /Notion/i, headingSelector: "h1" },
  { path: "/glossary", heading: /AI agent workflow glossary/i, headingSelector: "h1" },
  { path: "/features", heading: /operating layer around agent work/i, headingSelector: "h1" },
  ...FEATURE_PAGES.map((page) => ({ path: `/features/${page.slug}`, heading: exactText(page.h1), headingSelector: "h1" as const })),
  { path: "/built-for", heading: /built for teams that own the outcome/i, headingSelector: "h1" },
  ...AUDIENCE_PAGES.map((page) => ({ path: `/built-for/${page.slug}`, heading: exactText(page.h1), headingSelector: "h1" as const })),
  { path: "/blog", heading: /field guides for accountable agent work/i, headingSelector: "h1" },
  ...BLOG_ARTICLES.map((article) => ({ path: `/blog/${article.slug}`, heading: exactText(article.title), headingSelector: "h1" as const })),
  { path: "/answers", heading: /AI agent workflow questions, answered/i, headingSelector: "h1" },
  ...ANSWER_PAGES.map((answer) => ({ path: `/answers/${answer.slug}`, heading: exactText(answer.question), headingSelector: "h1" as const })),
  { path: "/about", heading: /Agent work should be as reviewable as human work/i, headingSelector: "h1" },
  { path: "/pricing", heading: /Start free\. Pay your AI provider directly/i, headingSelector: "h1" },
);

const currentBundleOnlyMarketingRoutes = new Set([
  ...[
    "microsoft-365-copilot",
    "asana-ai-studio",
    "notion-ai-agent",
    "n8n-ai",
    "langgraph",
    "crewai",
    "microsoft-copilot-studio",
    "gemini-enterprise-agent-platform",
    ...roundTwoComparisonSlugs,
  ].map((slug) => `/compare/${slug}`),
  "/features",
  ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
  "/built-for",
  ...AUDIENCE_PAGES.map((page) => `/built-for/${page.slug}`),
  "/blog",
  ...BLOG_ARTICLES.map((article) => `/blog/${article.slug}`),
  "/answers",
  ...ANSWER_PAGES.map((answer) => `/answers/${answer.slug}`),
  "/best",
  ...BUYER_GUIDES.map((guide) => `/best/${guide.slug}`),
  "/about",
  "/pricing",
]);

test.describe("marketing public access", () => {
  for (const route of marketingRoutes) {
    test(`${route.path} is reachable anonymously and renders marketing chrome`, async ({ page }) => {
      test.skip(
        isPreDeployProductionTarget() && (route.path === "/workflows/code-review" || currentBundleOnlyMarketingRoutes.has(route.path)),
        "This landing page requires the current bundle, not the pre-deploy production bundle.",
      );
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
    // Probe an unmatched path UNDER a static public prefix (/security has no
    // dynamic child route) so it: (a) clears the middleware allowlist instead
    // of 307-ing to /login, and (b) falls through to the ROOT not-found page
    // rather than a notFound() rendered inside the (marketing) layout. The
    // latter would add the nav's own "Raltic" logo link and break the
    // single-monogram assertion below. (Paths under /connectors/* or
    // /compare/* now match a dynamic [param] route, so they can't be used.)
    const response = await page.goto("/security/missing-heroui-brand-check", { waitUntil: "domcontentloaded" });

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
    await page.goto("/security/missing-heroui-brand-check-mobile", { waitUntil: "domcontentloaded" });
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
    const getHintMetrics = () => installHint.evaluate((el) => {
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
        connected: el.isConnected,
        hintText: el.textContent ?? "",
        hintColor: hintStyle.color,
        sectionBackground: backgroundColor,
      };
    });
    await expect.poll(getHintMetrics).toMatchObject({
      connected: true,
      hintText: expect.stringContaining("agent creation is locked"),
      hintColor: expect.stringMatching(/^rgb/),
      sectionBackground: expect.stringMatching(/^rgb/),
    });
    const hintMetrics = await getHintMetrics();
    const foreground = parseRgb(hintMetrics.hintColor);
    const background = parseRgb(hintMetrics.sectionBackground);
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
    test.skip(
      isPreDeployProductionTarget(),
      "The revised sitemap and LLM discovery files require the current bundle, not the pre-deploy production bundle.",
    );
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
    expect(sitemapText).not.toContain("https://raltic.com/signup");
    expect(sitemapText).not.toContain("https://raltic.com/login");
    expect(sitemapText).not.toContain("https://raltic.com/forgot-password");
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
    test.skip(
      isPreDeployProductionTarget(),
      "The revised workflow proof and CTA require the current bundle, not the pre-deploy production bundle.",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/workflows/code-review", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("link", { name: /Start this workflow free/i }).first()).toHaveAttribute("href", "/signup?workflow=code-review");
    await expect(page.locator("#step-1")).toBeVisible();
    await expect(page.getByText("Illustrative example", { exact: true })).toBeVisible();
    await expect(page.getByText(/not customer data or a promised result/i)).toBeVisible();
    const jsonLd = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => script.textContent ?? "").join("\n"),
    );
    expect(jsonLd).toContain("FAQPage");
    expect(jsonLd).toContain("HowTo");
    expect(jsonLd).toContain("HowToStep");
    expect(jsonLd).toContain("Local AI Code Review Workflow Room");
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

  test("comparison pages disclose current official sources", async ({ page }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The researched comparison sources require the current bundle, not the pre-deploy production bundle.",
    );
    await page.goto("/compare/chatgpt-for-work", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Raltic vs ChatGPT Business." })).toBeVisible();
    await expect(page.getByRole("link", { name: /OpenAI: Projects in ChatGPT/ })).toHaveAttribute(
      "href",
      "https://help.openai.com/en/articles/10169521-projects-in-chatgpt",
    );
    await expect(page.getByText(/Capability-fit review updated August 15, 2026/i)).toBeVisible();
  });

  test("privacy copy discloses intentional posts and model-provider routing", async ({ page }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The revised privacy disclosure requires the current bundle, not the pre-deploy production bundle.",
    );
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });

    await expect(page.getByText(/Raltic receives a code excerpt or file only when a user or agent deliberately posts it/i)).toBeVisible();
    await expect(page.getByText(/The AI CLI may separately send context to its model provider/i)).toBeVisible();
    await expect(page.getByText(/only the room reply crosses the network/i)).toHaveCount(0);
  });

  test("marketing pages emit page-specific structured data and entity signals", async ({ page }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The expanded structured-data checks require the current bundle, not the pre-deploy production bundle.",
    );
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

    // Comparison hub + detail.
    const compareHub = await ldFor("/compare");
    expect(compareHub).toContain("CollectionPage");
    expect(compareHub).toContain("ItemList");
    expect(compareHub).toContain("https://raltic.com/compare/cursor");
    const compareDetail = await ldFor("/compare/cursor");
    expect(compareDetail).toContain("FAQPage");
    expect(compareDetail).toContain("BreadcrumbList");
    expect(compareDetail).toContain("https://raltic.com/compare/cursor#webpage");

    // Buyer guide hub + detail: collection, ranked items, article, FAQ, and breadcrumb.
    const buyerHub = await ldFor("/best");
    expect(buyerHub).toContain("CollectionPage");
    expect(buyerHub).toContain("ItemList");
    expect(buyerHub).toContain("https://raltic.com/best/ai-agent-orchestration-platforms");
    const buyerDetail = await ldFor("/best/ai-agent-orchestration-platforms");
    expect(buyerDetail).toContain("Article");
    expect(buyerDetail).toContain("ItemList");
    expect(buyerDetail).toContain("FAQPage");

    // Connector detail: webpage + HowTo setup + FAQ.
    const connectorDetail = await ldFor("/connectors/github");
    expect(connectorDetail).toContain("HowTo");
    expect(connectorDetail).toContain("HowToStep");
    expect(connectorDetail).toContain("FAQPage");

    // Glossary: DefinedTermSet for definitional GEO queries.
    const glossary = await ldFor("/glossary");
    expect(glossary).toContain("DefinedTermSet");
    expect(glossary).toContain("DefinedTerm");
  });

  test("SEO discovery files include the comparison, connector, and glossary pages", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/compare", "/compare/cursor", "/connectors/github", "/connectors/notion", "/glossary"]) {
      expect(sitemap, path).toContain(`https://raltic.com${path}`);
    }
    const llms = await (await request.get("/llms.txt")).text();
    expect(llms).toContain("https://raltic.com/compare/");
    expect(llms).toContain("https://raltic.com/llms-full.txt");

    const llmsFull = await request.get("/llms-full.txt");
    expect(llmsFull.status()).toBe(200);
    expect(llmsFull.headers()["content-type"]).toContain("text/plain");
    const llmsFullText = await llmsFull.text();
    expect(llmsFullText).toContain("Raltic vs");
    expect(llmsFullText).toContain("Bridge runtime");
  });

  test("growth content registries have unique routes, metadata, and complete editorial fields", () => {
    const pages = [
      ...FEATURE_PAGES.map((page) => ({ slug: `features/${page.slug}`, title: page.metaTitle, description: page.metaDescription, faqCount: page.faqs.length, relatedCount: page.related.length })),
      ...AUDIENCE_PAGES.map((page) => ({ slug: `built-for/${page.slug}`, title: page.metaTitle, description: page.metaDescription, faqCount: page.faqs.length, relatedCount: page.related.length })),
      ...BLOG_ARTICLES.map((page) => ({ slug: `blog/${page.slug}`, title: page.metaTitle, description: page.metaDescription, faqCount: page.faqs.length, relatedCount: page.related.length })),
      ...ANSWER_PAGES.map((page) => ({ slug: `answers/${page.slug}`, title: page.metaTitle, description: page.metaDescription, faqCount: page.faqs.length, relatedCount: page.related.length })),
      ...BUYER_GUIDES.map((page) => ({ slug: `best/${page.slug}`, title: page.metaTitle, description: page.metaDescription, faqCount: page.faqs.length, relatedCount: page.related.length })),
    ];
    expect(new Set(pages.map((page) => page.slug)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.description)).size).toBe(pages.length);
    for (const page of pages) {
      expect(page.title.length, page.slug).toBeGreaterThanOrEqual(20);
      expect(page.description.length, page.slug).toBeGreaterThanOrEqual(100);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(180);
      expect(page.faqCount, page.slug).toBeGreaterThanOrEqual(2);
      expect(page.relatedCount, page.slug).toBeGreaterThanOrEqual(3);
    }
    for (const article of BLOG_ARTICLES) {
      expect(article.sections.length, article.slug).toBeGreaterThanOrEqual(4);
      expect(article.sources.length, article.slug).toBeGreaterThanOrEqual(3);
      expect(article.sources.every((source) => source.href.startsWith("https://")), article.slug).toBe(true);
    }
    for (const guide of BUYER_GUIDES) {
      expect(guide.method.length, guide.slug).toBeGreaterThanOrEqual(4);
      expect(guide.picks.length, guide.slug).toBeGreaterThanOrEqual(5);
      expect(guide.picks.every((pick) => pick.source.href.startsWith("https://") || pick.source.href.startsWith("/")), guide.slug).toBe(true);
    }
    expect(COMPARISON_PAGES).toHaveLength(17);
    expect(BUYER_GUIDES).toHaveLength(5);
    expect(BLOG_ARTICLES).toHaveLength(13);
    expect(ANSWER_PAGES).toHaveLength(20);
    expect(COMPARISON_PAGES.every((page) => page.sourceLinks.length >= 2)).toBe(true);

    for (const slug of roundTwoComparisonSlugs) {
      const page = COMPARISON_PAGES.find((candidate) => candidate.slug === slug);
      expect(page, slug).toBeTruthy();
      expect(page!.related, slug).toHaveLength(3);
      expect(page!.faqs.length, slug).toBeGreaterThanOrEqual(3);
    }
    for (const slug of roundTwoBuyerGuideSlugs) {
      const guide = BUYER_GUIDES.find((candidate) => candidate.slug === slug);
      expect(guide, slug).toBeTruthy();
      expect(guide!.visual, slug).toBeTruthy();
    }
    for (const slug of roundTwoBlogSlugs) {
      const article = BLOG_ARTICLES.find((candidate) => candidate.slug === slug);
      expect(article, slug).toBeTruthy();
      expect(article!.visual, slug).toBeTruthy();
    }
    for (const slug of roundTwoAnswerSlugs) {
      const answer = ANSWER_PAGES.find((candidate) => candidate.slug === slug);
      expect(answer, slug).toBeTruthy();
      expect(answer!.visual, slug).toBeTruthy();
    }
  });

  test("round-two contextual internal links resolve to public pages", async ({ request }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The round-two content cluster requires the current bundle, not the pre-deploy production bundle.",
    );
    const links = new Set<string>();
    for (const page of COMPARISON_PAGES.filter((candidate) => roundTwoComparisonSlugs.includes(candidate.slug))) {
      for (const link of page.related ?? []) links.add(link.href);
    }
    for (const guide of BUYER_GUIDES.filter((candidate) => roundTwoBuyerGuideSlugs.includes(candidate.slug))) {
      for (const link of guide.related) links.add(link.href);
      for (const pick of guide.picks) if (pick.comparisonHref) links.add(pick.comparisonHref);
    }
    for (const article of BLOG_ARTICLES.filter((candidate) => roundTwoBlogSlugs.includes(candidate.slug))) {
      for (const link of article.related) links.add(link.href);
    }
    for (const answer of ANSWER_PAGES.filter((candidate) => roundTwoAnswerSlugs.includes(candidate.slug))) {
      for (const link of answer.related) links.add(link.href);
    }

    expect(links.size).toBeGreaterThanOrEqual(25);
    for (const href of links) {
      expect(href, "contextual links should stay internal").toMatch(/^\//);
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
    }
  });

  test("new SEO and GEO collections are fully discoverable", async ({ request }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The new discovery collections require the current bundle, not the pre-deploy production bundle.",
    );
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const expectedPaths = [
      "/features", "/built-for", "/blog", "/answers", "/best", "/about", "/pricing",
      ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
      ...AUDIENCE_PAGES.map((page) => `/built-for/${page.slug}`),
      ...BLOG_ARTICLES.map((article) => `/blog/${article.slug}`),
      ...ANSWER_PAGES.map((answer) => `/answers/${answer.slug}`),
      ...COMPARISON_PAGES.map((page) => `/compare/${page.slug}`),
      ...BUYER_GUIDES.map((guide) => `/best/${guide.slug}`),
    ];
    for (const path of expectedPaths) expect(sitemap, path).toContain(`https://raltic.com${path}`);

    const aiIndexResponse = await request.get("/ai-index.json");
    expect(aiIndexResponse.status()).toBe(200);
    expect(aiIndexResponse.headers()["content-type"]).toContain("application/json");
    const aiIndex = await aiIndexResponse.json() as { pages: Array<{ url: string }>; current_limitations: string[] };
    const indexedUrls = new Set(aiIndex.pages.map((page) => page.url));
    for (const path of expectedPaths) expect(indexedUrls.has(`https://raltic.com${path}`), path).toBe(true);
    expect(aiIndex.current_limitations.join(" ")).toContain("OpenClaw and Hermes are experimental");

    const rss = await request.get("/blog/feed.xml");
    expect(rss.status()).toBe(200);
    expect(rss.headers()["content-type"]).toContain("application/rss+xml");
    const rssText = await rss.text();
    for (const article of BLOG_ARTICLES) expect(rssText, article.slug).toContain(`https://raltic.com/blog/${article.slug}`);

    for (const discoveryFile of ["/llms.txt", "/llms-full.txt"]) {
      const text = await (await request.get(discoveryFile)).text();
      expect(text).toContain("https://raltic.com/features/workflow-rooms");
      expect(text).toContain("https://raltic.com/built-for/product-teams");
      expect(text).toContain("https://raltic.com/blog/what-is-an-agent-workflow");
      expect(text).toContain("https://raltic.com/answers/what-is-an-ai-workflow-room");
      expect(text).toContain("https://raltic.com/best/ai-agent-orchestration-platforms");
    }
    const llmsFullText = await (await request.get("/llms-full.txt")).text();
    const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    for (const url of sitemapUrls) expect(llmsFullText, url).toContain(url);
  });

  test("representative growth pages expose canonical data, structured data, CTA, FAQ interaction, and mobile-safe layout", async ({ page }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The growth page templates require the current bundle, not the pre-deploy production bundle.",
    );
    const cases = [
      { path: "/features/human-review", schema: "FAQPage" },
      { path: "/built-for/product-teams", schema: "FAQPage" },
      { path: "/blog/what-is-an-agent-workflow", schema: "Article" },
      { path: "/answers/what-is-an-ai-workflow-room", schema: "FAQPage" },
      { path: "/best/ai-agent-orchestration-platforms", schema: "ItemList" },
    ];
    await page.setViewportSize({ width: 390, height: 844 });
    for (const item of cases) {
      await page.goto(item.path, { waitUntil: "load" });
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://raltic.com${item.path}`);
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(jsonLd.join("\n"), item.path).toContain(item.schema);
      await expect(page.getByRole("link", { name: /Start free beta/i }).first()).toBeVisible();
      const faqTrigger = page.locator("#faq [data-slot='accordion-trigger']").first();
      await expect(faqTrigger).toBeVisible();
      await faqTrigger.click();
      await expect(faqTrigger).toHaveAttribute("aria-expanded", "true");
      const overflow = await page.evaluate(() => ({ body: document.body.scrollWidth > innerWidth + 1, html: document.documentElement.scrollWidth > innerWidth + 1 }));
      expect(overflow.body, item.path).toBe(false);
      expect(overflow.html, item.path).toBe(false);
    }
  });

  test("long-form content exposes semantic visuals and contextual internal links", async ({ page }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The new visual content and contextual links require the current bundle, not the pre-deploy production bundle.",
    );
    await page.goto("/blog/how-to-evaluate-ai-agent-platforms", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-content-visual="route-map"]')).toBeVisible();
    await expect(page.locator('[data-content-visual="evidence-board"]').first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Open the orchestration shortlist/i })).toHaveAttribute("href", "/best/ai-agent-orchestration-platforms");

    await page.goto("/compare/langgraph", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-content-visual="fit-map"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Orchestration platform shortlist/i })).toHaveAttribute("href", "/best/ai-agent-orchestration-platforms");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/blog/ai-agent-stack-layers", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-content-visual="decision-stack"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Shortlist visual builders/i }).first()).toHaveAttribute("href", "/best/visual-ai-agent-builders");

    await page.goto("/best/ai-agent-observability-evaluation-tools", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-content-visual="decision-loop"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Agent evaluation scorecard/i }).first()).toHaveAttribute("href", "/blog/ai-agent-evaluation-scorecard");

    await page.goto("/answers/what-is-an-ai-agent-evaluation", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-content-visual="decision-loop"]')).toBeVisible();

    await page.goto("/compare/dify", { waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-content-visual="fit-map"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /Best visual AI agent builders/i })).toHaveAttribute("href", "/best/visual-ai-agent-builders");

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth > window.innerWidth + 1,
      html: document.documentElement.scrollWidth > window.innerWidth + 1,
    }));
    expect(overflow.body).toBe(false);
    expect(overflow.html).toBe(false);
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

    const alert = page.getByRole("alert").filter({ hasText: /Newsletter service unavailable|Failed to fetch/ });
    await expect(alert).toBeVisible();

    const metrics = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.includes("Keep me in the loop") || candidate.textContent?.includes("Sending"));
      const alert = Array.from(document.querySelectorAll<HTMLElement>("[role='alert']"))
        .find((candidate) => /Newsletter service unavailable|Failed to fetch/.test(candidate.textContent ?? ""));
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

    const alert = page.getByRole("alert").filter({ hasText: /Waitlist service unavailable|Failed to fetch/ });
    await expect(alert).toBeVisible();

    const metrics = await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((candidate) => candidate.textContent?.includes("Request access") || candidate.textContent?.includes("Sending"));
      const alert = Array.from(document.querySelectorAll<HTMLElement>("[role='alert']"))
        .find((candidate) => /Waitlist service unavailable|Failed to fetch/.test(candidate.textContent ?? ""));
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
