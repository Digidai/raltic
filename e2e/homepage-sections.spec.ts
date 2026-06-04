import { expect, type Page, test } from "@playwright/test";
import { contrast, parseRgb } from "./helpers/heroui-workspace";

async function gotoHome(page: Page) {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
}

test.describe("homepage full section render", () => {
  test("/ returns 200 and shows the marketing nav header", async ({ page }) => {
    await gotoHome(page);

    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Raltic" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Runtimes" })).toBeVisible();
  });

  test("Hero is visible with the core positioning copy", async ({ page }) => {
    await gotoHome(page);

    // Hero H1 was rewritten to "Your AI Agent. Or theirs." — leads
    // with the dual-mode story instead of the old "ship together" copy.
    const hero = page.locator("section", { hasText: /Your AI Agent/i }).first();
    await expect(hero.getByRole("heading", { name: /Your AI Agent.*Or theirs/i })).toBeVisible();
    await expect(hero.getByText(/default cloud Agent/i)).toBeVisible();
    await expect(hero.getByText(/Claude Code, Codex, OpenClaw, Hermes/i)).toBeVisible();
  });

  test("TwoWaysToRun shows both run-mode cards and CTAs", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /Two ways to run/i });
    await expect(section.getByRole("heading", { name: "Raltic cloud Agent" })).toBeVisible();
    await expect(section.getByRole("heading", { name: /Your CLI.*Your daemon/i })).toBeVisible();
    await expect(section.getByRole("link", { name: /Start with the cloud Agent/i })).toBeVisible();
    await expect(section.getByRole("link", { name: /Set up the bridge/i })).toBeVisible();
  });

  test("RuntimeBadges lists all runtimes and experimental pills", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /Four runtimes/i });
    for (const runtime of ["Anthropic Claude", "OpenAI Codex", "OpenClaw", "Hermes"]) {
      await expect(section.getByText(runtime, { exact: true })).toBeVisible();
    }
    const runtimeStrip = section.locator("div.mt-5").first();
    const experimentalCards = runtimeStrip.locator("div.text-center").filter({ hasText: "Experimental" });
    await expect(experimentalCards).toHaveCount(2);
    await expect(runtimeStrip.locator("div.text-center").filter({ hasText: /OpenClaw/ }).getByText("Experimental").first()).toBeVisible();
    await expect(runtimeStrip.locator("div.text-center").filter({ hasText: /Hermes/ }).getByText("Experimental").first()).toBeVisible();
  });

  test("Architecture shows the three-card flow and visibility table", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /AI and security/i });
    await expect(section.locator("svg.lucide-laptop")).toBeVisible();
    await expect(section.locator("svg.lucide-cloud")).toBeVisible();
    await expect(section.locator("svg.lucide-globe")).toBeVisible();
    await expect(section.getByRole("heading", { name: "The work happens locally" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "The chat happens in the cloud" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "The team gets the value" })).toBeVisible();
    await expect(section.getByText("What we see", { exact: true })).toBeVisible();
    await expect(section.getByText("What we never see", { exact: true })).toBeVisible();
  });

  test("UseCases renders the engineering, ops, and product bento cards", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section#use-cases");
    await expect(section.getByText("engineering", { exact: true })).toBeVisible();
    await expect(section.getByText("ops", { exact: true })).toBeVisible();
    await expect(section.getByText("product", { exact: true })).toBeVisible();
    await expect(section.locator("h3")).toHaveCount(3);
  });

  test("AgentRecipe shows the team-agent headline, roster, and thread mock", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /A team of agents is a teammate/i });
    await expect(section.getByRole("heading", { name: /team of agents is a teammate/i })).toBeVisible();
    await expect(section.getByText(/Your agent roster.*#engineering/i)).toBeVisible();
    await expect(section.getByText("A thread, ten minutes later", { exact: true })).toBeVisible();
  });

  test("WhyRaltic renders at least six feature cards", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section#why");
    await expect(section.getByRole("heading", { name: /last AI rollout/i })).toBeVisible();
    expect(await section.locator("h3").count()).toBeGreaterThanOrEqual(6);
  });

  test("marketing icon chips keep readable icon contrast", async ({ page }) => {
    await gotoHome(page);

    const samples = await page
      .locator("section#why .raltic-marketing-icon-chip, table .raltic-marketing-status-chip")
      .evaluateAll((nodes) =>
        nodes
          .filter((node): node is HTMLElement => node instanceof HTMLElement)
          .map((node) => {
            const svg = node.querySelector<SVGElement>("svg");
            const nodeStyle = getComputedStyle(node);
            const iconStyle = svg ? getComputedStyle(svg) : nodeStyle;
            return {
              label: node.getAttribute("aria-label") ?? node.textContent?.trim() ?? "",
              className: node.getAttribute("class") ?? "",
              background: nodeStyle.backgroundColor,
              color: iconStyle.color,
            };
          }),
      );

    expect(samples.length, "homepage should render marketing icon/status chips").toBeGreaterThanOrEqual(8);
    for (const sample of samples) {
      const foreground = parseRgb(sample.color);
      const background = parseRgb(sample.background);
      expect(sample.background, `${sample.label} should own an opaque icon background`).not.toBe("rgba(0, 0, 0, 0)");
      expect(sample.color, `${sample.label} should not render as black-on-dark`).not.toBe("rgb(0, 0, 0)");
      expect(
        foreground && background ? contrast(foreground, background) : 0,
        `${sample.label} icon contrast ${JSON.stringify(sample)}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("Comparison renders the product table with at least eight rows", async ({ page }) => {
    await gotoHome(page);

    const table = page.getByRole("table");
    await expect(table.getByRole("columnheader", { name: "ChatGPT for Work" })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /Cursor/i })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /Slack/i })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Raltic" })).toBeVisible();
    expect(await table.locator("tbody tr").count()).toBeGreaterThanOrEqual(8);
  });

  test("Pricing renders cards and the free private beta message", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section#pricing");
    await expect(section.getByRole("heading", { name: /Free.*beta/i })).toBeVisible();
    expect(await section.locator("h3").count()).toBeGreaterThanOrEqual(1);
    await expect(page.getByText(/Private beta.*Free/i).first()).toBeVisible();
  });

  test("FAQ renders accordion and expands a question", async ({ page }) => {
    await gotoHome(page);

    const faqSection = page.locator("section#faq");
    const firstQuestion = faqSection.getByRole("button").first();
    await expect(firstQuestion).toBeVisible();
    const bodyId = await firstQuestion.getAttribute("aria-controls");
    expect(bodyId).toBeTruthy();
    if (!bodyId) return;
    const initiallyOpen = await firstQuestion.getAttribute("aria-expanded");
    if (initiallyOpen === "true") {
      await firstQuestion.click();
      await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
    }

    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
    await expect(faqSection.locator(`#${bodyId}`).locator("p")).toBeVisible();
  });

  test("FinalCta shows the stop tab-switching headline and HomeCta", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /Stop tab-switching/i });
    await expect(section.getByRole("heading", { name: /Stop tab-switching/i })).toBeVisible();
    // Primary CTA renamed: "Get started" → "Start a cloud Agent"
    // (signed-out branch); signed-in branch is "Open Raltic".
    await expect(section.getByRole("link", { name: /Start a cloud Agent|Open Raltic/i })).toBeVisible();
    const metrics = await section.evaluate((el) => {
      const sectionRect = el.getBoundingClientRect();
      const panel = el.querySelector<HTMLElement>(".raltic-marketing-cta-panel");
      const button = el.querySelector<HTMLElement>("a,button");
      const sectionStyle = getComputedStyle(el);
      return {
        sectionHeight: sectionRect.height,
        panelExists: Boolean(panel),
        bottomGap: button ? sectionRect.bottom - button.getBoundingClientRect().bottom : sectionRect.height,
        backgroundColor: sectionStyle.backgroundColor,
        backgroundImage: sectionStyle.backgroundImage,
      };
    });
    expect(metrics.panelExists, "final CTA should render inside a bounded panel").toBe(true);
    expect(metrics.sectionHeight, `final CTA should not become an oversized black band: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(460);
    expect(metrics.bottomGap, `final CTA should not leave a large empty bottom gap: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(140);
    expect(metrics.backgroundImage, "final CTA should carry a tokenized surface gradient").not.toBe("none");
    expect(metrics.backgroundImage, "final CTA gradient should not be pure black").not.toContain("rgb(0, 0, 0)");
  });

  test("Footer links to all public product, audience, and legal routes", async ({ page }) => {
    await gotoHome(page);

    const footer = page.locator("footer");
    for (const href of ["/runtimes", "/connectors", "/security", "/privacy", "/terms", "/indie", "/teams", "/signup", "/login"]) {
      await expect(footer.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });
});
