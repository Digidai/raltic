import { expect, test, type Page } from "@playwright/test";

import {
  assertOverlayMetrics,
  assertReadableCodeBlocks,
  assertReadableInlineTokens,
  assertSelectedRadioOwnsSingleSurface,
  clickVisible,
  json,
  openMembersDialog,
  openMockChannel,
  overlayMetrics,
  setupMockWorkspace,
  simulateVisualViewportHeight,
} from "./helpers/heroui-workspace";
import { isPreDeployProductionTarget } from "./helpers/env";

async function assertComposerFollowsVisualViewport(page: Page) {
  await page.getByRole("textbox", { name: /Message onboarding/ }).focus();
  await simulateVisualViewportHeight(page, 560);
  await page.waitForFunction(() => {
    const footer = document.querySelector<HTMLElement>('[data-testid="message-composer-footer"]');
    const rect = footer?.getBoundingClientRect();
    return rect ? rect.bottom <= 561 : false;
  });
  const composer = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    const footer = document.querySelector<HTMLElement>('[data-testid="message-composer-footer"]');
    const composerBox = document.querySelector<HTMLElement>('[data-testid="message-composer"]');
    const footerRect = footer?.getBoundingClientRect();
    const composerRect = composerBox?.getBoundingClientRect();
    return {
      activeRole: active?.getAttribute("role") ?? "",
      fontSize: active ? Number.parseFloat(getComputedStyle(active).fontSize) : 0,
      footerBottom: footerRect?.bottom ?? 0,
      composerBottom: composerRect?.bottom ?? 0,
      bodyScrollable: document.body.scrollHeight > document.body.clientHeight,
      documentScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    };
  });
  expect(composer.activeRole).toBe("textbox");
  expect(composer.fontSize).toBeGreaterThanOrEqual(16);
  expect(composer.footerBottom).toBeLessThanOrEqual(560);
  expect(composer.footerBottom).toBeGreaterThanOrEqual(520);
  expect(composer.composerBottom).toBeLessThanOrEqual(560);
  expect(composer.bodyScrollable).toBe(false);
  expect(composer.documentScrollable).toBe(false);
}

async function assertMembersPickerFollowsVisualViewport(page: Page) {
  await page.getByRole("button", { name: "Add people or agents" }).click();
  await page.getByLabel("Search people or agents").focus();
  await simulateVisualViewportHeight(page, 560);
  await page.waitForFunction(() => {
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const input = document.activeElement as HTMLElement | null;
    return Boolean(dialog && input && dialog.getBoundingClientRect().bottom <= 561 && input.getBoundingClientRect().bottom <= 561);
  });
  const focused = await page.evaluate(() => {
    const input = document.activeElement;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    return {
      inputBottom: input?.getBoundingClientRect().bottom ?? 0,
      dialogBottom: dialog?.getBoundingClientRect().bottom ?? 0,
    };
  });
  expect(focused.inputBottom).toBeLessThanOrEqual(560);
  expect(focused.dialogBottom).toBeLessThanOrEqual(560);
}

async function assertDialogFooterReachable(page: Page, dialogName: RegExp) {
  const dialog = page.getByRole("dialog", { name: dialogName });
  await expect(dialog).toBeVisible();
  await simulateVisualViewportHeight(page, 500);
  await page.waitForFunction(() => {
    const dialog = document.querySelector<HTMLElement>('[data-raltic-overlay="dialog"]');
    const footer = dialog?.querySelector<HTMLElement>('[data-slot="modal-footer"]');
    const body = dialog?.querySelector<HTMLElement>('[data-slot="modal-body"]');
    if (!dialog || !footer || !body) return false;
    return dialog.getBoundingClientRect().bottom <= 501 && footer.getBoundingClientRect().bottom <= 501;
  });
  const metrics = await page.evaluate(() => {
    const dialog = document.querySelector<HTMLElement>('[data-raltic-overlay="dialog"]');
    const footer = dialog?.querySelector<HTMLElement>('[data-slot="modal-footer"]');
    const body = dialog?.querySelector<HTMLElement>('[data-slot="modal-body"]');
    const submit = dialog?.querySelector<HTMLElement>('button[type="submit"]');
    return {
      dialogBottom: dialog?.getBoundingClientRect().bottom ?? 0,
      footerBottom: footer?.getBoundingClientRect().bottom ?? 0,
      bodyScrollable: body ? body.scrollHeight > body.clientHeight : false,
      submitVisible: submit ? submit.getBoundingClientRect().bottom <= 501 : false,
    };
  });
  expect(metrics.dialogBottom).toBeLessThanOrEqual(501);
  expect(metrics.footerBottom).toBeLessThanOrEqual(501);
  expect(metrics.bodyScrollable).toBe(true);
  expect(metrics.submitVisible).toBe(true);
}

test("chat composer follows the mobile visual viewport", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);
  await openMockChannel(page);

  await assertComposerFollowsVisualViewport(page);
});

test("mention picker uses the HeroUI overlay shell and keyboard model", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setupMockWorkspace(page, context);
  await openMockChannel(page);

  const textbox = page.getByRole("textbox", { name: /Message onboarding/i });
  await textbox.click();
  await textbox.pressSequentially("@");

  const listbox = page.getByRole("listbox", { name: "Mention picker" });
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole("option").first()).toBeVisible();

  const metrics = await listbox.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      left: box.left,
      right: box.right,
      viewportWidth: window.innerWidth,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      className: String(el.getAttribute("class") ?? ""),
    };
  });
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.boxShadow).not.toBe("none");
  expect(metrics.className).toContain("rounded-xl");
  expect(metrics.className).toContain("shadow-overlay");

  await page.keyboard.press("ArrowDown");
  await expect.poll(() => textbox.getAttribute("aria-activedescendant")).toBeTruthy();
  const activeMetrics = await page.evaluate(() => {
    const activeId = document.querySelector<HTMLElement>("[aria-activedescendant]")?.getAttribute("aria-activedescendant");
    const option = activeId ? document.getElementById(activeId) : null;
    if (!option) return null;
    const style = getComputedStyle(option);
    const className = option.getAttribute("class") ?? "";
    return {
      background: style.backgroundColor,
      className,
      chipCount: option.querySelectorAll("[data-slot='chip']").length,
    };
  });
  expect(activeMetrics, "mention active option should resolve from aria-activedescendant").not.toBeNull();
  expect(activeMetrics!.background, "active mention option should own a visible selected surface").not.toBe("rgba(0, 0, 0, 0)");
  expect(activeMetrics!.className, "mention active option should not use page-level cyan background").not.toContain("bg-cyan");
  expect(activeMetrics!.className, "mention active option should not use page-level cyan ring").not.toContain("ring-cyan");
  expect(activeMetrics!.chipCount, "agent badge should use HeroUI Chip").toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(listbox).toBeHidden();
});

test("message attachments and quick reactions use HeroUI surfaces", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await setupMockWorkspace(page, context);
  await page.route("**/api/v1/channels/ch-onboarding/messages**", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return route.fulfill(json({
      messages: [
        {
          id: "msg-attachment",
          channelId: "ch-onboarding",
          senderId: "u2",
          senderType: "human",
          content: "Attachment visual test",
          seq: 1,
          threadParentId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          attachments: [
            {
              id: "att-brief",
              filename: "brief.txt",
              contentType: "text/plain",
              sizeBytes: 42,
              url: "http://localhost:3000/mock-attachment/brief.txt",
            },
          ],
          reactions: [
            { emoji: "👍", reactorIds: ["u1"] },
          ],
        },
      ],
    }));
  });
  await page.route("**/mock-attachment/brief.txt", (route) => route.fulfill({
    status: 200,
    contentType: "text/plain",
    body: "hello from attachment",
  }));

  await openMockChannel(page);
  const attachment = page.getByRole("link", { name: /Download brief.txt/ });
  await expect(attachment).toBeVisible();
  const attachmentMetrics = await attachment.evaluate((el) => ({
    className: el.getAttribute("class") ?? "",
    cardPanels: el.querySelectorAll("[data-slot='card-panel']").length,
    boxShadow: getComputedStyle(el).boxShadow,
  }));
  expect(attachmentMetrics.className).toContain("shadow-surface");
  expect(attachmentMetrics.className).not.toContain("bg-card");
  expect(attachmentMetrics.cardPanels).toBe(1);
  expect(attachmentMetrics.boxShadow).not.toBe("none");

  const selectedReaction = page.locator("button").filter({ hasText: "👍" }).first();
  await expect(selectedReaction).toBeVisible();
  const selectedReactionMetrics = await selectedReaction.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      background: style.backgroundColor,
      borderColor: style.borderColor,
      className: el.getAttribute("class") ?? "",
    };
  });
  expect(selectedReactionMetrics.background, "selected reaction should own a visible token surface").not.toBe("rgba(0, 0, 0, 0)");
  expect(selectedReactionMetrics.borderColor, "selected reaction should keep a visible token border").not.toBe("rgba(0, 0, 0, 0)");
  expect(selectedReactionMetrics.className).not.toContain("bg-cyan");
  expect(selectedReactionMetrics.className).not.toContain("border-cyan");
  expect(selectedReactionMetrics.className).not.toContain("text-cyan");

  await page.getByText("Attachment visual test").hover();
  await page.getByRole("button", { name: "Add reaction" }).click();
  const reactionToolbar = page.getByRole("toolbar", { name: "Quick reactions" });
  await expect(reactionToolbar).toBeVisible();
  const toolbarMetrics = await reactionToolbar.evaluate((el) => ({
    className: el.getAttribute("class") ?? "",
    boxShadow: getComputedStyle(el).boxShadow,
  }));
  expect(toolbarMetrics.className).toContain("shadow-overlay");
  expect(toolbarMetrics.boxShadow).not.toBe("none");
});

test("setup wizard uses HeroUI surfaces through the bridge command step", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);
  await page.route("**/api/v1/machine-keys", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "mk-wizard",
        name: "My Mac",
        apiKey: "ck_wizard_1234567890",
      }),
    });
  });

  await page.goto("/s/demo?wizard=1", { waitUntil: "domcontentloaded" });
  const dialog = page.getByRole("dialog", { name: /Connect another local runtime|Connect a local runtime/ });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText("You already have a bridge connected.")).toBeVisible();
  await expect(dialog.getByText("You'll need on this computer:")).toBeVisible();
  if (!isPreDeployProductionTarget()) {
    await assertReadableInlineTokens(dialog, "setup wizard requirements");
  }

  const stageMetrics = await dialog.evaluate((el) => {
    const legacyPanels = Array.from(el.querySelectorAll<HTMLElement>("[class]"))
      .map((node) => node.getAttribute("class") ?? "")
      .filter((className) => /rounded border bg-(?:card|muted\/30)/.test(className));
    const cards = el.querySelectorAll("[data-slot='card-panel']").length;
    return {
      legacyPanels,
      cards,
      overflowX: document.body.scrollWidth > window.innerWidth + 1
        || document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  expect(stageMetrics.legacyPanels).toEqual([]);
  expect(stageMetrics.cards).toBeGreaterThan(1);
  expect(stageMetrics.overflowX).toBe(false);

  await dialog.getByRole("button", { name: "Issue a new runtime key" }).click();
  await dialog.getByRole("button", { name: "Issue key" }).click();
  await expect(dialog.getByRole("tab", { name: "Quick (recommended)" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByText("What this command does:")).toBeVisible();
  await expect(dialog.locator("[data-raltic-terminal-command]")).toBeVisible();
  await expect(dialog.locator("[data-raltic-terminal-preview]")).toBeVisible();
  if (!isPreDeployProductionTarget()) {
    await assertReadableInlineTokens(dialog, "setup wizard command step");
    await assertReadableCodeBlocks(
      dialog,
      "setup wizard terminal blocks",
      "[data-raltic-terminal-command], [data-raltic-terminal-preview]",
    );
  }

  const selectedInstallTabMetrics = await dialog.getByRole("tab", { name: "Quick (recommended)" }).evaluate((el) => {
    const styles = getComputedStyle(el);
    return {
      className: el.getAttribute("class") ?? "",
      backgroundColor: styles.backgroundColor,
      borderBottomWidth: styles.borderBottomWidth,
      borderRadius: styles.borderRadius,
    };
  });
  expect(selectedInstallTabMetrics.className).not.toContain("rounded-none");
  expect(selectedInstallTabMetrics.className).not.toContain("border-b-2");
  expect(selectedInstallTabMetrics.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(selectedInstallTabMetrics.borderBottomWidth).not.toBe("2px");
  expect(Number.parseFloat(selectedInstallTabMetrics.borderRadius)).toBeGreaterThan(0);

  const terminalMetrics = await dialog.locator("[data-raltic-terminal-command], [data-raltic-terminal-preview]").evaluateAll((nodes) =>
    nodes.map((node) => {
      const styles = getComputedStyle(node as HTMLElement);
      return {
        className: (node as HTMLElement).getAttribute("class") ?? "",
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        boxShadow: styles.boxShadow,
        hasCardSlot: Boolean((node as HTMLElement).closest("[data-slot='card']")),
      };
    }),
  );
  expect(terminalMetrics).toHaveLength(2);
  for (const metrics of terminalMetrics) {
    expect(metrics.className).toContain("shadow-overlay");
    expect(metrics.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(metrics.borderColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(metrics.boxShadow).not.toBe("none");
    expect(metrics.hasCardSlot).toBe(true);
  }

  const troubleToggle = dialog.getByRole("button", { name: "Having trouble?" });
  await expect(troubleToggle).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByText(/Node . 20 not installed\?/)).toBeVisible();
  await troubleToggle.click();
  await expect(troubleToggle).toHaveAttribute("aria-expanded", "false");
  await expect(dialog.getByText(/Node . 20 not installed\?/)).toBeHidden();
  await troubleToggle.click();
  await expect(troubleToggle).toHaveAttribute("aria-expanded", "true");
  await expect(dialog.getByText(/Node . 20 not installed\?/)).toBeVisible();
});

test("setup wizard runtime picker uses one HeroUI radio selected surface", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context, { hasConnectedBridge: false });

  await page.goto("/s/demo?wizard=1", { waitUntil: "domcontentloaded" });
  const dialog = page.getByRole("dialog", { name: /Connect a local runtime/ });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByText("Which runtime should power local workflows?")).toBeVisible();

  await assertSelectedRadioOwnsSingleSurface(
    dialog.getByRole("radio", { name: /Claude Code/ }),
    "setup wizard runtime",
  );

  await dialog.locator("[data-slot='radio']").filter({ hasText: "OpenAI Codex" }).click();
  await assertSelectedRadioOwnsSingleSurface(
    dialog.getByRole("radio", { name: /OpenAI Codex/ }),
    "setup wizard runtime",
  );
  await expect(dialog.getByText(/codex login/)).toBeVisible();
});

test("member overlays keep contrast and picker inputs above the keyboard", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);
  await openMockChannel(page);

  await openMembersDialog(page);
  await assertMembersPickerFollowsVisualViewport(page);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Members of #onboarding/ })).toBeHidden();
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.getByRole("button", { name: "Room actions" }).click();
  await page.getByRole("menuitem", { name: "Members" }).click();
  assertOverlayMetrics(await overlayMetrics(page, /Members of #onboarding/));
});

test("alert dialogs keep contrast and require an explicit choice", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);
  await openMockChannel(page);

  await page.getByRole("button", { name: "Room actions" }).click();
  await page.getByRole("menuitem", { name: "Leave room" }).click();
  assertOverlayMetrics(await overlayMetrics(page, /Leave #onboarding/, "alertdialog"), { requireClose: false });

  await page.mouse.click(12, 12);
  await expect(page.getByRole("alertdialog", { name: /Leave #onboarding/ })).toBeVisible();
});

test("legacy remove-member alert dialogs keep HeroUI Pro spacing and behavior", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupMockWorkspace(page, context);
  await openMockChannel(page);

  await openMembersDialog(page);
  await page.getByRole("button", { name: "Remove Cloud Test Agent" }).click();
  assertOverlayMetrics(await overlayMetrics(page, /Remove Cloud Test Agent from #onboarding/, "alertdialog"), { requireClose: false });

  await page.mouse.click(12, 12);
  await expect(page.getByRole("alertdialog", { name: /Remove Cloud Test Agent from #onboarding/ })).toBeVisible();
});

test("mobile sidebar-launched dialogs render above the sidebar overlay", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await setupMockWorkspace(page, context);
  await openMockChannel(page);

  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  await clickVisible(page, 'button[aria-label="Start workflow"]');
  assertOverlayMetrics(await overlayMetrics(page, /Start workflow/));
  await assertDialogFooterReachable(page, /Start workflow/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /Start workflow/ })).toBeHidden();

  await page.keyboard.press("Escape").catch(() => {});
  await page.getByRole("button", { name: "Open workspace navigation" }).click();
  await clickVisible(page, 'button[aria-label="Start a new direct message"]');
  const newDmDialog = page.getByRole("dialog", { name: /Start a direct message/ });
  assertOverlayMetrics(await overlayMetrics(page, /Start a direct message/));
  const cloudAgentRow = newDmDialog.locator("button", { hasText: "Cloud Test Agent" });
  await expect(cloudAgentRow).toBeVisible();
  const aiChipMetrics = await cloudAgentRow.getByText("AI", { exact: true }).evaluate((el) => {
    const chip = el.closest<HTMLElement>("[data-slot='chip']");
    return {
      hasChip: Boolean(chip),
      chipClassName: chip?.getAttribute("class") ?? "",
    };
  });
  expect(aiChipMetrics.hasChip, "new DM agent badge should use HeroUI Chip").toBe(true);
  expect(aiChipMetrics.chipClassName).not.toContain("bg-cyan");
  expect(aiChipMetrics.chipClassName).not.toContain("text-cyan");
});
