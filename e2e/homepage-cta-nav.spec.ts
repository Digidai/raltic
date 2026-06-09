import { test, expect, type Page } from "@playwright/test";
import { setupMockWorkspace } from "./helpers/heroui-workspace";

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const MINIMUM_FOOTER_PATHS = [
  "/runtimes",
  "/connectors",
  "/security",
  "/indie",
  "/teams",
  "/privacy",
  "/terms",
  "/signup",
  "/login",
];

function hero(page: Page) {
  return page.locator("section").first();
}

function topNav(page: Page) {
  return page.getByRole("navigation").first();
}

function parseColor(value: string): Rgb {
  const rgbMatch = value.match(/rgba?\(([^)]+)\)/);
  if (rgbMatch) {
    const channels = rgbMatch[1].split(",").slice(0, 3).map((part) => Number.parseFloat(part.trim()));
    if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
      throw new Error(`Unsupported color value: ${value}`);
    }
    const [r, g, b] = channels as [number, number, number];
    return { r, g, b };
  }

  const labMatch = value.match(/lab\(([^)]+)\)/);
  if (labMatch) {
    const channels = labMatch[1].split("/")[0].trim().split(/\s+/).slice(0, 3).map(Number);
    if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
      throw new Error(`Unsupported color value: ${value}`);
    }
    const [l, a, b] = channels as [number, number, number];
    return labToSrgb(l, a, b);
  }

  throw new Error(`Unsupported color value: ${value}`);
}

function labToSrgb(l: number, a: number, b: number): Rgb {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const epsilon = 216 / 24389;
  const kappa = 24389 / 27;
  const invert = (value: number) => {
    const cubed = value ** 3;
    return cubed > epsilon ? cubed : (116 * value - 16) / kappa;
  };
  const x50 = 0.96422 * invert(fx);
  const y50 = invert(fy);
  const z50 = 0.82521 * invert(fz);

  const x = 0.9554734 * x50 - 0.0230985 * y50 + 0.0632593 * z50;
  const y = -0.0283697 * x50 + 1.0099956 * y50 + 0.0210414 * z50;
  const z = 0.012314 * x50 - 0.0205077 * y50 + 1.3303659 * z50;

  const toGamma = (channel: number) => {
    const clamped = Math.min(1, Math.max(0, channel));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return {
    r: toGamma(3.2404542 * x - 1.5371385 * y - 0.4985314 * z) * 255,
    g: toGamma(-0.969266 * x + 1.8760108 * y + 0.041556 * z) * 255,
    b: toGamma(0.0556434 * x - 0.2040259 * y + 1.0572252 * z) * 255,
  };
}

function relativeLuminance({ r, g, b }: Rgb) {
  const [red, green, blue] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const fg = relativeLuminance(parseColor(foreground));
  const bg = relativeLuminance(parseColor(background));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

async function expectPathname(page: Page, pathname: string) {
  await expect.poll(() => new URL(page.url()).pathname).toBe(pathname);
}

async function expectPathAndSearch(page: Page, pathname: string, search: string) {
  await expect.poll(() => {
    const url = new URL(page.url());
    return `${url.pathname}${url.search}`;
  }).toBe(`${pathname}${search}`);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
    documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    viewportWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));

  expect(metrics.bodyOverflowX, `${label}: body ${metrics.bodyScrollWidth}px vs viewport ${metrics.viewportWidth}px`).toBe(false);
  expect(metrics.documentOverflowX, `${label}: html ${metrics.documentScrollWidth}px vs viewport ${metrics.viewportWidth}px`).toBe(false);
}

test.describe("homepage CTAs", () => {
  test("marketing endpoint accepts workspace PLG funnel events", async ({ request }) => {
    for (const event of ["workflow_starter_match_selected", "workflow_starter_runtime_gate_opened", "workflow_room_opened"]) {
      const res = await request.post("/api/marketing/event", {
        data: {
          event,
          path: "/s/demo",
          target: "launch-readiness",
          referrer: null,
          ts: Date.now(),
        },
      });
      expect(res.status(), event).toBe(204);
    }
  });

  test("anonymous hero CTA points at the first-value signup flow", async ({ page }) => {
    await page.goto("/");

    const primaryCta = hero(page).getByRole("link", { name: /^Start in 3 minutes$/ });
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/signup");
    await expect(hero(page).getByRole("status", { name: "Loading" })).toHaveCount(0);
    await expect(hero(page).getByRole("link", { name: /^Connect a local runtime$/ })).toHaveCount(0);

    const primaryStyles = await primaryCta.evaluate((element) => {
      const styles = window.getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        text: element.textContent?.trim() ?? "",
      };
    });
    expect(primaryStyles.text).toContain("Start in 3 minutes");
    expect(contrastRatio(primaryStyles.color, primaryStyles.backgroundColor)).toBeGreaterThanOrEqual(4.5);

    await page.evaluate(() => {
      Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
    });
    const ctaRequest = page.waitForRequest((request) =>
      request.method() === "POST"
      && new URL(request.url()).pathname === "/api/marketing/event"
      && (request.postData() ?? "").includes('"event":"cta_click"')
      && (request.postData() ?? "").includes('"target":"home_first_value"'),
    );
    await primaryCta.click();
    const request = await ctaRequest;
    expect(request.postData()).toContain('"path":"/"');
    await expectPathname(page, "/signup");
  });

  test("runtime path CTA still navigates to the bridge wizard", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /^Connect a local runtime$/ }).first().click();
    await expectPathAndSearch(page, "/signup", "?intent=connect-runtime");
    await expect(page.getByRole("link", { name: /^Sign in$/ })).toHaveAttribute("href", "/login?intent=connect-runtime");
  });

  test("auth pages preserve runtime intent and ignore it for desktop next paths", async ({ page }) => {
    await page.goto("/signup?wizard=1");
    await expect(page.getByText("Create your account, then connect this computer's runtime")).toBeVisible();
    await expect(page.getByRole("link", { name: /^Sign in$/ })).toHaveAttribute("href", "/login?intent=connect-runtime");

    await page.goto("/login?intent=connect-runtime");
    await expect(page.getByRole("link", { name: /^Sign up$/ })).toHaveAttribute("href", "/signup?intent=connect-runtime");

    await page.goto("/verify-email?error=TOKEN_EXPIRED&intent=connect-runtime&email=dai%40live.cn");
    await expect(page.getByRole("link", { name: /^Sign in$/ })).toHaveAttribute("href", "/login?intent=connect-runtime");

    await page.goto("/login?client=desktop&next=%2Fdesktop%2Flaunch&intent=connect-runtime");
    await expect(page.getByRole("link", { name: /^Sign up$/ })).toHaveAttribute("href", "/signup?client=desktop&next=%2Fdesktop%2Flaunch");
    await expect(page.getByText(/connect this computer to your workspace/i)).toBeVisible();
  });

  test("signed-in runtime intent opens the personal workspace setup wizard", async ({ page, context }) => {
    await setupMockWorkspace(page, context, { hasConnectedBridge: false });

    await page.goto("/?intent=connect-runtime", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/s\/demo\?wizard=1$/);
    await expect(page.getByRole("dialog", { name: /Connect a local runtime/ })).toBeVisible();
  });
});

test.describe("homepage top navigation", () => {
  for (const { name, path } of [
    { name: "Runtimes", path: "/runtimes" },
    { name: "Connectors", path: "/connectors" },
    { name: "Security", path: "/security" },
    { name: "Sign in", path: "/login" },
    // Top-nav primary kept as generic "Get started" for compactness
    // even though the hero primary uses the more specific
    // "Start in 3 minutes" copy. (Keeps the nav from getting too wide.)
    { name: "Get started", path: "/signup" },
  ]) {
    test(`${name} link navigates to ${path}`, async ({ page }) => {
      await page.goto("/");

      await topNav(page).getByRole("link", { name: new RegExp(`^${name}$`) }).click();
      await expectPathname(page, path);
    });
  }

  test("mobile navigation exposes product, audience, auth, and signup links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "Open marketing navigation" });
    await expect(menuButton).toBeVisible();
    await expect(page.getByRole("link", { name: /^Start$/ })).toHaveAttribute("href", "/signup");

    await menuButton.click();
    const menu = page.locator("[data-slot=\"dropdown-menu\"]");
    await expect(menu).toBeVisible();

    for (const label of [
      "Runtimes",
      "Connectors",
      "Desktop beta",
      "Security",
      "For indie devs",
      "For teams",
      "Sign in",
      "Get started",
    ]) {
      await expect(menu.getByRole("menuitem", { name: new RegExp(label) })).toBeVisible();
    }
    await expect(menu.getByText("Waitlist")).toBeVisible();
    await expectNoHorizontalOverflow(page, "homepage mobile marketing navigation");

    await menu.getByRole("menuitem", { name: /Sign in/ }).click();
    await expectPathname(page, "/login");
  });
});

test.describe("homepage ForDropdown audience menu", () => {
  test("opens, navigates to audience pages, and closes on outside click", async ({ page }) => {
    await page.goto("/");

    await topNav(page).getByRole("button", { name: /^For$/ }).click();
    const menu = page.locator("[data-slot=\"dropdown-menu\"]");
    await expect(menu).toBeVisible();
    const popover = menu.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' dropdown__popover ')]");
    await expect.poll(async () => popover.evaluate((element) => Number(window.getComputedStyle(element).opacity))).toBeGreaterThanOrEqual(0.99);

    const indieItem = menu.locator("[data-slot=\"menu-item\"]", { hasText: /Indie devs/ });
    const teamsItem = menu.locator("[data-slot=\"menu-item\"]", { hasText: /Teams/ });
    await expect(indieItem).toBeVisible();
    await expect(teamsItem).toBeVisible();
    await expect(teamsItem.getByText("Waitlist")).toBeVisible();

    const menuBackground = await popover.evaluate((element) => window.getComputedStyle(element).backgroundColor);
    const indieTitleColor = await indieItem.getByText("Indie devs").evaluate((element) => window.getComputedStyle(element).color);
    const indieMetaColor = await indieItem.getByText("Solo dev / AI tinkerer").evaluate((element) => window.getComputedStyle(element).color);
    expect(contrastRatio(indieTitleColor, menuBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(indieMetaColor, menuBackground)).toBeGreaterThanOrEqual(4.5);

    await indieItem.click();
    await expectPathname(page, "/indie");
    await page.waitForLoadState("domcontentloaded");

    // Cover the second audience entry by direct route transition so the
    // dropdown itself is exercised once and route transitions are still
    // validated across both target pages.
    await page.goto("/teams");
    await expectPathname(page, "/teams");

    await topNav(page).getByRole("button", { name: /^For$/ }).click();
    await expect(menu).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(menu).toBeHidden();
  });
});

test.describe("homepage footer", () => {
  test("internal footer links return public 200 responses", async ({ page, request }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const hrefs = await footer.locator("a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href)),
    );
    const baseUrl = new URL(page.url());
    const internalPaths = Array.from(new Set(hrefs.flatMap((href) => {
      const url = new URL(href, baseUrl.href);
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== baseUrl.origin) return [];
      return [`${url.pathname}${url.search}`];
    }))).sort();

    for (const path of MINIMUM_FOOTER_PATHS) {
      expect(internalPaths).toContain(path);
    }

    for (const path of internalPaths) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), `${path} returned ${res.status()} ${res.headers().location ?? ""}`).toBe(200);
    }
  });
});

test.describe("homepage FAQ", () => {
  test("accordion items expand and collapse on click", async ({ page }) => {
    await page.goto("/");

    const firstTrigger = page.locator("#faq [data-slot='accordion-trigger']").first();
    const firstAnswerText = /workflow room is a shared space/i;

    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(firstAnswerText)).toBeVisible();

    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  });
});
