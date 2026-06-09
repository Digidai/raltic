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

    const hero = page.locator("section", { hasText: /Launch your first/i }).first();
    await expect(hero.getByRole("heading", { name: /Launch your first.*agent workflow/i })).toBeVisible();
    await expect(hero.getByText(/turns one business process into a workflow room/i)).toBeVisible();
    await expect(hero.getByText(/no local install to start/i)).toBeVisible();
    await expect(hero.getByTestId("workflow-preview")).toBeVisible();
  });

  test("Workflow preview switches examples without leaving the hero", async ({ page }) => {
    await gotoHome(page);

    const preview = page.getByTestId("workflow-preview");
    await expect(preview.getByRole("button", { name: /Customer risk/i })).toHaveAttribute("aria-pressed", "true");
    await expect(preview.getByText("15 min to account plan")).toBeVisible();

    await preview.getByRole("button", { name: /Code review/i }).click();
    await expect(preview.getByRole("button", { name: /Code review/i })).toHaveAttribute("aria-pressed", "true");
    await expect(preview.getByText(/Review a PR without uploading repo context/i)).toBeVisible();
    await expect(preview.getByText("code stays local")).toBeVisible();
  });

  test("TwoWaysToRun shows workflow-first cards and CTAs", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /Start from the workflow/i });
    await expect(section.getByRole("heading", { name: "Run a workflow" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Bring your agents" })).toBeVisible();
    await expect(section.getByRole("link", { name: /Start a workflow/i })).toBeVisible();
    await expect(section.getByRole("link", { name: /Connect a local runtime/i })).toBeVisible();
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

    const section = page.locator("section", { hasText: /Run workflows without/i });
    await expect(section.locator("svg.lucide-laptop")).toBeVisible();
    await expect(section.locator("svg.lucide-cloud")).toBeVisible();
    await expect(section.locator("svg.lucide-globe")).toBeVisible();
    await expect(section.getByRole("heading", { name: "Agents execute where you choose" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Rooms coordinate the workflow" })).toBeVisible();
    await expect(section.getByRole("heading", { name: "Runs become team memory" })).toBeVisible();
    await expect(section.getByText("What crosses the workspace", { exact: true })).toBeVisible();
    await expect(section.getByText("What stays out of the workspace", { exact: true })).toBeVisible();
  });

  test("UseCases renders revenue, launch, and engineering workflow cards", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section#use-cases");
    await expect(section.getByText("revenue", { exact: true })).toBeVisible();
    await expect(section.getByText("launch", { exact: true })).toBeVisible();
    await expect(section.getByText("engineering", { exact: true })).toBeVisible();
    await expect(section.locator("h3")).toHaveCount(3);
  });

  test("Workflow-first visual path makes the GTM model scannable", async ({ page }) => {
    await gotoHome(page);

    const section = page.locator("section", { hasText: /One room turns agent output/i });
    for (const label of ["Brief", "Agents", "Approval", "Memory"]) {
      await expect(section.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(section.getByText(/Start with the business process/i)).toBeVisible();
  });

  test("homepage positioning does not regress to chat-app-first copy", async ({ page }) => {
    await gotoHome(page);

    const bodyText = await page.locator("body").innerText();
    for (const oldCopy of [
      "Raltic is just team chat",
      "Same chat experience as Slack",
      "one place to talk, one place to ship",
      "Point chat at your own AI daemon",
    ]) {
      expect(bodyText).not.toContain(oldCopy);
    }
    await expect(page.getByText("One room turns agent output into accountable work.")).toBeVisible();
    await expect(page.getByText("Run workflows with your own AI daemon (OpenClaw / Hermes)")).toBeVisible();
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
    await expect(table.getByRole("rowheader", { name: "Workflow outputs reach the whole team" })).toBeVisible();
    await expect(table.getByRole("rowheader", { name: "Multiple specialist agents in one workflow" })).toBeVisible();
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

  test("FinalCta shows the workflow conversion headline and HomeCta", async ({ page }) => {
    await gotoHome(page);

    const footer = page.locator("footer");
    const lead = footer.locator("[data-raltic-footer-lead]");
    await expect(lead.getByRole("heading", { name: /Turn useful agents/i })).toBeVisible();
    // Primary CTA follows the authenticated Start page language.
    // (signed-out branch); signed-in branch is "Open Raltic".
    await expect(lead.getByRole("link", { name: /Start in 3 minutes|Open Raltic/i })).toBeVisible();
    const metrics = await footer.evaluate((el) => {
      const footerRect = el.getBoundingClientRect();
      const lead = el.querySelector<HTMLElement>("[data-raltic-footer-lead]");
      const grid = el.querySelector<HTMLElement>(".raltic-marketing-footer-grid");
      const panel = el.querySelector<HTMLElement>(".raltic-marketing-cta-panel");
      const button = lead?.querySelector<HTMLElement>("a,button") ?? null;
      const footerStyle = getComputedStyle(el);
      const leadRect = lead?.getBoundingClientRect();
      const gridRect = grid?.getBoundingClientRect();
      return {
        footerHeight: footerRect.height,
        leadHeight: leadRect?.height ?? 0,
        leadExists: Boolean(lead),
        panelExists: Boolean(panel),
        dividerGap: leadRect && gridRect ? gridRect.top - leadRect.bottom : null,
        buttonBottomGap: button && leadRect ? leadRect.bottom - button.getBoundingClientRect().bottom : null,
        backgroundColor: footerStyle.backgroundColor,
        backgroundImage: footerStyle.backgroundImage,
      };
    });
    expect(metrics.leadExists, "footer should expose a lead CTA region").toBe(true);
    expect(metrics.panelExists, "final CTA should not render as a separate card/panel").toBe(false);
    expect(metrics.leadHeight, `footer CTA lead should stay compact: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(360);
    expect(metrics.buttonBottomGap, `footer CTA should not leave a large empty bottom gap: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(90);
    expect(metrics.dividerGap, `footer CTA and link grid should share one continuous surface: ${JSON.stringify(metrics)}`).toBeLessThanOrEqual(1);
    expect(metrics.backgroundImage, "footer surface should carry a tokenized surface gradient").not.toBe("none");
    expect(metrics.backgroundImage, "footer gradient should not be pure black").not.toContain("rgb(0, 0, 0)");
  });

  test("Footer links to all public product, audience, and legal routes", async ({ page }) => {
    await gotoHome(page);

    const footer = page.locator("footer .raltic-marketing-footer-grid");
    for (const href of ["/runtimes", "/connectors", "/security", "/privacy", "/terms", "/indie", "/teams", "/signup", "/login"]) {
      await expect(footer.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });
});
