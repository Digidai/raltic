import { expect, test, type Page } from "@playwright/test";

import {
  assertOverlayMetrics,
  assertSelectedCheckboxOwnsSingleSurface,
  assertSelectedRadioOwnsSingleSurface,
  clickVisible,
  contrast,
  openMembersDialog,
  openMockChannel,
  overlayMetrics,
  setupMockWorkspace,
  simulateVisualViewportHeight,
} from "./helpers/heroui-workspace";

function parseRgb(value: string | null) {
  const match = value?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])] as const;
}

async function openMobileSidebar(page: Page) {
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Workspace navigation" })).toBeVisible();
}

async function assertDialogFooterWithinVisualViewport(page: Page, dialogName: RegExp, height = 500) {
  const dialog = page.getByRole("dialog", { name: dialogName });
  await expect(dialog).toBeVisible();
  await simulateVisualViewportHeight(page, height);
  await page.waitForFunction(
    (expected) => {
      const popup = document.querySelector<HTMLElement>('[data-raltic-overlay="dialog"]');
      const footer = popup?.querySelector<HTMLElement>('[data-slot="modal-footer"]');
      return Boolean(popup && footer && popup.getBoundingClientRect().bottom <= expected + 1 && footer.getBoundingClientRect().bottom <= expected + 1);
    },
    height,
  );
  const metrics = await dialog.evaluate((el) => {
    const footer = el.querySelector<HTMLElement>('[data-slot="modal-footer"]');
    const panel = el.querySelector<HTMLElement>('[data-slot="modal-body"]');
    const submit = el.querySelector<HTMLElement>('button[type="submit"]');
    return {
      dialogBottom: el.getBoundingClientRect().bottom,
      footerBottom: footer?.getBoundingClientRect().bottom ?? 0,
      panelScrollable: panel ? panel.scrollHeight > panel.clientHeight : false,
      submitVisible: submit ? submit.getBoundingClientRect().bottom <= window.innerHeight : false,
    };
  });
  expect(metrics.dialogBottom).toBeLessThanOrEqual(height + 1);
  expect(metrics.footerBottom).toBeLessThanOrEqual(height + 1);
  expect(metrics.panelScrollable).toBe(true);
  expect(metrics.submitVisible).toBe(true);
}

async function assertDmPickerContained(page: Page) {
  const dialog = page.getByRole("dialog", { name: /Start a direct message/ });
  await expect(dialog.getByRole("textbox", { name: "Search people or agents" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Olivia/ })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Cloud Test Agent/ })).toBeVisible();
  await simulateVisualViewportHeight(page, 540);
  await page.waitForFunction(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const input = dialog?.querySelector<HTMLElement>('input[aria-label="Search people or agents"]');
    const list = dialog?.querySelector<HTMLElement>("ul");
    if (!dialog || !input || !list) return false;
    return dialog.getBoundingClientRect().bottom <= 541 && input.getBoundingClientRect().bottom <= 541;
  });
  const layout = await dialog.evaluate((el) => {
    const input = el.querySelector<HTMLElement>('input[aria-label="Search people or agents"]');
    const list = el.querySelector<HTMLElement>("ul");
    const rect = el.getBoundingClientRect();
    const inputRect = input?.getBoundingClientRect();
    const listRect = list?.getBoundingClientRect();
    return {
      dialog: { left: rect.left, right: rect.right, bottom: rect.bottom },
      input: { left: inputRect?.left ?? 0, right: inputRect?.right ?? 0, bottom: inputRect?.bottom ?? 0 },
      list: { left: listRect?.left ?? 0, right: listRect?.right ?? 0, bottom: listRect?.bottom ?? 0, scrollWidth: list?.scrollWidth ?? 0, clientWidth: list?.clientWidth ?? 0 },
      bodyHorizontalOverflow: document.body.scrollWidth > document.body.clientWidth || document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  expect(layout.dialog.bottom).toBeLessThanOrEqual(541);
  expect(layout.input.left).toBeGreaterThanOrEqual(layout.dialog.left);
  expect(layout.input.right).toBeLessThanOrEqual(layout.dialog.right);
  expect(layout.input.bottom).toBeLessThanOrEqual(541);
  expect(layout.list.left).toBeGreaterThanOrEqual(layout.dialog.left);
  expect(layout.list.right).toBeLessThanOrEqual(layout.dialog.right);
  expect(layout.list.bottom).toBeLessThanOrEqual(541);
  expect(layout.list.scrollWidth).toBeLessThanOrEqual(layout.list.clientWidth + 1);
  expect(layout.bodyHorizontalOverflow).toBe(false);
}

async function assertMembersTextSamplesReadable(page: Page) {
  const dialog = page.getByRole("dialog", { name: /Members of #onboarding/ });
  const samples = await dialog.evaluate((el) => {
    const labels = [
      "People (1)",
      "Gene (you)",
      "dai@live.cn",
      "Agents (2)",
      "Onboarding Assistant",
      "claude · @onboarding",
      "Cloud Test Agent",
      "claude · @cloud-test",
    ];
    const visibleTextNode = (text: string) => Array.from(el.querySelectorAll<HTMLElement>("*"))
      .find((node) => node.textContent?.trim() === text && node.getBoundingClientRect().width > 0);
    const effectiveBackground = (node: HTMLElement) => {
      let current: HTMLElement | null = node;
      while (current) {
        const background = getComputedStyle(current).backgroundColor;
        if (background && background !== "transparent" && background !== "rgba(0, 0, 0, 0)") return background;
        current = current.parentElement;
      }
      return getComputedStyle(el).backgroundColor;
    };
    return labels.map((label) => {
      const node = visibleTextNode(label);
      if (!node) return { label, found: false, color: "", background: "" };
      return {
        label,
        found: true,
        color: getComputedStyle(node).color,
        background: effectiveBackground(node),
      };
    });
  });
  for (const sample of samples) {
    expect(sample.found, `${sample.label} is visible`).toBe(true);
    const foreground = parseRgb(sample.color);
    const background = parseRgb(sample.background);
    expect(foreground && background ? contrast(foreground, background) : 0, `${sample.label} contrast`).toBeGreaterThanOrEqual(4.5);
  }
}

test.describe("HeroUI Pro channel dialogs", () => {
  test("create blank workflow dialog keeps overlay contrast and footer reachable above the mobile keyboard", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupMockWorkspace(page, context);
    await openMockChannel(page);

    await openMobileSidebar(page);
    await clickVisible(page, 'button[aria-label="Create blank workflow"]');

    assertOverlayMetrics(await overlayMetrics(page, /Create blank workflow/));
    await expect(page.getByRole("textbox", { name: "Room name" })).toHaveCSS("font-size", /16px/);
    const publicVisibility = page.getByRole("radio", { name: /Public/ });
    const privateVisibility = page.getByRole("radio", { name: /Private/ });
    await expect(publicVisibility).toBeChecked();
    await page.locator('[data-slot="radio"]').filter({ hasText: "Private" }).click();
    await assertSelectedRadioOwnsSingleSurface(privateVisibility, "create channel visibility");
    const oliviaCheckbox = page.getByRole("checkbox", { name: /Olivia/ });
    await page.locator('[data-slot="checkbox"]').filter({ hasText: "Olivia" }).click();
    await assertSelectedCheckboxOwnsSingleSurface(oliviaCheckbox, "create channel member picker");
    const cloudAgentCheckbox = page.getByRole("checkbox", { name: /Cloud Test Agent/ });
    await page.locator('[data-slot="checkbox"]').filter({ hasText: "Cloud Test Agent" }).click();
    await assertSelectedCheckboxOwnsSingleSurface(cloudAgentCheckbox, "create channel agent picker");
    const createDialog = page.getByRole("dialog", { name: /Create blank workflow/ });
    for (const label of ["Olivia", "Cloud Test Agent"]) {
      const chip = createDialog.locator("[data-slot='chip']").filter({ hasText: label });
      await expect(chip).toBeVisible();
      const chipClassName = await chip.evaluate((el) => el.getAttribute("class") ?? "");
      expect(chipClassName, `${label} selected chip should not use page-level cyan background`).not.toContain("bg-cyan");
      expect(chipClassName, `${label} selected chip should not use page-level cyan text`).not.toContain("text-cyan");
    }
    await assertDialogFooterWithinVisualViewport(page, /Create blank workflow/);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /Create blank workflow/ })).toBeHidden();
  });

  test("create blank workflow dialog sends brief, approval boundary, members, and agents", async ({ page, context }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await setupMockWorkspace(page, context);
    await page.goto("/s/demo", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });

    await clickVisible(page, 'button[aria-label="Create blank workflow"]');
    await page.getByRole("textbox", { name: "Room name" }).fill("launch-readiness-custom");
    await page.getByRole("textbox", { name: "Room description" }).fill("Launch proof");
    await page.getByRole("textbox", { name: "Approval boundary" }).fill("Human checks support-risk summary before public launch");
    await page.locator('[data-slot="radio"]').filter({ hasText: "Private" }).click();
    await page.locator('[data-slot="checkbox"]').filter({ hasText: "Olivia" }).click();
    await page.locator('[data-slot="checkbox"]').filter({ hasText: "Cloud Test Agent" }).click();

    const createRequest = page.waitForRequest((request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/api/v1/channels",
    );
    await page.getByRole("dialog", { name: /Create blank workflow/ }).getByRole("button", { name: "Create workflow" }).click();
    const body = JSON.parse((await createRequest).postData() ?? "{}");
    expect(body).toMatchObject({
      serverId: "srv-demo",
      name: "launch-readiness-custom",
      type: "private",
      initialMemberIds: ["u2"],
      initialAgentIds: ["agent-cloud"],
    });
    expect(body.description).toBe("Launch proof\nApproval boundary: Human checks support-risk summary before public launch");
  });

  test("start direct message opens above the mobile sidebar drawer without clipping the picker", async ({ page, context }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await setupMockWorkspace(page, context);
    await openMockChannel(page);

    await openMobileSidebar(page);
    await clickVisible(page, 'button[aria-label="Start a new direct message"]');

    assertOverlayMetrics(await overlayMetrics(page, /Start a direct message/));
    await assertDmPickerContained(page);
  });

  test("channel actions menu opens members dialog with readable text and controls in light and dark mode", async ({ page, context }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await setupMockWorkspace(page, context);
    await openMockChannel(page);

    await page.getByRole("button", { name: "Room actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Members" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Leave room" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Members" }).click();
    let membersDialog = page.getByRole("dialog", { name: /Members of #onboarding/ });
    assertOverlayMetrics(await overlayMetrics(page, /Members of #onboarding/));
    await assertMembersTextSamplesReadable(page);
    await membersDialog.getByRole("button", { name: "Add people or agents" }).click();
    await membersDialog.locator('[data-slot="checkbox"]').filter({ hasText: "Olivia" }).click();
    await assertSelectedCheckboxOwnsSingleSurface(membersDialog.getByRole("checkbox", { name: /Olivia/ }), "channel members picker");
    await membersDialog.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("dialog", { name: /Members of #onboarding/ })
      .locator('[data-slot="modal-footer"]')
      .getByRole("button", { name: "Close" })
      .click();
    await expect(page.getByRole("dialog", { name: /Members of #onboarding/ })).toBeHidden();

    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await openMembersDialog(page);
    membersDialog = page.getByRole("dialog", { name: /Members of #onboarding/ });
    assertOverlayMetrics(await overlayMetrics(page, /Members of #onboarding/));
    await assertMembersTextSamplesReadable(page);
    await membersDialog.getByRole("button", { name: "Add people or agents" }).click();
    await expect(membersDialog.getByRole("checkbox", { name: /Olivia/ })).toBeVisible();
  });

  test("leave channel alert remains modal when backdrop is clicked", async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setupMockWorkspace(page, context);
    await openMockChannel(page);

    await page.getByRole("button", { name: "Room actions" }).click();
    await page.getByRole("menuitem", { name: "Leave room" }).click();
    assertOverlayMetrics(await overlayMetrics(page, /Leave #onboarding/, "alertdialog"), { requireClose: false });

    await page.mouse.click(12, 12);
    await expect(page.getByRole("alertdialog", { name: /Leave #onboarding/ })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /Message onboarding/ })).not.toBeFocused();
  });
});
