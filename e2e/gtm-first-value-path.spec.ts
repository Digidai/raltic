import { expect, test, type Page } from "@playwright/test";

import {
  agents,
  mockAgentRuns,
  mockTasks,
  setupMockWorkspace,
} from "./helpers/heroui-workspace";
import { isPreDeployProductionTarget } from "./helpers/env";

function decodeWsPayload(payload: string | Buffer | ArrayBuffer): Record<string, unknown> {
  if (typeof payload === "string") return JSON.parse(payload) as Record<string, unknown>;
  const bytes = payload instanceof Buffer ? payload : new Uint8Array(payload);
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => ({
    bodyOverflowX: document.body.scrollWidth > window.innerWidth + 1,
    documentOverflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    viewportWidth: window.innerWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));

  expect(metrics.bodyOverflowX, `${label}: body ${metrics.bodyScrollWidth}px vs ${metrics.viewportWidth}px`).toBe(false);
  expect(metrics.documentOverflowX, `${label}: html ${metrics.documentScrollWidth}px vs ${metrics.viewportWidth}px`).toBe(false);
}

test.describe("GTM first-value path", () => {
  test("connects the public promise to a signed-in starter room and proof surfaces", async ({ page, context }) => {
    test.skip(
      isPreDeployProductionTarget(),
      "The acquisition-to-first-value assertion requires the current bundle, not the pre-deploy production bundle.",
    );
    const tasks = [...mockTasks];
    const agentRuns = [...mockAgentRuns];
    const inboxResponse: { items: Array<Record<string, unknown>>; count: number; totalCount: number } = {
      items: [],
      count: 0,
      totalCount: 0,
    };
    let launchBriefSent = false;

    await page.routeWebSocket(/\/ws\/channel\/ch-new\?channelId=ch-new/, (ws) => {
      ws.onMessage((payload) => {
        const message = decodeWsPayload(payload);
        if (message.t !== "send") return;
        launchBriefSent = true;
        const now = Date.now();
        const nowIso = new Date(now).toISOString();
        const content = String(message.content ?? "");
        tasks.unshift({
          id: "task-launch-proof",
          channelId: "ch-new",
          messageId: "msg-launch-brief",
          taskNumber: 1,
          title: "Review launch readiness proof",
          status: "in_review",
          assigneeId: "u1",
          assigneeType: "human",
          createdAt: now,
          updatedAt: now,
          latestRun: {
            id: "run-launch-proof",
            agentId: "agent-onboard",
            status: "waiting_input",
            source: "channel_mention",
            runtimeMode: "raltic",
            error: null,
            createdAt: nowIso,
            updatedAt: nowIso,
            completedAt: null,
          },
        });
        agentRuns.unshift({
          id: "run-launch-proof",
          serverId: "srv-demo",
          channelId: "ch-new",
          agentId: "agent-onboard",
          taskId: "task-launch-proof",
          source: "channel_mention",
          status: "waiting_input",
          runtimeMode: "raltic",
          callerId: "u1",
          callerType: "human",
          triggerMessageId: "msg-launch-brief",
          outputMessageId: "msg-launch-proof",
          inputPreview: "Start this workflow. Launch readiness proof requested.",
          error: null,
          metadata: null,
          startedAt: nowIso,
          completedAt: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        inboxResponse.items.unshift(
          {
            id: "task:task-launch-proof",
            kind: "task",
            priority: 0,
            createdAt: now,
            channelId: "ch-new",
            channelName: "launch-readiness",
            channelType: "public",
            preview: "Review launch readiness proof",
            href: "/s/demo/channel/ch-new",
            status: "in_review",
          },
          {
            id: "run:run-launch-proof",
            kind: "agent_run",
            priority: 1,
            createdAt: now,
            channelId: "ch-new",
            channelName: "launch-readiness",
            channelType: "public",
            preview: "Onboarding Assistant is waiting on launch proof review",
            href: "/s/demo/agents/agent-onboard?tab=runs&runId=run-launch-proof",
            status: "waiting_input",
            agentId: "agent-onboard",
            runtimeMode: "raltic",
          },
        );
        inboxResponse.count = inboxResponse.items.length;
        inboxResponse.totalCount = inboxResponse.items.length;

        ws.send(JSON.stringify({ v: 1, t: "ack", id: message.id, seq: 1, messageId: "msg-launch-brief" }));
        ws.send(JSON.stringify({
          v: 1,
          t: "message",
          seq: 1,
          message: {
            id: "msg-launch-brief",
            channelId: "ch-new",
            senderId: "u1",
            senderType: "human",
            content,
            seq: 1,
            threadParentId: null,
            createdAt: now,
            updatedAt: now,
          },
        }));
        ws.send(JSON.stringify({
          v: 1,
          t: "message",
          seq: 2,
          message: {
            id: "msg-launch-proof",
            channelId: "ch-new",
            senderId: "agent-onboard",
            senderType: "agent",
            content: "Launch readiness proof: checklist drafted, owner map pending, support risk needs human review.",
            seq: 2,
            threadParentId: null,
            createdAt: now + 1,
            updatedAt: now + 1,
          },
        }));
      });
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Launch your first\s+agent workflow/i })).toBeVisible();
    await expect(page.getByText(/Turn launch readiness or code review into one accountable room/i)).toBeVisible();
    await expect(page.locator("section").first().getByRole("link", { name: /^Start a launch workflow$/ })).toHaveAttribute("href", "/signup?workflow=launch-readiness");

    await setupMockWorkspace(page, context, { tasks, agentRuns, inboxResponse });

    await page.goto("/s/demo?workflow=launch-readiness", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Pick one workflow and make the agent work visible." })).toBeVisible();
    await expect(page.getByText("1. Pick", { exact: true })).toBeVisible();
    await expect(page.getByText("2. Send", { exact: true })).toBeVisible();
    await expect(page.getByText("3. Prove", { exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: "Workflow outcome picker" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "desktop start page");

    const createRoomRequest = page.waitForRequest((request) => {
      if (request.method() !== "POST") return false;
      const url = new URL(request.url());
      return url.pathname === "/api/v1/channels" && (request.postData() ?? "").includes('"name":"launch-readiness"');
    });
    await page.getByRole("button", { name: /^Start selected workflow$/ }).click();
    const roomRequest = await createRoomRequest;
    expect(roomRequest.postDataJSON()).toMatchObject({
      serverId: "srv-demo",
      name: "launch-readiness",
      type: "public",
      initialAgentIds: ["agent-onboard"],
    });

    await expect(page).toHaveURL(/\/s\/demo\/channel\/ch-new\?starter=launch-readiness$/);
    await expect(page.getByRole("heading", { name: "Launch readiness" })).toBeVisible();
    await expect(page.getByText("Raltic will not start the agent until you send the message.")).toBeVisible();

    await page.getByRole("button", { name: "Use brief" }).click();
    await expect(page).toHaveURL(/\/s\/demo\/channel\/ch-new$/);
    const composer = page.locator("[data-testid='message-composer-input'] [role='textbox']");
    await expect(composer).toContainText("@onboarding Start this workflow.");
    await expect(composer).toContainText("A launch checklist, proof gaps, owner map, support risks");
    await expect(composer).toContainText("Human blocks public send until support and docs are ready.");
    await expect(page.getByLabel("Room agent")).toContainText("Onboarding Assistant");
    await expectNoHorizontalOverflow(page, "starter room with drafted brief");

    const sendButton = page.getByRole("button", { name: "Send message" });
    await expect(sendButton).toBeEnabled({ timeout: 10_000 });
    await sendButton.click();
    await expect.poll(() => launchBriefSent, { timeout: 5_000 }).toBe(true);
    await expect(page.getByText("Launch readiness proof: checklist drafted")).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Workspace navigation" });
    await nav.getByRole("link", { name: "Work queue", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Work queue", exact: true })).toBeVisible();
    await expect(page.getByText("Team-visible review gates")).toBeVisible();
    await expect(page.getByTestId("work-queue-list").getByRole("link", { name: /#launch-readiness review/i })).toBeVisible();
    await expect(page.getByTestId("work-queue-list").getByRole("link", { name: /#launch-readiness waiting/i })).toBeVisible();
    await expect(page.getByText("Review launch readiness proof")).toBeVisible();
    await expect(page.getByText("Onboarding Assistant is waiting on launch proof review")).toBeVisible();

    await nav.getByRole("link", { name: "Tasks", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();
    const launchTask = page.getByTestId("task-card").filter({ hasText: "Review launch readiness proof" });
    await expect(launchTask).toBeVisible();
    await expect(launchTask.getByText("launch-readiness")).toBeVisible();
    await expect(launchTask.getByText("Agent work")).toBeVisible();
    await expect(launchTask.getByText("Waiting")).toBeVisible();

    await nav.getByRole("link", { name: "Agent Work", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Agent Work", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Workspace run log" })).toBeVisible();
    await expect(page.getByText("Recent agent execution, ordered by what most needs attention.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Onboarding Assistant Waiting #launch-readiness/ })).toHaveAttribute("href", /\/s\/demo\/agents\/agent-onboard\?tab=runs&runId=run-launch-proof/);
    await expect(page.getByRole("link", { name: /Work log Waiting/ })).toHaveAttribute("href", /\/s\/demo\/agents\/agent-onboard\?tab=runs&runId=run-launch-proof/);
  });

  test("gates local-code workflow creation on an explicit runtime connection", async ({ page, context }) => {
    await setupMockWorkspace(page, context, { hasConnectedBridge: false });

    const channelCreates: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "POST") return;
      const url = new URL(request.url());
      if (url.pathname === "/api/v1/channels") channelCreates.push(request.postData() ?? "");
    });

    await page.goto("/s/demo", { waitUntil: "domcontentloaded" });
    await page.getByRole("group", { name: "Workflow outcome picker" }).getByRole("button", { name: /Review local code/ }).click();
    await page.getByRole("button", { name: /^Connect runtime$/ }).first().click();

    await expect(page.getByRole("dialog", { name: /Connect a local runtime/ })).toBeVisible();
    expect(channelCreates).toEqual([]);

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoHorizontalOverflow(page, "mobile runtime setup gate");
  });

  test("uses stored workflow landing intent as the default starter", async ({ page, context }) => {
    await setupMockWorkspace(page, context);

    await page.goto("/workflows/research-synthesis", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /AI research synthesis workflow/i })).toBeVisible();

    await page.goto("/s/demo", { waitUntil: "domcontentloaded" });
    const picker = page.getByRole("group", { name: "Workflow outcome picker" });
    await expect(picker.getByRole("button", { name: /Make a decision/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /^Start selected workflow$/ }).first()).toBeVisible();

    const storedIntent = await page.evaluate(() => window.localStorage.getItem("raltic:workflow:intent"));
    expect(storedIntent).toBeNull();
  });

  test("keeps local-code workflow gated when a bridge exists but no local agent is ready", async ({ page, context }) => {
    await setupMockWorkspace(page, context);

    const channelCreates: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "POST") return;
      const url = new URL(request.url());
      if (url.pathname === "/api/v1/channels") channelCreates.push(request.postData() ?? "");
    });

    await page.goto("/s/demo", { waitUntil: "domcontentloaded" });
    await page.getByRole("group", { name: "Workflow outcome picker" }).getByRole("button", { name: /Review local code/ }).click();
    await expect(page.getByRole("button", { name: /^Connect runtime$/ }).first()).toBeVisible();
    await page.getByRole("button", { name: /^Connect runtime$/ }).first().click();

    await expect(page.getByRole("dialog", { name: "Configure local runtime" })).toBeVisible();
    await expect(page.getByText("No new key is needed.")).toBeVisible();
    expect(channelCreates).toEqual([]);
  });

  test("returns to the selected local-code workflow after runtime setup", async ({ page, context }) => {
    const agentPatches: Array<{ agentId: string; patch: Record<string, unknown> }> = [];
    await setupMockWorkspace(page, context, {
      hasConnectedBridge: true,
      agentPatches,
    });

    const createRoomRequest = page.waitForRequest((request) => {
      if (request.method() !== "POST") return false;
      const url = new URL(request.url());
      return url.pathname === "/api/v1/channels" && (request.postData() ?? "").includes('"name":"code-review"');
    });

    await page.goto("/s/demo", { waitUntil: "domcontentloaded" });
    await page.getByRole("group", { name: "Workflow outcome picker" }).getByRole("button", { name: /Review local code/ }).click();
    await expect(page.getByRole("button", { name: /^Connect runtime$/ }).first()).toBeVisible();
    await page.getByRole("button", { name: /^Connect runtime$/ }).first().click();

    await expect(page.getByRole("dialog", { name: "Configure local runtime" })).toBeVisible();
    await page.getByRole("button", { name: "Use existing bridge" }).click();

    const roomRequest = await createRoomRequest;
    expect(agentPatches).toContainEqual({
      agentId: "agent-onboard",
      patch: {
        runtimeMode: "bridge",
        runtime: "claude",
        model: "sonnet",
      },
    });
    expect(roomRequest.postDataJSON()).toMatchObject({
      serverId: "srv-demo",
      name: "code-review",
      type: "private",
      initialAgentIds: ["agent-onboard"],
    });
    await expect(page).toHaveURL(/\/s\/demo\/channel\/ch-new\?starter=code-review$/);
  });

  test("keeps local-code workflow gated when only a locked experimental bridge agent exists", async ({ page, context }) => {
    await setupMockWorkspace(page, context, {
      hasConnectedBridge: true,
      agents: agents.map((agent) => agent.name === "onboarding"
        ? { ...agent, runtimeMode: "bridge" as const, runtime: "openclaw" as const, model: "auto" }
        : agent),
    });

    const channelCreates: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "POST") return;
      const url = new URL(request.url());
      if (url.pathname === "/api/v1/channels") channelCreates.push(request.postData() ?? "");
    });

    await page.goto("/s/demo", { waitUntil: "domcontentloaded" });
    await page.getByRole("group", { name: "Workflow outcome picker" }).getByRole("button", { name: /Review local code/ }).click();
    await expect(page.getByRole("button", { name: /^Connect runtime$/ }).first()).toBeVisible();
    await page.getByRole("button", { name: /^Connect runtime$/ }).first().click();

    await expect(page.getByRole("dialog", { name: "Configure local runtime" })).toBeVisible();
    await page.getByRole("button", { name: "Advanced daemon runtimes" }).click();
    await expect(page.locator("input[type='radio'][value='openclaw']")).toBeDisabled();
    await expect(page.locator("input[type='radio'][value='hermes']")).toBeDisabled();
    expect(channelCreates).toEqual([]);
  });
});
