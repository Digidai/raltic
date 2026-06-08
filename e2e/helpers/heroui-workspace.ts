import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";

export const server = {
  id: "srv-demo",
  name: "Gene's Workspace",
  slug: "demo",
  description: "Get familiar with Raltic",
  iconUrl: null,
  ownerId: "u1",
  createdAt: Date.now(),
  role: "owner",
};

export const onboardingChannel = {
  id: "ch-onboarding",
  serverId: "srv-demo",
  name: "onboarding",
  description: "Get familiar with Raltic",
  topic: null,
  type: "public",
  createdBy: "u1",
  createdAt: Date.now(),
  archivedAt: null,
  archivedBy: null,
  starredAt: null,
  unread: 0,
  maxSeq: 2,
  lastReadSeq: 2,
  mutedAt: null,
  agentIds: ["agent-onboard", "agent-cloud"],
  isMember: true,
};

export const researchChannel = {
  ...onboardingChannel,
  id: "ch-research",
  name: "research",
  description: "Research channel",
  maxSeq: 1,
  lastReadSeq: 1,
  agentIds: ["agent-cloud"],
};

export const starterWorkflowChannel = {
  ...onboardingChannel,
  id: "ch-new",
  name: "launch-readiness",
  description: "Workflow room for launch proof, docs, support risk, approval, and owner handoff.",
  maxSeq: 0,
  lastReadSeq: 0,
};

export const discoverWorkflowChannel = {
  ...onboardingChannel,
  id: "ch-customer-risk",
  name: "customer-risk",
  description: "Renewal risk briefs and follow-up approvals.",
  maxSeq: 0,
  lastReadSeq: 0,
  agentIds: [],
  isMember: false,
};

export const dmChannel = {
  id: "dm-agent",
  serverId: "srv-demo",
  name: "cloud-test",
  description: null,
  topic: null,
  type: "dm",
  createdBy: "u1",
  createdAt: Date.now(),
  archivedAt: null,
  archivedBy: null,
  starredAt: null,
  unread: 0,
  maxSeq: 0,
  lastReadSeq: 0,
  mutedAt: null,
  isMember: true,
  peer: { name: "Cloud Test Agent", type: "agent", id: "agent-cloud", runtime: "claude", avatarSeed: null },
};

const nowIso = new Date().toISOString();

export const mockTasks = [
  {
    id: "task-onboarding-review",
    channelId: "ch-onboarding",
    messageId: "msg-review",
    taskNumber: 7,
    title: "Review onboarding handoff",
    status: "in_review",
    assigneeId: "u1",
    assigneeType: "human",
    createdAt: Date.now() - 5_000,
    updatedAt: Date.now() - 1_000,
    latestRun: {
      id: "run-onboarding-waiting",
      agentId: "agent-onboard",
      status: "waiting_input",
      source: "channel_mention",
      runtimeMode: "raltic",
      error: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
    },
  },
  {
    id: "task-research-running",
    channelId: "ch-research",
    messageId: "msg-running",
    taskNumber: 8,
    title: "Collect research notes",
    status: "in_progress",
    assigneeId: "agent-cloud",
    assigneeType: "agent",
    createdAt: Date.now() - 4_000,
    updatedAt: Date.now() - 500,
    latestRun: {
      id: "run-research-active",
      agentId: "agent-cloud",
      status: "running",
      source: "channel_mention",
      runtimeMode: "raltic",
      error: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: null,
    },
  },
];

export const mockAgentRuns = [
  {
    id: "run-onboarding-waiting",
    serverId: "srv-demo",
    channelId: "ch-onboarding",
    agentId: "agent-onboard",
    taskId: "task-onboarding-review",
    source: "channel_mention",
    status: "waiting_input",
    runtimeMode: "raltic",
    callerId: "u1",
    callerType: "human",
    triggerMessageId: "msg-review",
    outputMessageId: null,
    inputPreview: "Review onboarding handoff",
    error: null,
    metadata: null,
    startedAt: nowIso,
    completedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "run-research-active",
    serverId: "srv-demo",
    channelId: "ch-research",
    agentId: "agent-cloud",
    taskId: "task-research-running",
    source: "channel_mention",
    status: "running",
    runtimeMode: "raltic",
    callerId: "u1",
    callerType: "human",
    triggerMessageId: "msg-running",
    outputMessageId: null,
    inputPreview: "Collect research notes",
    error: null,
    metadata: null,
    startedAt: nowIso,
    completedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: "run-research-failed",
    serverId: "srv-demo",
    channelId: "ch-research",
    agentId: "agent-cloud",
    taskId: null,
    source: "channel_mention",
    status: "failed",
    runtimeMode: "raltic",
    callerId: "u1",
    callerType: "human",
    triggerMessageId: "msg-failed",
    outputMessageId: null,
    inputPreview: "Research handoff",
    error: "[redacted token]",
    metadata: null,
    startedAt: nowIso,
    completedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

export const agents = [
  {
    id: "agent-onboard",
    serverId: "srv-demo",
    ownerId: "u1",
    name: "onboarding",
    displayName: "Onboarding Assistant",
    description: "Helps with setup",
    systemPrompt: null,
    model: "claude-haiku-4-5",
    runtime: "claude",
    runtimeMode: "raltic",
    status: "online",
    avatarSeed: null,
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dmChannelId: null,
  },
  {
    id: "agent-cloud",
    serverId: "srv-demo",
    ownerId: "u1",
    name: "cloud-test",
    displayName: "Cloud Test Agent",
    description: "Runs in Raltic cloud",
    systemPrompt: "You are Cloud Test Agent.\n\nUse `raltic message send` for replies.\nKeep workspace changes scoped and explain commands before running them.",
    model: "claude-haiku-4-5",
    runtime: "claude",
    runtimeMode: "raltic",
    status: "online",
    avatarSeed: null,
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    dmChannelId: "dm-agent",
  },
];

export const workspaceMembers = [
  { userId: "u1", role: "owner", joinedAt: Date.now(), name: "Gene", email: "dai@live.cn", image: null },
  { userId: "u2", role: "member", joinedAt: Date.now(), name: "Olivia", email: "olivia@example.com", image: null },
];

type MockWorkspaceChannel =
  | typeof onboardingChannel
  | typeof researchChannel
  | typeof starterWorkflowChannel
  | typeof discoverWorkflowChannel
  | typeof dmChannel;

type MockRuntimeId = "claude" | "codex" | "openclaw" | "hermes";

const BRIDGE_RUNTIME_MODELS: Record<MockRuntimeId, readonly string[]> = {
  claude: ["sonnet", "opus", "haiku"],
  codex: ["gpt-5.5", "gpt-5.4", "gpt-5.3-codex-spark"],
  openclaw: ["auto", "claude-sonnet-4-6", "gpt-5.4", "gemini-2.5-pro"],
  hermes: ["auto", "router-default"],
};

const CLOUD_RUNTIME_MODELS = [
  "claude-haiku-4-5",
  "claude-sonnet-4-6",
  "claude-opus-4-7",
  "gpt-5.4",
  "gpt-5.5",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

type MockAgent = Omit<(typeof agents)[number], "runtime" | "runtimeMode" | "model"> & {
  runtime: MockRuntimeId;
  runtimeMode: "bridge" | "raltic";
  model: string;
};

type MockMachineRuntimeRow = {
  fingerprint: string;
  hostname: string | null;
  platform: string | null;
  arch: string | null;
  detectedAt: number;
  runtimes: Array<{
    id: MockRuntimeId;
    detected: boolean;
    version: string | null;
    authed: boolean | null;
    authMethod: string | null;
    error: string | null;
  }>;
};

type MockMachineKey = {
  id: string;
  prefix: string;
  name: string;
  serverId: string;
  createdAt: number;
  lastUsedAt: number | null;
  revokedAt: number | null;
  lastDetectedAt: number | null;
  machines: MockMachineRuntimeRow[];
};

export const channelMembers = [
  { channelId: "ch-onboarding", memberId: "u1", memberType: "human", joinedAt: Date.now() },
  { channelId: "ch-onboarding", memberId: "agent-onboard", memberType: "agent", joinedAt: Date.now() },
  { channelId: "ch-onboarding", memberId: "agent-cloud", memberType: "agent", joinedAt: Date.now() },
];

function corsHeaders() {
  const baseURL = test.info().project.use.baseURL;
  const origin = baseURL ? new URL(String(baseURL)).origin : "http://localhost:3000";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };
}

export function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

export function noContent(status = 204) {
  return { status, headers: corsHeaders(), body: "" };
}

export function parseRgb(value: string | null) {
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
    const [r, g, b] = match
      .slice(1, 4)
      .map((token) => Math.round(Number(token) * 255));

    if (r == null || g == null || b == null || Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return [Math.min(255, Math.max(0, r)), Math.min(255, Math.max(0, g)), Math.min(255, Math.max(0, b))] as const;
  }

  match = value.match(/^#([0-9a-fA-F]{6})$/);
  if (match) {
    const hex = match[1];
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ] as const;
  }

  return null;
}

function luminanceChannel(value: number) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function contrast(foreground: readonly number[], background: readonly number[]) {
  const fg = 0.2126 * luminanceChannel(foreground[0]) + 0.7152 * luminanceChannel(foreground[1]) + 0.0722 * luminanceChannel(foreground[2]);
  const bg = 0.2126 * luminanceChannel(background[0]) + 0.7152 * luminanceChannel(background[1]) + 0.0722 * luminanceChannel(background[2]);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

type InlineTokenScope = {
  locator: (selector: string) => Locator;
};

export async function assertReadableInlineTokens(
  scope: InlineTokenScope,
  label: string,
  selector = "code:not(pre code)",
) {
  const samples = await scope.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0
          && rect.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && Boolean(node.textContent?.trim());
      })
      .map((node) => {
        const style = getComputedStyle(node);
        return {
          text: node.textContent?.replace(/\s+/g, " ").trim() ?? "",
          color: style.color,
          background: style.backgroundColor,
          borderColor: style.borderColor,
          className: node.getAttribute("class") ?? "",
        };
      }),
  );

  expect(samples.length, `${label} should render inline token samples`).toBeGreaterThan(0);
  for (const sample of samples) {
    const foreground = parseRgb(sample.color);
    const background = parseRgb(sample.background);
    expect(sample.background, `${label}: ${sample.text} should own a visible token background`).not.toBe("rgba(0, 0, 0, 0)");
    expect(sample.background, `${label}: ${sample.text} should not use legacy muted block`).not.toBe("rgb(108, 116, 112)");
    expect(sample.borderColor, `${label}: ${sample.text} should keep a visible token border`).not.toBe("rgba(0, 0, 0, 0)");
    expect(
      foreground && background ? contrast(foreground, background) : 0,
      `${label}: ${sample.text} contrast ${JSON.stringify(sample)}`,
    ).toBeGreaterThanOrEqual(4.5);
  }
}

export async function assertReadableCodeBlocks(
  scope: InlineTokenScope,
  label: string,
  selector = "pre",
) {
  const blocks = await scope.locator(selector).evaluateAll((nodes) =>
    nodes
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .filter((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0
          && rect.height > 0
          && style.display !== "none"
          && style.visibility !== "hidden"
          && Boolean(node.textContent?.trim());
      })
      .map((node) => {
        const style = getComputedStyle(node);
        const textNodes = [node, ...Array.from(node.querySelectorAll<HTMLElement>("*"))]
          .filter((sample) => {
            const rect = sample.getBoundingClientRect();
            const sampleStyle = getComputedStyle(sample);
            return rect.width > 0
              && rect.height > 0
              && sampleStyle.display !== "none"
              && sampleStyle.visibility !== "hidden"
              && Boolean(sample.textContent?.trim());
          })
          .slice(0, 12)
          .map((sample) => {
            const sampleStyle = getComputedStyle(sample);
            return {
              text: sample.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ?? "",
              color: sampleStyle.color,
              className: sample.getAttribute("class") ?? "",
            };
          });
        return {
          text: node.textContent?.replace(/\s+/g, " ").trim().slice(0, 80) ?? "",
          background: style.backgroundColor,
          borderColor: style.borderColor,
          className: node.getAttribute("class") ?? "",
          textNodes,
        };
      }),
  );

  expect(blocks.length, `${label} should render code block samples`).toBeGreaterThan(0);
  for (const block of blocks) {
    const background = parseRgb(block.background);
    expect(block.background, `${label}: ${block.text} should own a visible block background`).not.toBe("rgba(0, 0, 0, 0)");
    expect(block.background, `${label}: ${block.text} should not use legacy muted block`).not.toBe("rgb(108, 116, 112)");
    expect(block.background, `${label}: ${block.text} should not use fixed near-black zinc block`).not.toBe("rgb(9, 9, 11)");
    expect(block.borderColor, `${label}: ${block.text} should keep a visible block border`).not.toBe("rgba(0, 0, 0, 0)");

    for (const sample of block.textNodes) {
      const foreground = parseRgb(sample.color);
      expect(
        foreground && background ? contrast(foreground, background) : 0,
        `${label}: ${sample.text} contrast ${JSON.stringify({ block, sample })}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
}

export async function assertSelectedRadioOwnsSingleSurface(radio: Locator, label: string) {
  await expect(radio, `${label} should be checked`).toBeChecked();
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

  expect(metrics, `${label} radio root should exist`).not.toBeNull();
  expect(metrics!.className, `${label} should not carry page-level cyan selected classes`).not.toContain("border-cyan");
  expect(metrics!.className, `${label} should not carry page-level cyan selected classes`).not.toContain("bg-cyan");
  expect(metrics!.background, `${label} selected radio root should own the visible selected surface`).not.toBe("rgba(0, 0, 0, 0)");
  expect(metrics!.borderColor, `${label} selected radio root should own the selected border`).not.toBe("rgba(0, 0, 0, 0)");
  expect(metrics!.surfaceChildCount, `${label} should not nest a second selected surface`).toBeLessThanOrEqual(1);
}

export async function assertSelectedCheckboxOwnsSingleSurface(checkbox: Locator, label: string) {
  await expect(checkbox, `${label} should be checked`).toBeChecked();
  const metrics = await checkbox.evaluate((el) => {
    let root: HTMLElement | null = el.parentElement;
    while (root && root.getAttribute("data-slot") !== "checkbox") {
      root = root.parentElement;
    }
    root ??= el.closest<HTMLElement>('[data-slot="checkbox"]');
    if (!root) return null;
    const style = getComputedStyle(root);
    const className = typeof root.className === "string" ? root.className : "";
    const surfaceChildren = Array.from(root.children).filter((child) => {
      const childStyle = getComputedStyle(child);
      return childStyle.backgroundColor !== "rgba(0, 0, 0, 0)" && childStyle.backgroundColor !== "transparent";
    });
    return {
      background: style.backgroundColor,
      className,
      surfaceChildCount: surfaceChildren.length,
    };
  });

  expect(metrics, `${label} checkbox root should exist`).not.toBeNull();
  expect(metrics!.className, `${label} should not carry page-level cyan selected classes`).not.toContain("bg-cyan");
  expect(metrics!.className, `${label} should not force selected background with !bg`).not.toContain("!bg");
  expect(
    metrics!.background,
    `${label} selected checkbox root should own the visible selected surface: ${JSON.stringify(metrics)}`,
  ).not.toBe("rgba(0, 0, 0, 0)");
  expect(
    metrics!.surfaceChildCount,
    `${label} should not nest a second selected surface: ${JSON.stringify(metrics)}`,
  ).toBeLessThanOrEqual(1);
}

export async function setupMockWorkspace(
  page: Page,
  context: BrowserContext,
  options: {
    hasConnectedBridge?: boolean;
    channels?: MockWorkspaceChannel[];
    tasks?: typeof mockTasks;
    agentRuns?: typeof mockAgentRuns;
    machineKeys?: MockMachineKey[];
    createMachineKeyResponse?: { id: string; name: string; apiKey: string };
    failAgentPatch?: boolean;
    failMachineKeyRevoke?: boolean;
    agentPatches?: Array<{ agentId: string; patch: Record<string, unknown> }>;
    inboxResponse?: { items: Array<Record<string, unknown>>; count: number; totalCount?: number };
  } = {},
) {
  const hasConnectedBridge = options.hasConnectedBridge ?? true;
  let joinedDiscoverWorkflow = false;
  const joinedWorkflowIds = new Set<string>();
  const mockAgents = agents.map((agent) => ({ ...agent })) as MockAgent[];
  const baseURL = test.info().project.use.baseURL;
  const host = new URL(String(baseURL)).hostname;
  await context.addCookies([
    { name: "better-auth.session_token", value: "mock", domain: host, path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
  await page.route("**/api/auth/**", (route) => route.fulfill(json({
    user: { id: "u1", name: "Gene", email: "dai@live.cn" },
    session: { id: "s1", userId: "u1", expiresAt: new Date(Date.now() + 86_400_000).toISOString() },
  })));
  await page.route("**/api/me/api-token", (route) => route.fulfill(json({ token: "mock-token", expiresIn: 3600 })));
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    if (method === "OPTIONS") return route.fulfill(noContent());
    if (path === "/api/v1/servers/by-slug/demo") {
      const visibleChannels = (options.channels
        ?? [
          onboardingChannel,
          researchChannel,
          { ...discoverWorkflowChannel, isMember: joinedDiscoverWorkflow },
          dmChannel,
        ]).map((channel) => joinedWorkflowIds.has(channel.id) ? { ...channel, isMember: true } : channel);
      return route.fulfill(json({ server, channels: visibleChannels, agents: mockAgents }));
    }
    if (path === "/api/v1/me") return route.fulfill(json({
      subject: { kind: "user", userId: "u1" },
      servers: [server],
      personalServerId: "srv-demo",
      personalServerSlug: "demo",
      defaultServerId: "srv-demo",
      defaultServerSlug: "demo",
      hasConnectedBridge,
    }));
    if (path === "/api/v1/inbox") return route.fulfill(json(options.inboxResponse ?? {
      items: [
        {
          id: "task:task-onboarding-review",
          kind: "task",
          priority: 0,
          createdAt: Date.now() - 1_000,
          channelId: "ch-onboarding",
          channelName: "onboarding",
          channelType: "public",
          preview: "Review onboarding handoff",
          href: "/s/demo/channel/ch-onboarding",
          status: "in_review",
        },
        {
          id: "run:run-onboarding-waiting",
          kind: "agent_run",
          priority: 1,
          createdAt: Date.now() - 500,
          channelId: "ch-onboarding",
          channelName: "onboarding",
          channelType: "public",
          preview: "Onboarding Assistant is waiting for input",
          href: "/s/demo/agents/agent-onboard?tab=runs&runId=run-onboarding-waiting",
          status: "waiting_input",
          agentId: "agent-onboard",
          runtimeMode: "raltic",
        },
        {
          id: "run:run-research-failed",
          kind: "agent_run",
          priority: 2,
          createdAt: Date.now() - 750,
          channelId: "ch-research",
          channelName: "research",
          channelType: "public",
          preview: "Cloud Test Agent failed · [redacted token]",
          href: "/s/demo/agents/agent-cloud?tab=runs&runId=run-research-failed",
          status: "failed",
          agentId: "agent-cloud",
          runtimeMode: "raltic",
        },
        {
          id: "task:task-research-running",
          kind: "task",
          priority: 4,
          createdAt: Date.now() - 250,
          channelId: "ch-research",
          channelName: "research",
          channelType: "public",
          preview: "Collect research notes",
          href: "/s/demo/channel/ch-research",
          status: "in_progress",
        },
        {
          id: "dm:msg-handoff",
          kind: "dm",
          priority: 5,
          createdAt: Date.now() - 100,
          channelId: "dm-agent",
          channelName: "cloud-test",
          channelType: "dm",
          preview: "Cloud Test Agent left a handoff",
          href: "/s/demo/dm/dm-agent",
        },
      ],
      count: 5,
      totalCount: 5,
    }));
    if (path === "/api/v1/tasks" && method === "GET") return route.fulfill(json({ tasks: options.tasks ?? mockTasks }));
    if (path === "/api/v1/agent-runs" && method === "GET") return route.fulfill(json({ runs: options.agentRuns ?? mockAgentRuns }));
    if (path === "/api/v1/servers/srv-demo/channels/browse") return route.fulfill(json({
      channels: [
        { id: onboardingChannel.id, name: onboardingChannel.name, description: onboardingChannel.description, createdAt: onboardingChannel.createdAt, isMember: true },
        { id: researchChannel.id, name: researchChannel.name, description: researchChannel.description, createdAt: researchChannel.createdAt, isMember: true },
        { id: discoverWorkflowChannel.id, name: discoverWorkflowChannel.name, description: discoverWorkflowChannel.description, createdAt: discoverWorkflowChannel.createdAt, isMember: joinedDiscoverWorkflow || joinedWorkflowIds.has(discoverWorkflowChannel.id) },
      ],
    }));
    if (path === "/api/v1/agents") return route.fulfill(json({ agents: mockAgents }));
    if (path === "/api/v1/agent-runs/run-onboarding-waiting") return route.fulfill(json({
      run: mockAgentRuns.find((run) => run.id === "run-onboarding-waiting"),
    }));
    if (path === "/api/v1/agent-runs/run-research-failed") return route.fulfill(json({
      run: mockAgentRuns.find((run) => run.id === "run-research-failed"),
    }));
    if (path === "/api/v1/connectors") return route.fulfill(json({ connectors: [] }));
    if (path === "/api/v1/invites") return route.fulfill(json({ invites: [] }));
    if (path === "/api/v1/machine-keys" && method === "POST") {
      return route.fulfill(json(options.createMachineKeyResponse ?? {
        id: "mk-wizard",
        name: "My Mac",
        apiKey: "ck_wizard_1234567890",
      }));
    }
    if (path === "/api/v1/machine-keys" && method === "GET") {
      return route.fulfill(json({ keys: options.machineKeys ?? [] }));
    }
    if (path.startsWith("/api/v1/machine-keys/") && method === "DELETE") {
      if (options.failMachineKeyRevoke) {
        return route.fulfill(json({
          error: {
            code: "MACHINE_KEY_REVOKE_FAILED",
            message: "couldn't revoke runtime key",
          },
        }, 500));
      }
      return route.fulfill(json({ ok: true }));
    }
    if (path === "/api/v1/servers/srv-demo/members") return route.fulfill(json({ members: workspaceMembers, viewerRole: "owner" }));
    if (path === "/api/v1/agents/agent-cloud/workspace/list") {
      const requestedPath = url.searchParams.get("path") ?? ".";
      if (requestedPath === ".") {
        return route.fulfill(json({
          entries: [
            { name: "README.md", kind: "file" },
            { name: "src", kind: "dir" },
          ],
        }));
      }
      if (requestedPath === "src") {
        return route.fulfill(json({
          entries: [
            { name: "agent.ts", kind: "file" },
          ],
        }));
      }
      if (requestedPath.startsWith(".memory/")) {
        return route.fulfill(json({ entries: [] }));
      }
      return route.fulfill(json({ entries: [] }));
    }
    if (path === "/api/v1/agents/agent-cloud/workspace/read") {
      const requestedPath = url.searchParams.get("path") ?? "README.md";
      return route.fulfill(json({
        content: requestedPath === "src/agent.ts"
          ? "export async function run() {\\n  return 'ready';\\n}\\n"
          : "# Cloud workspace\\n\\nThis workspace is ready for review.\\n",
        truncated: false,
      }));
    }
    if (path === "/api/v1/agents/agent-cloud/workspace/terminal") {
      return route.fulfill(json({ tail: "$ raltic agent boot\\nready\\n" }));
    }
    if (path === "/api/v1/channels/ch-onboarding") return route.fulfill(json({
      channel: onboardingChannel,
      members: channelMembers,
      peer: null,
      viewerCanManage: true,
      viewerCanAddMembers: true,
    }));
    if (path === "/api/v1/channels/ch-research") return route.fulfill(json({
      channel: researchChannel,
      members: channelMembers,
      peer: null,
      viewerCanManage: true,
      viewerCanAddMembers: true,
    }));
    if (path === "/api/v1/channels/ch-new") return route.fulfill(json({
      channel: starterWorkflowChannel,
      members: channelMembers,
      peer: null,
      viewerCanManage: true,
      viewerCanAddMembers: true,
    }));
    if (path === "/api/v1/channels/ch-customer-risk") return route.fulfill(json({
      channel: discoverWorkflowChannel,
      members: [],
      peer: null,
      viewerCanManage: true,
      viewerCanAddMembers: true,
    }));
    if (path === "/api/v1/channels/dm-agent") return route.fulfill(json({
      channel: dmChannel,
      members: [],
      peer: dmChannel.peer,
      viewerCanManage: false,
      viewerCanAddMembers: false,
    }));
    if (path === "/api/v1/channels/ch-onboarding/messages") return route.fulfill(json({ messages: [] }));
    if (path === "/api/v1/channels/ch-research/messages") return route.fulfill(json({ messages: [] }));
    if (path === "/api/v1/channels/ch-new/messages") return route.fulfill(json({ messages: [] }));
    if (path === "/api/v1/channels/ch-customer-risk/messages") return route.fulfill(json({ messages: [] }));
    if (path === "/api/v1/channels/dm-agent/messages") return route.fulfill(json({ messages: [] }));
    if (path === "/api/v1/ws/token") return route.fulfill(json({ token: "ws-mock", wsUrl: "ws://127.0.0.1:9/ws/channel/ch-onboarding" }));
    if (path.endsWith("/read") && method === "POST") return route.fulfill(json({ ok: true }));
    if (path === "/api/v1/dm" && method === "POST") return route.fulfill(json({ channelId: "dm-agent", created: false }));
    if (path === "/api/v1/channels" && method === "POST") return route.fulfill(json({ id: "ch-new" }));
    if (path.startsWith("/api/v1/channels/") && path.endsWith("/join") && method === "POST") {
      const channelId = path.split("/").at(-2);
      if (channelId) joinedWorkflowIds.add(channelId);
      if (path === "/api/v1/channels/ch-customer-risk/join") joinedDiscoverWorkflow = true;
      return route.fulfill(json({ ok: true, alreadyMember: false }));
    }
    if (path.includes("/members") && method === "POST") return route.fulfill(json({ ok: true }));
    if (path.includes("/members/") && method === "DELETE") return route.fulfill(json({ ok: true }));
    if (path.includes("/agents/") && method === "PATCH") {
      if (options.failAgentPatch) {
        return route.fulfill(json({
          error: {
            code: "AGENT_UPDATE_FAILED",
            message: "couldn't update onboarding agent",
          },
        }, 500));
      }
      const agentId = path.split("/").at(-1);
      const target = mockAgents.find((agent) => agent.id === agentId);
      if (!target) {
        return route.fulfill(json({
          error: { code: "NOT_FOUND", message: "no such agent" },
        }, 404));
      }
      const patch = JSON.parse(route.request().postData() || "{}") as Partial<{
        displayName: string;
        description: string | null;
        systemPrompt: string | null;
        model: string;
        runtime: MockRuntimeId;
        runtimeMode: "bridge" | "raltic";
        avatarSeed: string | null;
      }>;
      options.agentPatches?.push({ agentId: target.id, patch: { ...patch } });
      const nextRuntime = patch.runtime ?? target.runtime;
      const nextRuntimeMode = patch.runtimeMode ?? target.runtimeMode;
      const nextModel = patch.model ?? target.model;
      const allowed = nextRuntimeMode === "bridge"
        ? BRIDGE_RUNTIME_MODELS[nextRuntime]
        : CLOUD_RUNTIME_MODELS;
      if (!allowed.includes(nextModel)) {
        return route.fulfill(json({
          error: {
            code: "INVALID_RUNTIME_MODEL",
            message: nextRuntimeMode === "bridge"
              ? `model "${nextModel}" is not valid for runtime "${nextRuntime}"`
              : `model "${nextModel}" is not valid for cloud agents`,
          },
        }, 400));
      }
      Object.assign(target, patch, { updatedAt: Date.now() });
      return route.fulfill(json({ ok: true }));
    }
    if (path === "/api/v1/agents" && method === "POST") return route.fulfill(json({ id: "agent-new" }));
    return route.fulfill(json({ error: { code: "MOCK_MISS", message: path } }, 404));
  });
}

export async function openMockChannel(page: Page, channelId = "ch-onboarding") {
  await page.goto(`/s/demo/channel/${channelId}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
}

export async function openMockDm(page: Page, channelId = "dm-agent") {
  await page.goto(`/s/demo/dm/${channelId}`, { waitUntil: "domcontentloaded" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await expect(page.getByTestId("workspace-shell")).toBeVisible({ timeout: 15_000 });
}

export async function clickVisible(page: Page, selector: string) {
  const target = page.locator(`${selector}:visible`).first();
  await expect(target, `click target exists: ${selector}`).toBeVisible({ timeout: 5_000 });
  await target.click();
}

export async function simulateVisualViewportHeight(page: Page, height: number) {
  await page.evaluate((nextHeight) => {
    const viewport = window.visualViewport;
    if (viewport) {
      Object.defineProperty(viewport, "height", {
        configurable: true,
        get: () => nextHeight,
      });
      viewport.dispatchEvent(new Event("resize"));
      return;
    }
    document.documentElement.style.setProperty("--raltic-visual-viewport-height", `${nextHeight}px`);
    window.dispatchEvent(new Event("resize"));
  }, height);
  await page.waitForFunction(
    (expected) => getComputedStyle(document.documentElement)
      .getPropertyValue("--raltic-visual-viewport-height")
      .trim() === `${expected}px`,
    height,
  );
}

export async function overlayMetrics(page: Page, dialogName: RegExp, role: "dialog" | "alertdialog" = "dialog") {
  const dialog = page.getByRole(role, { name: dialogName });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog.evaluate((el) => {
    const textNode = (text: string) => Array.from(el.querySelectorAll<HTMLElement>("*")).find((node) => node.textContent?.trim() === text);
    const close = el.querySelector<HTMLElement>('[data-slot="modal-close-trigger"]');
    const primary = el.querySelector<HTMLElement>(".button--primary:not(:disabled):not([aria-disabled='true']), .button--danger:not(:disabled):not([aria-disabled='true'])");
    const secondary = textNode("dai@live.cn") ?? textNode("olivia@example.com") ?? textNode("claude · @onboarding");
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const closeStyle = close ? getComputedStyle(close) : null;
    const primaryStyle = primary ? getComputedStyle(primary) : null;
    const secondaryStyle = secondary ? getComputedStyle(secondary) : null;
    return {
      rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      background: style.backgroundColor,
      color: style.color,
      close: close ? {
        color: closeStyle?.color ?? "",
        background: closeStyle?.backgroundColor ?? "",
        width: close.getBoundingClientRect().width,
        height: close.getBoundingClientRect().height,
      } : null,
      primary: primary ? {
        color: primaryStyle?.color ?? "",
        background: primaryStyle?.backgroundColor ?? "",
        text: primary.textContent?.trim() ?? "",
      } : null,
      secondary: secondary ? { color: secondaryStyle?.color ?? "", text: secondary.textContent?.trim() ?? "" } : null,
      topmost: (() => {
        const x = Math.floor(rect.left + rect.width / 2);
        const y = Math.floor(rect.top + Math.min(64, rect.height / 2));
        const top = document.elementFromPoint(x, y);
        return Boolean(top && el.contains(top));
      })(),
      hasOverlayScope: el.classList.contains("raltic-overlay-scope"),
      bodyScrollable: document.body.scrollHeight > document.body.clientHeight,
      documentScrollable: document.documentElement.scrollHeight > document.documentElement.clientHeight,
    };
  });
}

export function assertOverlayMetrics(metrics: Awaited<ReturnType<typeof overlayMetrics>>, options: { requireClose?: boolean } = {}) {
  const { requireClose = true } = options;
  expect(metrics.hasOverlayScope).toBe(true);
  expect(metrics.topmost).toBe(true);
  expect(metrics.bodyScrollable).toBe(false);
  expect(metrics.documentScrollable).toBe(false);
  expect(metrics.rect.left).toBeGreaterThanOrEqual(0);
  expect(metrics.rect.right).toBeLessThanOrEqual(metrics.viewport.width);
  expect(metrics.rect.bottom).toBeLessThanOrEqual(metrics.viewport.height + 1);
  if (requireClose) {
    expect(metrics.close?.width ?? 0).toBeGreaterThanOrEqual(36);
    expect(metrics.close?.height ?? 0).toBeGreaterThanOrEqual(36);
  }
  const background = parseRgb(metrics.background);
  const foreground = parseRgb(metrics.color);
  const closeForeground = parseRgb(metrics.close?.color ?? null);
  const closeBackground = parseRgb(metrics.close?.background ?? null);
  const primaryForeground = parseRgb(metrics.primary?.color ?? null);
  const primaryBackground = parseRgb(metrics.primary?.background ?? null);
  const secondary = parseRgb(metrics.secondary?.color ?? null);
  expect(background && foreground ? contrast(foreground, background) : 0).toBeGreaterThanOrEqual(4.5);
  if (requireClose || metrics.close) {
    expect(closeBackground && closeForeground ? contrast(closeForeground, closeBackground) : 0).toBeGreaterThanOrEqual(4.5);
  }
  if (primaryBackground && primaryForeground && background) {
    expect(contrast(primaryForeground, primaryBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(primaryBackground, background)).toBeGreaterThanOrEqual(3);
  }
  if (secondary) {
    expect(background ? contrast(secondary, background) : 0).toBeGreaterThanOrEqual(4.5);
  }
}

export async function openMembersDialog(page: Page) {
  await page.getByRole("button", { name: "Room actions" }).click();
  await page.getByRole("menuitem", { name: "Members" }).click();
  assertOverlayMetrics(await overlayMetrics(page, /Members of #onboarding/));
}
