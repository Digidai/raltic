import { expect, test, type Locator, type Page } from "@playwright/test";

import {
  agents,
  assertReadableInlineTokens,
  contrast,
  dmChannel,
  json,
  onboardingChannel,
  openMockChannel,
  openMockDm,
  researchChannel,
  server,
  setupMockWorkspace,
} from "./helpers/heroui-workspace";
import { isLocalWebTarget, isPreDeployProductionTarget } from "./helpers/env";

type Rect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type ShellMetrics = {
  viewport: { width: number; height: number };
  bodyOverflowX: boolean;
  documentOverflowX: boolean;
  bodyScrollable: boolean;
  documentScrollable: boolean;
  shell: Rect | null;
  sidebar: Rect | null;
  mobileSidebar: Rect | null;
  main: Rect | null;
  conversationHeader: Rect | null;
  composerFooter: Rect | null;
  composer: Rect | null;
  openNav: Rect | null;
  visibleConversationHeaders: number;
};

function parseRgb(value: string | null) {
  if (!value) return null;

  let match = value.match(/^rgba?\(([^)]+)\)$/);
  if (match) {
    const [r, g, b] = match[1]
      .replace(/\//g, " ")
      .split(/[\s,]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((token) => Number(token.endsWith("%") ? Number(token.slice(0, -1)) * 2.55 : Number(token)));

    if (r == null || g == null || b == null || Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [Math.round(r), Math.round(g), Math.round(b)] as const;
  }

  match = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)$/);
  if (match) {
    const [r, g, b] = match.slice(1, 4).map((token) => Math.round(Number(token) * 255));
    if (r == null || g == null || b == null || Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b))] as const;
  }

  return null;
}

async function visibleDangerTextSamples(page: Page) {
  return page.evaluate(() => {
    type Rgba = [number, number, number, number];

    function parseColor(value: string | null): Rgba | null {
      if (!value || value === "transparent") return null;

      let match = value.match(/^rgba?\(([^)]+)\)$/);
      if (match) {
        const parts = match[1].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
        const [r, g, b] = parts.slice(0, 3).map((token) => Number(token.endsWith("%") ? Number(token.slice(0, -1)) * 2.55 : Number(token)));
        const alpha = parts[3] == null ? 1 : Number(parts[3].endsWith("%") ? Number(parts[3].slice(0, -1)) / 100 : parts[3]);
        if ([r, g, b, alpha].some((component) => Number.isNaN(component))) return null;
        return [Math.round(r), Math.round(g), Math.round(b), Math.min(1, Math.max(0, alpha))];
      }

      match = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
      if (match) {
        const [r, g, b] = match.slice(1, 4).map((token) => Math.round(Number(token) * 255));
        const alpha = match[4] == null ? 1 : Number(match[4]);
        if ([r, g, b, alpha].some((component) => Number.isNaN(component))) return null;
        return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)), Math.min(1, Math.max(0, alpha))];
      }

      return null;
    }

    function blend(layer: Rgba, base: Rgba): Rgba {
      const alpha = layer[3] + base[3] * (1 - layer[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        Math.round((layer[0] * layer[3] + base[0] * base[3] * (1 - layer[3])) / alpha),
        Math.round((layer[1] * layer[3] + base[1] * base[3] * (1 - layer[3])) / alpha),
        Math.round((layer[2] * layer[3] + base[2] * base[3] * (1 - layer[3])) / alpha),
        alpha,
      ];
    }

    function effectiveBackground(node: HTMLElement) {
      const chain: HTMLElement[] = [];
      let current: HTMLElement | null = node;
      while (current) {
        chain.push(current);
        current = current.parentElement;
      }

      let background: Rgba = [255, 255, 255, 1];
      for (const element of chain.reverse()) {
        const layer = parseColor(getComputedStyle(element).backgroundColor);
        if (layer && layer[3] > 0) background = blend(layer, background);
      }
      return background.slice(0, 3);
    }

    return Array.from(document.querySelectorAll<HTMLElement>(".text-danger-text"))
      .filter((node) => {
        const box = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return box.width > 0
          && box.height > 0
          && style.visibility !== "hidden"
          && style.display !== "none"
          && Boolean(node.textContent?.trim());
      })
      .map((node) => ({
        text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
        color: getComputedStyle(node).color,
        background: `rgb(${effectiveBackground(node).join(", ")})`,
      }));
  });
}

async function assertVisibleDangerTextReadable(page: Page, label: string) {
  const samples = await visibleDangerTextSamples(page);
  expect(samples.length, `${label} should render danger text samples`).toBeGreaterThan(0);

  for (const sample of samples) {
    const foreground = parseRgb(sample.color);
    const background = parseRgb(sample.background);
    expect(
      foreground && background ? contrast(foreground, background) : 0,
      `${label}: ${sample.text}`,
    ).toBeGreaterThanOrEqual(4.5);
  }
}

async function workspaceIconFrameSamples(page: Page) {
  return page.evaluate(() => {
    type Rgba = [number, number, number, number];

    function parseColor(value: string | null): Rgba | null {
      if (!value || value === "transparent") return null;

      let match = value.match(/^rgba?\(([^)]+)\)$/);
      if (match) {
        const parts = match[1].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean);
        const [r, g, b] = parts.slice(0, 3).map((token) => Number(token.endsWith("%") ? Number(token.slice(0, -1)) * 2.55 : Number(token)));
        const alpha = parts[3] == null ? 1 : Number(parts[3].endsWith("%") ? Number(parts[3].slice(0, -1)) / 100 : parts[3]);
        if ([r, g, b, alpha].some((component) => Number.isNaN(component))) return null;
        return [Math.round(r), Math.round(g), Math.round(b), Math.min(1, Math.max(0, alpha))];
      }

      match = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/);
      if (match) {
        const [r, g, b] = match.slice(1, 4).map((token) => Math.round(Number(token) * 255));
        const alpha = match[4] == null ? 1 : Number(match[4]);
        if ([r, g, b, alpha].some((component) => Number.isNaN(component))) return null;
        return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b)), Math.min(1, Math.max(0, alpha))];
      }

      return null;
    }

    function luminanceChannel(value: number) {
      const v = value / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }

    function contrastRatio(foreground: readonly number[], background: readonly number[]) {
      const fg = 0.2126 * luminanceChannel(foreground[0]) + 0.7152 * luminanceChannel(foreground[1]) + 0.0722 * luminanceChannel(foreground[2]);
      const bg = 0.2126 * luminanceChannel(background[0]) + 0.7152 * luminanceChannel(background[1]) + 0.0722 * luminanceChannel(background[2]);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    }

    function blend(layer: Rgba, base: Rgba): Rgba {
      const alpha = layer[3] + base[3] * (1 - layer[3]);
      if (alpha === 0) return [0, 0, 0, 0];
      return [
        Math.round((layer[0] * layer[3] + base[0] * base[3] * (1 - layer[3])) / alpha),
        Math.round((layer[1] * layer[3] + base[1] * base[3] * (1 - layer[3])) / alpha),
        Math.round((layer[2] * layer[3] + base[2] * base[3] * (1 - layer[3])) / alpha),
        alpha,
      ];
    }

    function effectiveBackground(node: HTMLElement) {
      const chain: HTMLElement[] = [];
      let current: HTMLElement | null = node;
      while (current) {
        chain.push(current);
        current = current.parentElement;
      }

      let background: Rgba = [255, 255, 255, 1];
      for (const element of chain.reverse()) {
        const layer = parseColor(getComputedStyle(element).backgroundColor);
        if (layer && layer[3] > 0) background = blend(layer, background);
      }
      return background.slice(0, 3);
    }

    return Array.from(document.querySelectorAll<HTMLElement>('[data-slot="workspace-icon-frame"]'))
      .map((node, index) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        const fg = parseColor(style.color);
        const bg = effectiveBackground(node);
        return {
          label: node.textContent?.trim() || node.querySelector("svg")?.tagName || `icon-${index}`,
          visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
          color: style.color,
          background: style.backgroundColor,
          effectiveBackground: `rgb(${bg.join(", ")})`,
          contrast: fg ? contrastRatio(fg.slice(0, 3), bg) : 0,
        };
      });
  });
}

async function setupWorkspaceWithUnread(page: Page, context: Parameters<typeof setupMockWorkspace>[1]) {
  await setupMockWorkspace(page, context);
  await page.route("**/api/v1/servers/by-slug/demo", (route) => route.fulfill(json({
    server,
    channels: [
      onboardingChannel,
      {
        ...researchChannel,
        unread: 3,
        maxSeq: 4,
        lastReadSeq: 1,
      },
      dmChannel,
    ],
    agents,
  })));
}

async function shellMetrics(page: Page): Promise<ShellMetrics> {
  return page.evaluate(() => {
    const rect = (selector: string): Rect | null => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return null;
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (box.width === 0 || box.height === 0 || style.visibility === "hidden" || style.display === "none") return null;
      return {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height,
      };
    };
    const visibleByLabel = (selector: string, label: string) => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector))
        .filter((el) => el.getAttribute("aria-label") === label);
      return candidates.filter((el) => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
    };
    const shell = rect("[data-testid='workspace-shell']");
    const sidebar = rect("[data-testid='workspace-sidebar']");
    const mobileSidebar = rect("[data-testid='workspace-sidebar-mobile']");
    const main = rect("[data-testid='workspace-main']");
    const conversationHeader = rect("[aria-label='Conversation header']");
    const composerFooter = rect("[data-testid='message-composer-footer']");
    const composer = rect("[data-testid='message-composer']");
    const openNav = rect("[aria-label='Open workspace navigation']");
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
      documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      bodyScrollable: document.body.scrollHeight > document.body.clientHeight + 1,
      documentScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
      shell,
      sidebar,
      mobileSidebar,
      main,
      conversationHeader,
      composerFooter,
      composer,
      openNav,
      visibleConversationHeaders: visibleByLabel("[aria-label='Conversation header']", "Conversation header").length,
    };
  });
}

function assertNoDocumentOverflow(metrics: ShellMetrics) {
  expect(metrics.bodyOverflowX, "body must not horizontally overflow").toBe(false);
  expect(metrics.documentOverflowX, "documentElement must not horizontally overflow").toBe(false);
  expect(metrics.bodyScrollable, "body scroll should stay locked to the shell").toBe(false);
  expect(metrics.documentScrollable, "document scroll should stay locked to the shell").toBe(false);
}

function assertRectInsideViewport(rect: Rect | null, viewport: ShellMetrics["viewport"], label: string) {
  expect(rect, `${label} should be visible`).not.toBeNull();
  expect(rect!.left, `${label} left edge`).toBeGreaterThanOrEqual(-1);
  expect(rect!.right, `${label} right edge`).toBeLessThanOrEqual(viewport.width + 1);
  expect(rect!.top, `${label} top edge`).toBeGreaterThanOrEqual(-1);
  expect(rect!.bottom, `${label} bottom edge`).toBeLessThanOrEqual(viewport.height + 1);
}

async function visibleLinkBox(page: Page, name: RegExp) {
  const link = page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("link", { name }).first();
  await expect(link).toBeVisible();
  const box = await link.boundingBox();
  expect(box, `link box should exist for ${name}`).not.toBeNull();
  return box!;
}

async function locatorRect(locator: Locator, label: string): Promise<Rect> {
  await expect(locator, `${label} should be visible`).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `${label} should have a layout box`).not.toBeNull();
  return {
    top: box!.y,
    right: box!.x + box!.width,
    bottom: box!.y + box!.height,
    left: box!.x,
    width: box!.width,
    height: box!.height,
  };
}

test("desktop shell keeps sidebar, header, chat surface, and composer aligned", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupWorkspaceWithUnread(page, context);
  await openMockChannel(page);
  const headerRect = await locatorRect(page.getByRole("navigation", { name: "Conversation header" }), "conversation header");

  const metrics = await shellMetrics(page);
  assertNoDocumentOverflow(metrics);
  expect(metrics.shell).toMatchObject({ left: 0, top: 0 });
  expect(metrics.shell?.right).toBeCloseTo(1440, 1);
  expect(metrics.shell?.bottom).toBeCloseTo(900, 1);
  assertRectInsideViewport(metrics.sidebar, metrics.viewport, "desktop sidebar");
  assertRectInsideViewport(metrics.main, metrics.viewport, "workspace main");
  assertRectInsideViewport(headerRect, metrics.viewport, "conversation header");
  assertRectInsideViewport(metrics.composerFooter, metrics.viewport, "composer footer");
  assertRectInsideViewport(metrics.composer, metrics.viewport, "composer");

  expect(metrics.openNav, "desktop should not show the mobile menu toggle").toBeNull();
  expect(metrics.mobileSidebar, "mobile drawer should not occupy visible space on desktop").toBeNull();
  expect(metrics.visibleConversationHeaders, "only one conversation header should render").toBe(1);
  expect(metrics.sidebar!.width).toBeGreaterThanOrEqual(220);
  expect(metrics.sidebar!.width).toBeLessThanOrEqual(280);
  expect(Math.abs(metrics.sidebar!.right - metrics.main!.left), "main should start where sidebar ends").toBeLessThanOrEqual(1);
  expect(headerRect.left).toBeCloseTo(metrics.main!.left, 1);
  expect(headerRect.top).toBeCloseTo(metrics.main!.top, 1);
  expect(metrics.composerFooter!.left).toBeCloseTo(metrics.main!.left, 1);
  expect(metrics.composerFooter!.bottom).toBeCloseTo(metrics.main!.bottom, 1);
  expect(metrics.composer!.left).toBeGreaterThanOrEqual(metrics.main!.left + 24);
  expect(metrics.composer!.right).toBeLessThanOrEqual(metrics.main!.right - 24);
});

test("sidebar destination pages fill the workspace main column and keep navigation highlight subtle", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const destinations = [
    { path: "/s/demo/inbox", nav: "Inbox", heading: "Inbox" },
    { path: "/s/demo/tasks", nav: "Tasks", heading: "Tasks" },
    { path: "/s/demo/agents", nav: "Agents", heading: "Agents" },
    { path: "/s/demo/people", nav: "People", heading: "People" },
    { path: "/s/demo/channels", nav: "Channels", heading: "Channels" },
  ];

  for (const destination of destinations) {
    await page.goto(destination.path, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: destination.heading })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Workspace navigation" })
        .getByRole("link", { name: "Inbox", exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Workspace navigation" })
        .getByRole("link", { name: destination.nav, exact: true }),
    ).toHaveAttribute("aria-current", "page");

    const metrics = await shellMetrics(page);
    assertNoDocumentOverflow(metrics);
    assertRectInsideViewport(metrics.sidebar, metrics.viewport, "desktop sidebar");
    assertRectInsideViewport(metrics.main, metrics.viewport, "workspace main");
    expect(metrics.sidebar!.width).toBeGreaterThanOrEqual(260);
    expect(metrics.sidebar!.width).toBeLessThanOrEqual(280);

    const pageMetrics = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>("[data-testid='workspace-main']");
      const stage = main?.firstElementChild as HTMLElement | null;
      const root = stage?.firstElementChild as HTMLElement | null;
      const header = main?.querySelector<HTMLElement>("header");
      const active = document.querySelector<HTMLElement>("[data-testid='workspace-sidebar'] [aria-current='page']");
      const activeContent = active?.closest<HTMLElement>(".sidebar__menu-item-content") ?? null;
      const topDestinationLinks = Array.from(document.querySelectorAll<HTMLElement>("[data-testid='workspace-sidebar'] nav a"))
        .filter((el) => ["Inbox", "Tasks", "Agents", "People", "Channels"].includes(el.textContent?.trim() ?? ""))
        .map((el) => {
          const box = el.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, height: box.height };
        });
      const rect = (el: HTMLElement | null) => {
        if (!el) return null;
        const box = el.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          width: box.width,
          height: box.height,
          borderRadius: getComputedStyle(el).borderRadius,
          backgroundColor: getComputedStyle(el).backgroundColor,
          borderLeftWidth: getComputedStyle(el).borderLeftWidth,
          borderRightWidth: getComputedStyle(el).borderRightWidth,
        };
      };
      return {
        main: rect(main),
        root: rect(root),
        header: rect(header),
        active: rect(active),
        activeContent: rect(activeContent),
        topDestinationGaps: topDestinationLinks.slice(1).map((row, index) => row.top - topDestinationLinks[index].bottom),
        legacyWorkspaceToneClassCount: Array.from(main?.querySelectorAll<HTMLElement>("*") ?? [])
          .filter((el) => {
            const className = typeof el.className === "string" ? el.className : "";
            return className.includes("bg-cyan-500/10")
              || className.includes("text-cyan-700")
              || className.includes("dark:text-cyan")
              || className.includes("bg-amber-500/10")
              || className.includes("text-amber-700");
          }).length,
        mainListRowShadows: Array.from(main?.querySelectorAll<HTMLElement>("li") ?? [])
          .map((el) => getComputedStyle(el).boxShadow)
          .filter((shadow) => {
            if (shadow === "none") return false;
            const onlyTransparentZeroLayers = shadow
              .replaceAll("rgba(0, 0, 0, 0) 0px 0px 0px 0px", "")
              .replaceAll(",", "")
              .trim().length === 0;
            return !onlyTransparentZeroLayers;
          }),
      };
    });

    expect(pageMetrics.root?.width, `${destination.path} root should fill main`).toBeCloseTo(pageMetrics.main!.width, 1);
    expect(pageMetrics.header?.left, `${destination.path} header starts at main edge`).toBeCloseTo(pageMetrics.main!.left, 1);
    expect(pageMetrics.header?.right, `${destination.path} header reaches main edge`).toBeCloseTo(pageMetrics.main!.right, 1);
    expect(pageMetrics.legacyWorkspaceToneClassCount, `${destination.path} should use token-driven WorkspacePage surfaces`).toBe(0);
    expect(pageMetrics.topDestinationGaps, `${destination.path} top-level sidebar rows should stay compact`).toEqual([6, 6, 6, 6]);
    expect(pageMetrics.mainListRowShadows, `${destination.path} repeated list rows should not add nested card shadows`).toEqual([]);
    expect(pageMetrics.active?.height, `${destination.nav} active row height`).toBeCloseTo(32, 1);
    expect(pageMetrics.active?.borderRadius, `${destination.nav} active row should not render as a square slab`).not.toBe("0px");
    expect(pageMetrics.active?.borderLeftWidth, `${destination.nav} active row should not use a legacy left rail`).not.toBe("2px");
    expect(pageMetrics.active?.borderLeftWidth, `${destination.nav} active row should be a balanced pill`).toBe(pageMetrics.active?.borderRightWidth);
    expect(pageMetrics.active?.backgroundColor, `${destination.nav} active row should not use the old solid green fill`).not.toBe("rgb(84, 167, 131)");
    expect(pageMetrics.active?.backgroundColor, `${destination.nav} active row should render one visible layer`).not.toBe("rgba(0, 0, 0, 0)");
    expect(pageMetrics.activeContent?.backgroundColor, `${destination.nav} HeroUI wrapper should not add a second active layer`).toBe("rgba(0, 0, 0, 0)");
  }
});

test("settings sections expose every destination and keep the active state in one layer", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const sections = [
    { path: "/s/demo/settings/workspace", nav: "Workspace", heading: "Workspace" },
    { path: "/s/demo/settings/members", nav: "Members & invites", heading: "Members & invites" },
    { path: "/s/demo/settings/agents", nav: "Channels & agents", heading: "Channels & agents" },
    { path: "/s/demo/settings/keys", nav: "Runtimes", heading: "Runtimes" },
    { path: "/s/demo/settings/connectors", nav: "Connectors", heading: "Connectors" },
    { path: "/s/demo/settings/account", nav: "Account", heading: "Account" },
  ];

  for (const section of sections) {
    await page.goto(section.path, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: section.heading })).toBeVisible();

    const settingsNav = page.getByRole("navigation", { name: "Settings sections" });
    await expect(settingsNav.getByRole("link", { name: "Connectors" })).toBeVisible();
    await expect(settingsNav.getByRole("link", { name: section.nav })).toHaveAttribute("aria-current", "page");

    const metrics = await shellMetrics(page);
    assertNoDocumentOverflow(metrics);

    const navMetrics = await page.evaluate(() => {
      const nav = document.querySelector<HTMLElement>("[aria-label='Settings sections']");
      const active = nav?.querySelector<HTMLElement>("[aria-current='page']") ?? null;
      const activeContent = active?.closest<HTMLElement>(".button") ?? active;
      const rect = (el: HTMLElement | null) => {
        if (!el) return null;
        const box = el.getBoundingClientRect();
        return {
          height: box.height,
          borderRadius: getComputedStyle(el).borderRadius,
          backgroundColor: getComputedStyle(el).backgroundColor,
          borderLeftWidth: getComputedStyle(el).borderLeftWidth,
          borderRightWidth: getComputedStyle(el).borderRightWidth,
        };
      };
      return {
        active: rect(active),
        activeContent: rect(activeContent),
        allLinks: Array.from(nav?.querySelectorAll<HTMLElement>("a") ?? []).map((el) => el.textContent?.trim() ?? ""),
      };
    });

    expect(navMetrics.allLinks).toEqual(["Workspace", "Members & invites", "Channels & agents", "Runtimes", "Connectors", "Account"]);
    expect(navMetrics.active?.height, `${section.nav} active row height`).toBeCloseTo(32, 1);
    expect(navMetrics.active?.borderRadius, `${section.nav} active row radius`).not.toBe("0px");
    expect(navMetrics.active?.borderLeftWidth, `${section.nav} active row should not use a legacy left rail`).not.toBe("2px");
    expect(navMetrics.active?.borderLeftWidth, `${section.nav} active row should be a balanced pill`).toBe(navMetrics.active?.borderRightWidth);
    expect(navMetrics.active?.backgroundColor, `${section.nav} active row should render one visible layer`).not.toBe("rgba(0, 0, 0, 0)");
    expect(navMetrics.activeContent?.backgroundColor, `${section.nav} wrapper should be the active layer`).toBe(navMetrics.active?.backgroundColor);
  }
});

test("workspace entity icon frames use semantic token surfaces with readable contrast", async ({ page, context }) => {
  test.skip(!isLocalWebTarget(), "requires the current app bundle; staging E2E runs against the previous deployed build");

  await setupMockWorkspace(page, context);
  await page.route("**/api/v1/connectors", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(json({
      connectors: [
        {
          id: "conn-github",
          kind: "github",
          label: "personal-gh",
          scopes: ["repo", "issues"],
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
        },
      ],
    }));
  });

  const routes = [
    { path: "/s/demo/settings/agents", marker: "onboarding" },
    { path: "/s/demo/settings/connectors", marker: "personal-gh" },
    { path: "/s/demo/channels", marker: "onboarding" },
  ];

  for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(route.marker).first()).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('[data-slot="workspace-icon-frame"]').first()).toBeVisible({ timeout: 10_000 });

      const label = `${route.path} ${viewport.width}px`;
      const samples = await workspaceIconFrameSamples(page);
      expect(samples.length, `${label} icon frames`).toBeGreaterThan(0);
      for (const sample of samples) {
        expect(sample.visible, `${label}: ${sample.label} should be visible`).toBe(true);
        expect(sample.background, `${label}: ${sample.label} should own a visible icon surface`).not.toBe("rgba(0, 0, 0, 0)");
        expect(sample.background, `${label}: ${sample.label} should not use legacy muted block`).not.toBe("rgb(108, 116, 112)");
        expect(sample.color, `${label}: ${sample.label} should not use legacy muted foreground`).not.toBe("rgb(88, 97, 93)");
        expect(sample.contrast, `${label}: ${sample.label} icon contrast`).toBeGreaterThanOrEqual(3);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1);
      expect(overflow, `${label} horizontal overflow`).toBe(false);
    }
  }
});

test("agent markdown inline tokens stay readable in chat messages", async ({ page, context }) => {
  test.skip(
    isPreDeployProductionTarget(),
    "Inline token visual regression checks require the current bundle, not the pre-deploy production bundle.",
  );

  await setupMockWorkspace(page, context);
  await page.route("**/api/v1/channels/dm-agent/messages**", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(json({
      messages: [{
        id: "msg-agent-inline-token",
        channelId: "dm-agent",
        senderId: "agent-cloud",
        senderType: "agent",
        content: "我注意到你提到了 `@cloud-test`，也可以运行 `node -v` 检查环境。\n\n```bash\nnpm test\n```",
        seq: 1,
        threadParentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }],
    }));
  });

  for (const scenario of [
    { label: "light desktop", width: 1024, height: 768, dark: false },
    { label: "dark mobile", width: 390, height: 844, dark: true },
  ]) {
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await openMockDm(page);
    if (scenario.dark) {
      await page.evaluate(() => document.documentElement.classList.add("dark"));
    } else {
      await page.evaluate(() => document.documentElement.classList.remove("dark"));
    }

    await expect(page.getByText(/我注意到你提到了/)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".prose-message pre code")).toContainText("npm test");
    await assertReadableInlineTokens(page.locator(".prose-message"), `chat markdown inline tokens ${scenario.label}`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1 || document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow, `chat markdown inline tokens ${scenario.label} horizontal overflow`).toBe(false);
  }
});

test("members invite success state uses HeroUI alert and terminal command surfaces", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);
  await page.route("**/api/v1/invites", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill(json({
      id: "invite-hero",
      url: "https://raltic.com/invite/invite-hero",
    }));
  });

  await page.goto("/s/demo/settings/members", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Open link/ }).click();

  const alert = page.getByRole("alert").filter({ hasText: "Link copied" });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Share it with whoever should join:");
  await expect(alert.locator("[data-raltic-terminal-command]")).toContainText("https://raltic.com/invite/invite-hero");

  const inviteMetrics = await alert.evaluate((el) => {
    const command = el.querySelector<HTMLElement>("[data-raltic-terminal-command]");
    const alertStyle = getComputedStyle(el as HTMLElement);
    const commandStyle = command ? getComputedStyle(command) : null;
    return {
      alertBackground: alertStyle.backgroundColor,
      commandSlot: command?.getAttribute("data-slot") ?? null,
      commandBackground: commandStyle?.backgroundColor ?? "",
      commandBorder: commandStyle?.borderColor ?? "",
      commandShadow: commandStyle?.boxShadow ?? "",
      hasLegacyEmerald: Array.from(el.querySelectorAll<HTMLElement>("[class]"))
        .some((node) => (node.getAttribute("class") ?? "").includes("emerald")),
      overflowX: document.body.scrollWidth > window.innerWidth + 1
        || document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });

  expect(inviteMetrics.alertBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(inviteMetrics.commandSlot).toBe("card");
  expect(inviteMetrics.commandBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(inviteMetrics.commandBorder).not.toBe("rgba(0, 0, 0, 0)");
  expect(inviteMetrics.commandShadow).not.toBe("none");
  expect(inviteMetrics.hasLegacyEmerald).toBe(false);
  expect(inviteMetrics.overflowX).toBe(false);
});

test("tasks move actions use unambiguous destination labels", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const patches: unknown[] = [];
  await page.route("**/api/v1/tasks**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname === "/api/v1/tasks" && method === "GET") {
      return route.fulfill(json({
        tasks: [{
          id: "task-hero-ui",
          channelId: "ch-onboarding",
          messageId: "msg-task",
          taskNumber: 42,
          title: "Ship HeroUI Pro task buttons",
          status: "todo",
          assigneeId: null,
          assigneeType: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }],
      }));
    }
    if (url.pathname === "/api/v1/tasks/task-hero-ui" && method === "PATCH") {
      patches.push(JSON.parse(route.request().postData() ?? "{}"));
      return route.fulfill(json({ ok: true }));
    }
    return route.fallback();
  });

  await page.goto("/s/demo/tasks", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();

  const taskCard = page.getByTestId("task-card").filter({ hasText: "Ship HeroUI Pro task buttons" });
  await expect(taskCard).toBeVisible();
  await expect(taskCard.getByRole("button", { name: "In progress" })).toBeVisible();
  await expect(taskCard.getByRole("button", { name: "In review" })).toBeVisible();
  await expect(taskCard.getByRole("button", { name: "Done" })).toBeVisible();
  await expect(taskCard.getByRole("button", { name: "In", exact: true })).toHaveCount(0);

  await taskCard.getByRole("button", { name: "In review" }).click();
  await expect.poll(() => patches.length).toBe(1);
  expect(patches[0]).toMatchObject({ status: "in_review" });
});

test("account settings change password validates locally and posts the revocation choice", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const passwordBodies: unknown[] = [];
  await page.route("**/api/auth/change-password", async (route) => {
    passwordBodies.push(JSON.parse(route.request().postData() ?? "{}"));
    return route.fulfill(json({
      token: "new-session-token",
      user: {
        id: "u1",
        name: "Gene",
        email: "dai@live.cn",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  });

  await page.goto("/s/demo/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Change the password used for email sign-in. Workspace bridge keys are not affected.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Send a reset email" })).toHaveAttribute("href", "/forgot-password?email=dai%40live.cn");

  const currentPassword = page.getByLabel("Current password");
  const newPassword = page.getByLabel("New password", { exact: true });
  const confirmPassword = page.getByLabel("Confirm new password");
  await expect(currentPassword).toHaveAttribute("name", "current-password");
  await expect(newPassword).toHaveAttribute("name", "new-password");
  await expect(confirmPassword).toHaveAttribute("name", "confirm-new-password");

  await currentPassword.fill("old-password");
  await newPassword.fill("old-password");
  await confirmPassword.fill("old-password");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("New password must be different from your current password.")).toBeVisible();
  await expect(newPassword).toBeFocused();
  await expect(newPassword).toHaveAttribute("aria-invalid", "true");
  expect(passwordBodies, "reusing the current password should not call the auth endpoint").toEqual([]);

  await newPassword.fill("new-password-123");
  await confirmPassword.fill("new-password-321");
  await expect(page.getByLabel("Sign out other sessions")).toBeChecked();

  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("New passwords don't match.")).toBeVisible();
  await expect(confirmPassword).toBeFocused();
  await expect(confirmPassword).toHaveAttribute("aria-invalid", "true");
  expect(passwordBodies, "mismatched confirmation should not call the auth endpoint").toEqual([]);

  await confirmPassword.fill("new-password-123");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect.poll(() => passwordBodies.length).toBe(1);
  expect(passwordBodies[0]).toMatchObject({
    currentPassword: "old-password",
    newPassword: "new-password-123",
    revokeOtherSessions: true,
  });
  await expect(page.getByText("Password updated. Other sessions were signed out.")).toBeVisible();
  await expect(currentPassword).toHaveValue("");
  await expect(newPassword).toHaveValue("");
  await expect(confirmPassword).toHaveValue("");
});

test("account settings maps auth password errors and can keep other sessions active", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const passwordBodies: unknown[] = [];
  await page.route("**/api/auth/change-password", async (route) => {
    passwordBodies.push(JSON.parse(route.request().postData() ?? "{}"));
    if (passwordBodies.length === 1) {
      return route.fulfill(json({
        code: "INVALID_PASSWORD",
        message: "Invalid password",
      }, 400));
    }
    return route.fulfill(json({
      token: null,
      user: {
        id: "u1",
        name: "Gene",
        email: "dai@live.cn",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));
  });

  await page.goto("/s/demo/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Current password").fill("wrong-password");
  await page.getByLabel("New password", { exact: true }).fill("new-password-123");
  await page.getByLabel("Confirm new password").fill("new-password-123");

  const revokeOtherSessions = page.getByLabel("Sign out other sessions");
  await expect(revokeOtherSessions).toBeChecked();
  await page.locator("[data-slot='checkbox']").filter({ hasText: "Sign out other sessions" }).click();
  await expect(revokeOtherSessions).not.toBeChecked();

  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Current password is incorrect.")).toBeVisible();
  await expect(page.getByLabel("Current password")).toBeFocused();
  await expect(page.getByLabel("Current password")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Current password")).toHaveValue("wrong-password");
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue("new-password-123");
  expect(passwordBodies[0]).toMatchObject({
    currentPassword: "wrong-password",
    newPassword: "new-password-123",
    revokeOtherSessions: false,
  });

  await page.getByLabel("Current password").fill("correct-password");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect.poll(() => passwordBodies.length).toBe(2);
  expect(passwordBodies[1]).toMatchObject({
    currentPassword: "correct-password",
    newPassword: "new-password-123",
    revokeOtherSessions: false,
  });
  await expect(page.getByText("Password updated. Other sessions stayed active.")).toBeVisible();
  await expect(page.getByLabel("Current password")).toHaveValue("");
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Confirm new password")).toHaveValue("");
});

test("account settings sends passwordless users to the reset fallback", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const passwordBodies: unknown[] = [];
  await page.route("**/api/auth/change-password", async (route) => {
    passwordBodies.push(JSON.parse(route.request().postData() ?? "{}"));
    return route.fulfill(json({
      code: "CREDENTIAL_ACCOUNT_NOT_FOUND",
      message: "Credential account not found",
    }, 400));
  });

  await page.goto("/s/demo/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("account-password-card")).toBeVisible();

  await page.getByLabel("Current password").fill("oauth-password");
  await page.getByLabel("New password", { exact: true }).fill("new-password-123");
  await page.getByLabel("Confirm new password").fill("new-password-123");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect.poll(() => passwordBodies.length).toBe(1);
  expect(passwordBodies[0]).toMatchObject({
    currentPassword: "oauth-password",
    newPassword: "new-password-123",
    revokeOtherSessions: true,
  });
  await expect(page.getByText("This account does not have a password yet. Send a reset email to create one.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Send a reset email" })).toHaveAttribute("href", "/forgot-password?email=dai%40live.cn");
  await expect(page.getByLabel("Current password")).toHaveValue("oauth-password");
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue("new-password-123");
  await expect(page.getByLabel("Confirm new password")).toHaveValue("new-password-123");
});

test("account settings explains stale sensitive sessions without clearing entered passwords", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  const passwordBodies: unknown[] = [];
  await page.route("**/api/auth/change-password", async (route) => {
    passwordBodies.push(JSON.parse(route.request().postData() ?? "{}"));
    return route.fulfill(json({
      code: "SESSION_NOT_FRESH",
      message: "Session is not fresh",
    }, 403));
  });

  await page.goto("/s/demo/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("Current password").fill("old-password");
  await page.getByLabel("New password", { exact: true }).fill("new-password-123");
  await page.getByLabel("Confirm new password").fill("new-password-123");
  await page.getByRole("button", { name: "Update password" }).click();

  await expect.poll(() => passwordBodies.length).toBe(1);
  await expect(page.getByText("For security, confirm your sign-in before changing your password.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in again" })).toHaveAttribute("href", "/login?next=%2Fs%2Fdemo%2Fsettings%2Faccount");
  await expect(page.getByLabel("Current password")).toHaveValue("old-password");
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue("new-password-123");
  await expect(page.getByLabel("Confirm new password")).toHaveValue("new-password-123");
});

test("account default workspace radio uses one HeroUI selected surface", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  await page.goto("/s/demo/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });

  const radio = page.getByRole("radio", { name: /Gene's Workspace/ });
  await expect(radio).toBeChecked();

  const metrics = await radio.evaluate((el) => {
    const root = el.closest<HTMLElement>('[data-slot="radio"]');
    if (!root) return null;
    const style = getComputedStyle(root);
    const className = typeof root.className === "string" ? root.className : "";
    const surfaceChildren = Array.from(root.children).filter((child) => {
      const childStyle = getComputedStyle(child);
      return childStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && childStyle.backgroundColor !== "transparent";
    });
    return {
      background: style.backgroundColor,
      borderColor: style.borderColor,
      className,
      surfaceChildCount: surfaceChildren.length,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics!.className).not.toContain("border-cyan");
  expect(metrics!.className).not.toContain("bg-cyan");
  expect(metrics!.background, "selected radio root should own the visible selected surface").not.toBe("rgba(0, 0, 0, 0)");
  expect(metrics!.borderColor, "selected radio root should own the selected border").not.toBe("rgba(0, 0, 0, 0)");
  expect(metrics!.surfaceChildCount, "selected radio should not nest a second selected surface").toBeLessThanOrEqual(1);
});

test("mobile account password controls stay readable without horizontal drift", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);

  await page.goto("/s/demo/settings/account", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Change the password used for email sign-in. Workspace bridge keys are not affected.")).toBeVisible();
  await expect(page.getByLabel("Current password")).toBeVisible();
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm new password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Update password" })).toBeVisible();

  const metrics = await shellMetrics(page);
  assertNoDocumentOverflow(metrics);

  const formMetrics = await page.evaluate(() => {
    const rect = (el: Element | null) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width };
    };
    const inputs = [
      "account-current-password",
      "account-new-password",
      "account-confirm-password",
    ].map((id) => rect(document.getElementById(id)));
    const button = rect(Array.from(document.querySelectorAll("button")).find((el) => el.textContent?.includes("Update password")) ?? null);
    return { viewportWidth: window.innerWidth, inputs, button };
  });

  for (const [index, input] of formMetrics.inputs.entries()) {
    expect(input, `password input ${index + 1} should render`).not.toBeNull();
    expect(input!.left, `password input ${index + 1} left edge`).toBeGreaterThanOrEqual(0);
    expect(input!.right, `password input ${index + 1} right edge`).toBeLessThanOrEqual(formMetrics.viewportWidth);
    expect(input!.width, `password input ${index + 1} mobile width`).toBeGreaterThan(240);
  }
  expect(formMetrics.button, "password submit button should render").not.toBeNull();
  expect(formMetrics.button!.left, "password submit button left edge").toBeGreaterThanOrEqual(0);
  expect(formMetrics.button!.right, "password submit button right edge").toBeLessThanOrEqual(formMetrics.viewportWidth);
});

test("workspace URL field keeps the prefix readable and aligned with the form", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  await page.goto("/s/demo/settings/workspace", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByLabel("URL")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const slugInput = document.querySelector<HTMLInputElement>("#workspace-slug");
    const urlField = slugInput?.parentElement as HTMLElement | null;
    const prefix = urlField?.querySelector<HTMLElement>("span") ?? null;
    const form = slugInput?.closest("form") as HTMLElement | null;
    const rect = (el: HTMLElement | null) => {
      if (!el) return null;
      const box = el.getBoundingClientRect();
      return { width: box.width, height: box.height };
    };
    const style = (el: HTMLElement | null) => el ? getComputedStyle(el) : null;

    return {
      form: rect(form),
      urlField: rect(urlField),
      prefix: rect(prefix),
      input: rect(slugInput),
      prefixColor: style(prefix)?.color ?? null,
      prefixBackground: style(prefix)?.backgroundColor ?? null,
      mutedToken: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim(),
    };
  });

  const prefixForeground = parseRgb(metrics.prefixColor);
  const prefixBackground = parseRgb(metrics.prefixBackground);
  const mutedToken = parseRgb(metrics.mutedToken);

  expect(metrics.form).not.toBeNull();
  expect(metrics.urlField).not.toBeNull();
  expect(metrics.prefix).not.toBeNull();
  expect(metrics.input).not.toBeNull();
  expect(metrics.urlField!.width, "URL input should align to the full form width").toBeGreaterThan(metrics.form!.width * 0.9);
  expect(metrics.prefix!.height, "prefix and input heights should align").toBeCloseTo(metrics.input!.height, 1);
  expect(prefixBackground, "prefix should not reuse the dark muted text token as its background").not.toEqual(mutedToken);
  expect(prefixForeground && prefixBackground ? contrast(prefixForeground, prefixBackground) : 0, "prefix contrast").toBeGreaterThanOrEqual(4.5);
});

test("workspace settings danger copy remains readable on gray and soft-danger panels", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);

  await page.goto("/s/demo/settings/workspace", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Workspace" })).toBeVisible();
  await expect(page.getByText("Danger zone", { exact: true })).toBeVisible();
  await expect(page.getByText("Delete workspace", { exact: true })).toBeVisible();
  await assertVisibleDangerTextReadable(page, "light mode workspace settings");

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await assertVisibleDangerTextReadable(page, "dark mode workspace settings");
});

test("mobile settings navigation keeps every destination visible without horizontal drift", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);

  await page.goto("/s/demo/settings/workspace", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  const settingsNav = page.getByRole("navigation", { name: "Settings sections" });

  for (const label of ["Workspace", "Members & invites", "Channels & agents", "Runtimes", "Connectors", "Account"]) {
    await expect(settingsNav.getByRole("link", { name: label })).toBeVisible();
  }

  const metrics = await settingsNav.evaluate((nav) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const linkRects = Array.from(nav.querySelectorAll<HTMLElement>("a")).map((link) => {
      const box = link.getBoundingClientRect();
      return {
        text: link.textContent?.trim() ?? "",
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      };
    });
    return {
      bodyOverflowX: document.body.scrollWidth > viewport.width + 1,
      documentOverflowX: document.documentElement.scrollWidth > viewport.width + 1,
      linkRects,
      viewport,
    };
  });

  expect(metrics.bodyOverflowX).toBe(false);
  expect(metrics.documentOverflowX).toBe(false);
  for (const rect of metrics.linkRects) {
    expect(rect.left, `${rect.text} left edge`).toBeGreaterThanOrEqual(0);
    expect(rect.right, `${rect.text} right edge`).toBeLessThanOrEqual(metrics.viewport.width);
  }
});

test("agent detail page stays in the workspace shell on desktop and mobile", async ({ page, context }) => {
  await setupMockWorkspace(page, context);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    pageErrors.length = 0;

    await page.goto("/s/demo/agents/agent-cloud", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Cloud Test Agent" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "This page hit an error" })).toHaveCount(0);

    const tabMetrics = await page.getByRole("tablist", { name: "Agent sections" }).evaluate((tablist) => {
      const viewport = { width: window.innerWidth };
      return Array.from(tablist.querySelectorAll<HTMLElement>("[role='tab']")).map((tab) => {
        const box = tab.getBoundingClientRect();
        return {
          text: tab.textContent?.trim() ?? "",
          left: box.left,
          right: box.right,
          className: tab.getAttribute("class") ?? "",
          backgroundColor: getComputedStyle(tab).backgroundColor,
          borderBottomWidth: getComputedStyle(tab).borderBottomWidth,
          borderTopWidth: getComputedStyle(tab).borderTopWidth,
          selected: tab.getAttribute("aria-selected") === "true",
          viewport,
        };
      });
    });
    for (const tab of tabMetrics) {
      expect(tab.left, `${tab.text} tab left edge`).toBeGreaterThanOrEqual(0);
      expect(tab.right, `${tab.text} tab right edge`).toBeLessThanOrEqual(tab.viewport.width);
      expect(tab.className, `${tab.text} tab should not use legacy cyan border`).not.toContain("border-cyan");
      expect(tab.className, `${tab.text} tab should not use legacy cyan text`).not.toContain("text-cyan");
      expect(tab.className, `${tab.text} tab should not use underline tabs`).not.toContain("border-b-2");
      if (tab.selected) {
        expect(tab.backgroundColor, `${tab.text} selected tab should own a visible soft surface`).not.toBe("rgba(0, 0, 0, 0)");
        expect(tab.borderBottomWidth, `${tab.text} selected tab should not rely on a thicker underline`).toBe(tab.borderTopWidth);
      }
    }

    const metrics = await shellMetrics(page);
    assertNoDocumentOverflow(metrics);
    assertRectInsideViewport(metrics.main, metrics.viewport, "agent detail main");
    if (viewport.width >= 768) {
      assertRectInsideViewport(metrics.sidebar, metrics.viewport, "agent detail desktop sidebar");
    } else {
      expect(metrics.sidebar, "agent detail desktop sidebar stays hidden on mobile").toBeNull();
      assertRectInsideViewport(metrics.openNav, metrics.viewport, "agent detail mobile menu toggle");
    }
    expect(pageErrors).toEqual([]);
  }
});

test("user account menu opens from the agents page without crashing the workspace", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/s/demo/agents", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();

  await page.getByTestId("user-pill-trigger").click();
  await expect(page.getByRole("menuitem", { name: "Account settings" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Workspace settings" })).toBeVisible();
  await expect(page.getByText("Switch workspace", { exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
  expect(pageErrors, "opening the account menu should not raise client runtime errors").toEqual([]);
});

test("workspace controls live in the settings menu instead of the sidebar brand header", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/s/demo/agents", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Raltic workspace home" })).toBeVisible();
  await expect(page.getByTestId("workspace-switcher-trigger")).toHaveCount(0);

  await page.getByTestId("user-pill-trigger").click();
  const menu = page.getByRole("menu");
  await expect(menu.getByText("Current workspace", { exact: true })).toBeVisible();
  await expect(menu.getByText("Gene's Workspace", { exact: true })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Workspace settings" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Members & invites" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Browse channels" })).toBeVisible();
  await expect(menu.getByText("Switch workspace", { exact: true })).toBeVisible();
  await expect(menu.getByText("No other workspaces.", { exact: true })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeVisible();

  const currentWorkspaceMetrics = await menu.getByText("Gene's Workspace", { exact: true }).evaluate((el) => {
    const row = el.closest<HTMLElement>("[role='menuitem']");
    if (!row) return null;
    const style = getComputedStyle(row);
    return {
      background: style.backgroundColor,
      color: style.color,
      className: row.getAttribute("class") ?? "",
    };
  });
  expect(currentWorkspaceMetrics, "current workspace menu row should exist").not.toBeNull();
  expect(currentWorkspaceMetrics!.background, "current workspace should render a visible token surface").not.toBe("rgba(0, 0, 0, 0)");
  expect(currentWorkspaceMetrics!.className, "workspace switcher should not use page-level cyan active background").not.toContain("bg-cyan");
  expect(currentWorkspaceMetrics!.className, "workspace switcher should not use page-level cyan text").not.toContain("text-cyan");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
  expect(pageErrors, "opening the settings workspace controls should not raise client runtime errors").toEqual([]);
});

test("mobile drawer closes after channel and DM navigation without covering the next page", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupWorkspaceWithUnread(page, context);
  await openMockChannel(page);

  const openNav = page.getByRole("button", { name: "Open workspace navigation" });
  await expect(openNav).toBeVisible();
  await openNav.click();

  const mobileSidebar = page.getByTestId("workspace-sidebar-mobile");
  await expect(mobileSidebar).toBeVisible();
  await mobileSidebar.getByRole("link", { name: /research/i }).click();
  await expect(page).toHaveURL(/\/s\/demo\/channel\/ch-research$/);
  await expect(mobileSidebar).toBeHidden();
  await expect(page.getByRole("heading", { name: "research" })).toBeVisible();

  let metrics = await shellMetrics(page);
  assertNoDocumentOverflow(metrics);
  expect(metrics.sidebar, "desktop sidebar should stay hidden on mobile").toBeNull();
  assertRectInsideViewport(metrics.openNav, metrics.viewport, "mobile menu toggle");
  assertRectInsideViewport(metrics.conversationHeader, metrics.viewport, "mobile conversation header");
  assertRectInsideViewport(metrics.composerFooter, metrics.viewport, "mobile composer footer");
  expect(metrics.visibleConversationHeaders).toBe(1);

  await page.getByRole("button", { name: "Channel actions" }).click();
  await expect(page.getByRole("menuitem", { name: "Members" })).toBeVisible();
  await page.keyboard.press("Escape");

  await openNav.click();
  await expect(mobileSidebar).toBeVisible();
  await mobileSidebar.getByRole("link", { name: /Cloud Test Agent/i }).click();
  await expect(page).toHaveURL(/\/s\/demo\/dm\/dm-agent$/);
  await expect(mobileSidebar).toBeHidden();
  await expect(page.getByRole("heading", { name: "Cloud Test Agent" })).toBeVisible();

  metrics = await shellMetrics(page);
  assertNoDocumentOverflow(metrics);
  expect(metrics.mobileSidebar, "closed drawer should not retain a visible hit area").toBeNull();
  await page.getByRole("textbox", { name: /Message Cloud Test Agent/ }).click();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
});

test("cloud agent workspace pane uses HeroUI Pro side panel surfaces", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setupMockWorkspace(page, context);
  await openMockDm(page);

  const pane = page.getByTestId("workspace-pane");
  await expect(pane).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cloud Test Agent" })).toBeVisible();
  await expect(pane.getByRole("tab", { name: "Files" })).toHaveAttribute("aria-selected", "true");
  await expect(pane.getByRole("tab", { name: "Memory" })).toBeVisible();
  await expect(pane.getByRole("button", { name: "File README.md" })).toBeVisible();

  const paneMetrics = await pane.evaluate((el) => {
    const selectedTab = el.querySelector<HTMLElement>("[role='tab'][aria-selected='true']");
    const headerIcon = el.querySelector<HTMLElement>("header span");
    const selectedStyle = selectedTab ? getComputedStyle(selectedTab) : null;
    const iconStyle = headerIcon ? getComputedStyle(headerIcon) : null;
    return {
      className: el.getAttribute("class") ?? "",
      background: getComputedStyle(el).backgroundColor,
      selectedTabBackground: selectedStyle?.backgroundColor ?? "",
      headerIconBackground: iconStyle?.backgroundColor ?? "",
      hasLegacyTimesClose: el.textContent?.includes("×") ?? false,
      overflowX: document.body.scrollWidth > window.innerWidth + 1
        || document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });

  expect(paneMetrics.className).not.toContain("bg-muted/20");
  expect(paneMetrics.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(paneMetrics.selectedTabBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(paneMetrics.headerIconBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(paneMetrics.hasLegacyTimesClose).toBe(false);
  expect(paneMetrics.overflowX).toBe(false);

  await pane.getByRole("button", { name: "File README.md" }).click();
  const closePreview = pane.getByRole("button", { name: "Close file preview" });
  await expect(closePreview).toBeVisible();
  await expect(closePreview.locator("svg")).toBeVisible();
  await expect(pane.locator("pre", { hasText: "Cloud workspace" })).toBeVisible();
  const terminalPreview = pane.locator("[data-raltic-terminal-preview]");
  await expect(terminalPreview).toContainText("ready");
  const terminalMetrics = await terminalPreview.evaluate((el) => {
    const styles = getComputedStyle(el as HTMLElement);
    return {
      slot: (el as HTMLElement).getAttribute("data-slot"),
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor,
      boxShadow: styles.boxShadow,
    };
  });
  expect(terminalMetrics.slot).toBe("card");
  expect(terminalMetrics.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(terminalMetrics.borderColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(terminalMetrics.boxShadow).not.toBe("none");
});

for (const width of [768, 769]) {
  test(`breakpoint ${width}px renders exactly one navigation mode and no duplicate chat header`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 844 });
    await setupWorkspaceWithUnread(page, context);
    await openMockChannel(page);
    const headerRect = await locatorRect(page.getByRole("navigation", { name: "Conversation header" }), "conversation header");

    const metrics = await shellMetrics(page);
    assertNoDocumentOverflow(metrics);
    assertRectInsideViewport(metrics.main, metrics.viewport, "workspace main");
    assertRectInsideViewport(headerRect, metrics.viewport, "conversation header");
    assertRectInsideViewport(metrics.composerFooter, metrics.viewport, "composer footer");
    expect(metrics.visibleConversationHeaders).toBe(1);
    expect(Boolean(metrics.sidebar) !== Boolean(metrics.openNav), "desktop sidebar and mobile navbar toggle should not be visible together").toBe(true);

    if (metrics.sidebar) {
      expect(metrics.mobileSidebar, "mobile drawer should not leave a blank visible rail at desktop breakpoint").toBeNull();
      expect(Math.abs(metrics.sidebar.right - metrics.main!.left), "main should stay flush with desktop sidebar").toBeLessThanOrEqual(1);
    } else {
      assertRectInsideViewport(metrics.openNav, metrics.viewport, "mobile menu toggle");
      expect(metrics.main!.left).toBeGreaterThanOrEqual(0);
      expect(headerRect.top).toBeGreaterThanOrEqual(48);
      expect(headerRect.top).toBeLessThanOrEqual(52);
    }
  });
}

test("active channel, unread count, online status, and runtime badge do not shift shell layout", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await setupWorkspaceWithUnread(page, context);
  await openMockChannel(page);

  const onboarding = page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("link", { name: /onboarding/i }).first();
  const research = page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("link", { name: /research/i }).first();
  const userPill = page.getByTestId("user-pill-trigger");
  const onlineBadge = userPill.getByText("Online", { exact: true });
  await expect(onboarding).toHaveAttribute("aria-current", "page");
  await expect(research.getByText("3", { exact: true }), "seeded unread badge should render").toBeVisible();
  await expect(onlineBadge, "user online badge should render").toBeVisible();
  await expect(page.getByLabel("Runtime: Claude")).toBeVisible();

  const initialMetrics = await shellMetrics(page);
  const onboardingBox = await visibleLinkBox(page, /onboarding/i);
  const researchBox = await visibleLinkBox(page, /research/i);
  expect(researchBox.height).toBeCloseTo(onboardingBox.height, 1);

  await research.click();
  await expect(page).toHaveURL(/\/s\/demo\/channel\/ch-research$/);
  await expect(research).toHaveAttribute("aria-current", "page");
  await expect(onlineBadge, "user online badge should survive channel navigation").toBeVisible();

  const afterChannelChange = await shellMetrics(page);
  assertNoDocumentOverflow(afterChannelChange);
  expect(afterChannelChange.sidebar!.width).toBeCloseTo(initialMetrics.sidebar!.width, 1);
  expect(afterChannelChange.main!.left).toBeCloseTo(initialMetrics.main!.left, 1);
  expect(afterChannelChange.composerFooter!.bottom).toBeCloseTo(initialMetrics.composerFooter!.bottom, 1);

  const dm = page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("link", { name: /Cloud Test Agent/i }).first();
  await dm.click();
  await expect(page).toHaveURL(/\/s\/demo\/dm\/dm-agent$/);
  await expect(page.getByRole("heading", { name: "Cloud Test Agent" })).toBeVisible();
  await expect(page.getByLabel("Runtime: Claude")).toBeVisible();

  const afterDmChange = await shellMetrics(page);
  assertNoDocumentOverflow(afterDmChange);
  expect(afterDmChange.sidebar!.width).toBeCloseTo(initialMetrics.sidebar!.width, 1);
  expect(afterDmChange.main!.left).toBeCloseTo(initialMetrics.main!.left, 1);
  expect(afterDmChange.composerFooter!.bottom).toBeCloseTo(initialMetrics.composerFooter!.bottom, 1);
});
