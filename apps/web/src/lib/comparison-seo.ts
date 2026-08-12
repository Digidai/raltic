import type { FaqEntry } from "@/lib/seo";

// ───────────────────────────────────────────────────────────────────────────
// Comparison ("Raltic vs X") landing pages.
//
// These map to the homepage comparison table — same eight needs, same per-
// product verdicts — expanded into honest, standalone pages. Every page
// includes a "when X is the better choice" section: fairness builds trust,
// reads as higher-quality content to Google, and is the kind of balanced
// answer AI engines prefer to cite. Keep all claims true to each product's
// mainstream offering and to Raltic's truth audit (see the homepage).
// ───────────────────────────────────────────────────────────────────────────

export type Verdict = "yes" | "no" | "partial";

export type ComparisonRow = {
  need: string;
  them: Verdict;
  raltic: Verdict;
};

export type ComparisonPage = {
  slug: string;
  competitor: string;       // display name, e.g. "ChatGPT Business"
  category: string;         // what it is, e.g. "Hosted AI assistant"
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  intro: string;
  rows: ComparisonRow[];
  whereTheyStop: string[];
  whenThemBetter: string[];
  sourceLinks: Array<{ label: string; href: string }>;
  faqs: FaqEntry[];
};

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "chatgpt-for-work",
    competitor: "ChatGPT Business",
    category: "Hosted AI assistant",
    metaTitle: "Raltic vs ChatGPT Business: Team AI Workflows",
    metaDescription:
      "Compare ChatGPT Business shared AI workspaces with Raltic workflow rooms for cross-provider agents, explicit approvals, tasks, and run evidence.",
    keywords: [
      "ChatGPT for Work alternative",
      "ChatGPT Team alternative",
      "AI workflow vs ChatGPT",
      "team AI assistant comparison",
    ],
    eyebrow: "Raltic vs ChatGPT Business",
    h1: "Raltic vs ChatGPT Business.",
    intro:
      "ChatGPT Business provides a shared, secure workspace with projects, GPTs, and collaboration features. Raltic has a different center of gravity: cross-provider workflow rooms where briefs, agent runs, tasks, human approvals, and decisions stay together as an operational record.",
    rows: [
      { need: "Shared team workspace and project context", them: "yes", raltic: "yes" },
      { need: "Mix multiple AI providers in one place", them: "no", raltic: "yes" },
      { need: "Local bridge path with selected outputs shared", them: "no", raltic: "yes" },
      { need: "Multiple runtime agents in one workflow room", them: "partial", raltic: "yes" },
      { need: "Human approval gate before the work ships", them: "partial", raltic: "yes" },
      { need: "Tasks and run evidence tied to the decision", them: "partial", raltic: "yes" },
    ],
    whereTheyStop: [
      "ChatGPT Projects can hold shared context, but the product remains centered on OpenAI-hosted assistants rather than coordinating local and cloud runtimes from several providers.",
      "Approvals, tasks, and run records are not the primary organizing model; teams must decide how to turn a useful conversation into an accountable operating process.",
      "There is no Raltic-style bridge that lets a local CLI operate beside a private repo while Raltic receives only the messages and artifacts intentionally posted to the room.",
    ],
    whenThemBetter: [
      "You want a personal assistant for individual drafting, brainstorming, and Q&A — not a shared, auditable team process.",
      "You are happy on a single provider and do not need multiple specialist agents collaborating in one place.",
      "You do not need a human approval boundary before the agent's output reaches a customer or a repo.",
    ],
    sourceLinks: [
      {
        label: "OpenAI: Projects in ChatGPT",
        href: "https://help.openai.com/en/articles/10169521-projects-in-chatgpt",
      },
      {
        label: "OpenAI: ChatGPT Business",
        href: "https://help.openai.com/en/articles/8792828-what-is-chatgpt-team/",
      },
    ],
    faqs: [
      {
        q: "Is Raltic a replacement for ChatGPT?",
        a: "No. You keep your ChatGPT or Claude subscription and pay the provider directly. Raltic is the workflow room where those agents do accountable team work, with approvals and memory visible — not another chatbot.",
      },
      {
        q: "Can I use OpenAI models in Raltic?",
        a: "Yes. OpenAI Codex and Anthropic Claude are verified runtimes today, and they can run in the same workspace so you are not locked to one provider.",
      },
      {
        q: "Does Raltic mark up the AI I already pay for?",
        a: "No. You bring your own provider subscription or key and pay the AI provider directly. Raltic does not meter or mark up Claude or OpenAI usage.",
      },
    ],
  },
  {
    slug: "cursor",
    competitor: "Cursor / Copilot",
    category: "AI coding assistant",
    metaTitle: "Raltic vs Cursor / Copilot: Team AI Code Review",
    metaDescription:
      "Compare Cursor's AI coding environment with Raltic's shared code-review workflow rooms, local bridge path, tasks, approvals, and run evidence.",
    keywords: [
      "Cursor alternative for teams",
      "Copilot alternative",
      "AI code review without uploading code",
      "team AI workflow vs Cursor",
    ],
    eyebrow: "Raltic vs Cursor / Copilot",
    h1: "Raltic vs Cursor and Copilot.",
    intro:
      "Cursor and Copilot make developers faster inside the editor. Raltic is not an IDE: it is the shared operating room around agent work, where review findings, tasks, approvals, and run status are visible to the team. A bridge-hosted runtime reads the repo on its own machine; the runtime's AI provider may still receive context under that provider's terms, while Raltic receives only what is posted to the room.",
    rows: [
      { need: "Inline code completion and editor-native changes", them: "yes", raltic: "no" },
      { need: "Team-visible workflow room and decision record", them: "partial", raltic: "yes" },
      { need: "Repo read locally; selected outputs sent to Raltic", them: "no", raltic: "yes" },
      { need: "Multiple specialist agents in one workflow", them: "no", raltic: "yes" },
      { need: "Human approval gate before the work ships", them: "no", raltic: "yes" },
      { need: "Mix multiple AI providers in one place", them: "partial", raltic: "yes" },
    ],
    whereTheyStop: [
      "The primary surface is the developer's editor, so teams still need a shared place for non-engineers, approval owners, and a durable decision record.",
      "They are built for writing code, not for coordinating a multi-step agent workflow with approvals across a team.",
      "There is no workflow room where non-engineers can see the agent's output and own the approval decision.",
    ],
    whenThemBetter: [
      "You want inline AI completions and edits while actively writing code — that is exactly what an AI IDE is for.",
      "The work is a solo developer task that never needs team visibility or a human approval gate.",
      "You do not need several agents (research, reviewer, ops) collaborating in one accountable space.",
    ],
    sourceLinks: [
      {
        label: "Cursor: Security",
        href: "https://www.cursor.com/security",
      },
      {
        label: "Cursor: Privacy Mode",
        href: "https://docs.cursor.com/account/privacy",
      },
    ],
    faqs: [
      {
        q: "Is Raltic an AI code editor like Cursor?",
        a: "No. Raltic is a workflow room, not an IDE. For code review it connects a verified local runtime such as Claude Code or Codex through the bridge, so the editor stays yours while the findings and tasks become team-visible.",
      },
      {
        q: "Does Raltic upload my repository to review code?",
        a: "For bridge-hosted agents, the repository is read on the machine running your existing AI CLI. Raltic receives only the messages, artifacts, and run status posted into the room. The AI CLI may send code or context to its own model provider under that provider's privacy terms.",
      },
      {
        q: "Can I still use Cursor or Copilot alongside Raltic?",
        a: "Yes. Keep your editor assistant for writing code, and use Raltic for the team workflow around agent output — they solve different problems.",
      },
    ],
  },
  {
    slug: "slack-ai-bots",
    competitor: "Slack + AI bots",
    category: "Team chat with bolt-on AI",
    metaTitle: "Raltic vs Slack + AI Bots: AI Workflow Rooms",
    metaDescription:
      "Compare Slack's AI and agent platform with Raltic's purpose-built workflow rooms for run evidence, explicit approvals, tasks, and local runtimes.",
    keywords: [
      "Slack AI bot alternative",
      "AI agents in Slack alternative",
      "workflow rooms vs Slack",
      "team AI workflow platform",
    ],
    eyebrow: "Raltic vs Slack + AI bots",
    h1: "Raltic vs Slack and AI bots.",
    intro:
      "Slack now supports AI features, third-party agents, Agentforce, and workflow automation inside the collaboration platform. Raltic is narrower and workflow-first: one room per agent-assisted process, where the brief, run state, tasks, approval, and result stay together.",
    rows: [
      { need: "General-purpose team communication", them: "yes", raltic: "no" },
      { need: "Third-party AI agents in team conversations", them: "yes", raltic: "yes" },
      { need: "No-code workflow automation and triggers", them: "yes", raltic: "partial" },
      { need: "Run evidence, tasks, and approval in one room", them: "partial", raltic: "yes" },
      { need: "Local CLI runtime beside a private repo", them: "partial", raltic: "yes" },
      { need: "Workflow-specific reusable decision record", them: "partial", raltic: "yes" },
    ],
    whereTheyStop: [
      "Slack's primary model is organization-wide communication; Raltic starts from a bounded workflow with an explicit brief, run, task, approval, and result.",
      "Agent capabilities depend on the installed app or platform integration, while Raltic exposes one runtime and workflow model across local and cloud agents.",
      "A Raltic bridge runtime is a first-party path for local CLI agents; Slack integrations can be built for local systems, but that is not the default end-user setup.",
    ],
    whenThemBetter: [
      "You only need light, occasional AI help inside conversations you are already having.",
      "Your team has no repeatable agent-assisted process that needs an approval gate and a reusable record.",
      "You are not concerned about consolidating agent work, approvals, or runtime control in one place.",
    ],
    sourceLinks: [
      {
        label: "Slack: AI",
        href: "https://slack.com/features/ai",
      },
      {
        label: "Slack: Agentic Platform",
        href: "https://slack.com/features/Agentic-Platform",
      },
    ],
    faqs: [
      {
        q: "Does Raltic replace Slack?",
        a: "Raltic is not general team chat. It is a workflow room for agent-assisted work — the brief, agent updates, approvals, tasks, and final decision in one place. Many teams keep Slack for conversation and use Raltic for the workflows that need accountability.",
      },
      {
        q: "How is a workflow room different from a Slack channel with a bot?",
        a: "A channel is organized around messages; a workflow room is organized around a process getting done — with a visible approval boundary, multiple specialist agents, and a result that becomes reusable team memory.",
      },
      {
        q: "Can I keep my code private with Raltic?",
        a: "For bridge-hosted agents, the repository is read on the machine running the runtime and Raltic receives only posted outputs. The underlying AI CLI may still send context to its model provider under that provider's privacy terms.",
      },
    ],
  },
  {
    slug: "microsoft-365-copilot",
    competitor: "Microsoft 365 Copilot",
    category: "Suite-native AI and agents",
    metaTitle: "Raltic vs Microsoft 365 Copilot Agents",
    metaDescription:
      "Compare Microsoft 365 Copilot agents in Teams with Raltic workflow rooms for mixed runtimes, local agents, tasks, run evidence, and review.",
    keywords: ["Microsoft 365 Copilot alternative", "Copilot agents comparison", "Teams AI agents", "AI workflow room"],
    eyebrow: "Raltic vs Microsoft 365 Copilot",
    h1: "Raltic vs Microsoft 365 Copilot agents.",
    intro:
      "Microsoft 365 Copilot brings agents into the Microsoft 365 and Teams environment with access governed by organizational data and permissions. Raltic is a smaller, runtime-neutral workflow layer: it coordinates verified local Claude Code and Codex agents with managed cloud agents, tasks, evidence, and human review in one bounded room.",
    rows: [
      { need: "Native Microsoft 365 and Teams experience", them: "yes", raltic: "no" },
      { need: "Agents grounded in Microsoft 365 organizational data", them: "yes", raltic: "partial" },
      { need: "Verified local Claude Code and Codex bridge runtimes", them: "no", raltic: "yes" },
      { need: "Provider-neutral agents in one workflow room", them: "partial", raltic: "yes" },
      { need: "Tasks, run evidence, and review tied to one process", them: "partial", raltic: "yes" },
      { need: "Lightweight start outside a Microsoft tenant", them: "no", raltic: "yes" },
    ],
    whereTheyStop: [
      "Microsoft 365 Copilot is optimized for the Microsoft 365 data, identity, and collaboration ecosystem rather than acting as a neutral coordination layer around local developer runtimes.",
      "Teams chats and channels can include Copilot agents, but Raltic makes the bounded workflow, task state, run evidence, and human-owned decision its primary organizing model.",
      "Raltic's verified bridge path lets Claude Code and Codex work from their local runtime machines and post selected outputs into the shared room.",
    ],
    whenThemBetter: [
      "Your organization is standardized on Microsoft 365 and wants agents deeply grounded in that tenant's data and permission model.",
      "The main use case is assistance inside Teams, Outlook, Word, Excel, or other Microsoft 365 applications.",
      "You do not need local Claude Code or Codex runtimes coordinated with a provider-neutral workflow room.",
    ],
    sourceLinks: [
      { label: "Microsoft: Agents overview", href: "https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/agents-overview" },
      { label: "Microsoft: Add Copilot agents to Teams chats", href: "https://support.microsoft.com/en-us/teams/chat-channels/find-and-add-copilot-agents-to-group-chats-in-microsoft-teams" },
    ],
    faqs: [
      { q: "Does Raltic replace Microsoft Teams?", a: "No. Teams is a broad communication and Microsoft 365 collaboration platform. Raltic is a bounded workflow room for agent-assisted work and review." },
      { q: "When is Microsoft 365 Copilot the stronger choice?", a: "Choose it when Microsoft 365 data, identity, and in-app assistance are the center of the workflow." },
      { q: "Can Raltic coordinate local coding agents?", a: "Yes. Claude Code and OpenAI Codex are verified Raltic bridge runtimes." },
    ],
  },
  {
    slug: "asana-ai-studio",
    competitor: "Asana AI Studio",
    category: "No-code AI workflow builder",
    metaTitle: "Raltic vs Asana AI Studio: Agent Workflows",
    metaDescription:
      "Compare Asana AI Studio no-code workflows with Raltic rooms for local and cloud agents, shared evidence, task handoffs, and human review.",
    keywords: ["Asana AI Studio alternative", "Asana AI workflows", "AI workflow platform comparison", "agent workflow room"],
    eyebrow: "Raltic vs Asana AI Studio",
    h1: "Raltic vs Asana AI Studio.",
    intro:
      "Asana AI Studio lets teams design no-code smart workflows around Asana work, including triggers, classification, routing, and review steps. Raltic starts from a shared room where local and cloud agents participate directly, post evidence and artifacts, claim tasks, and bring a bounded result to human review.",
    rows: [
      { need: "No-code triggers and workflow configuration", them: "yes", raltic: "partial" },
      { need: "Portfolio and project management system", them: "yes", raltic: "no" },
      { need: "Verified local Claude Code and Codex runtimes", them: "no", raltic: "yes" },
      { need: "Human and agents sharing one workflow conversation", them: "partial", raltic: "yes" },
      { need: "Posted evidence and run state beside the decision", them: "partial", raltic: "yes" },
      { need: "Start from a guided workflow room", them: "partial", raltic: "yes" },
    ],
    whereTheyStop: [
      "Asana AI Studio is centered on constructing smart workflows inside Asana's work-management model; Raltic is centered on a room where agent work and human review unfold together.",
      "Raltic supports verified local CLI runtimes as first-class participants rather than limiting execution to an in-product AI workflow builder.",
      "Raltic is not a portfolio-management replacement; teams can keep broader project planning in Asana or Linear and use Raltic for the agent-assisted operating record.",
    ],
    whenThemBetter: [
      "Asana is already your system of record and the main goal is adding no-code AI steps to existing projects and rules.",
      "You need portfolio, project, goal, and workload management in the same product.",
      "You prioritize trigger-driven automation over coordinating local AI runtimes and conversational evidence review.",
    ],
    sourceLinks: [
      { label: "Asana: AI Studio", href: "https://asana.com/product/ai/ai-studio" },
      { label: "Asana: AI Studio smart workflows", href: "https://help.asana.com/s/article/ai-studio-smart-workflows" },
      { label: "Asana: Human-in-the-loop workflows", href: "https://help.asana.com/s/article/ai-studio-human-in-the-loop" },
    ],
    faqs: [
      { q: "Does Raltic replace Asana?", a: "No. Asana is a comprehensive work-management platform. Raltic focuses on the shared workflow and review record around AI agent work." },
      { q: "Does Raltic support event-trigger automation?", a: "Raltic does not currently claim a shipped no-code trigger builder comparable to Asana AI Studio." },
      { q: "Which is better for local coding agents?", a: "Raltic is designed to coordinate verified Claude Code and Codex bridge runtimes with team-visible outputs." },
    ],
  },
  {
    slug: "notion-ai-agent",
    competitor: "Notion AI and Notion Agent",
    category: "Workspace-native AI",
    metaTitle: "Raltic vs Notion AI Agent: Workflow Comparison",
    metaDescription:
      "Compare Notion Agent's workspace-native creation and research with Raltic rooms for mixed runtimes, task state, run evidence, and approvals.",
    keywords: ["Notion AI alternative", "Notion Agent comparison", "AI workspace agents", "agent workflow platform"],
    eyebrow: "Raltic vs Notion AI and Notion Agent",
    h1: "Raltic vs Notion AI and Notion Agent.",
    intro:
      "Notion Agent can create and edit pages and databases, perform multi-step work, and use context from a user's Notion workspace and connected apps within that user's permissions. Raltic focuses on coordinating multiple local and cloud agent participants through a visible workflow, task, run, evidence, and review model.",
    rows: [
      { need: "Create and edit rich workspace documents", them: "yes", raltic: "partial" },
      { need: "Search and act across Notion workspace context", them: "yes", raltic: "partial" },
      { need: "Verified local Claude Code and Codex runtimes", them: "no", raltic: "yes" },
      { need: "Multiple runtime agents as visible participants", them: "partial", raltic: "yes" },
      { need: "Task and run state tied to human review", them: "partial", raltic: "yes" },
      { need: "Bounded workflow room rather than document workspace", them: "no", raltic: "yes" },
    ],
    whereTheyStop: [
      "Notion Agent is strongest inside Notion's document, database, and enterprise-search environment; Raltic is organized around an agent-assisted process and its review state.",
      "Raltic treats local bridge runtimes and managed cloud agents as workflow participants with attributed messages, tasks, and run status.",
      "The Raltic Notion connector can keep Notion in the toolchain with encrypted credentials and per-agent grants, but does not duplicate all of Notion Agent's native workspace editing experience.",
    ],
    whenThemBetter: [
      "Your team's source of truth is Notion and the core need is creating, editing, or searching pages and databases in place.",
      "You want an AI agent that inherits the current user's Notion permissions and works primarily within that workspace.",
      "You do not need local coding agents or a separate task-and-run record around multi-runtime work.",
    ],
    sourceLinks: [
      { label: "Notion: Notion Agent", href: "https://www.notion.com/help/notion-agent" },
      { label: "Notion: AI security and privacy", href: "https://www.notion.com/help/enterprise-search-security-and-privacy-practices" },
    ],
    faqs: [
      { q: "Does Raltic replace Notion?", a: "No. Notion can remain the document and knowledge workspace. Raltic coordinates the agent-assisted workflow and can connect to Notion through a scoped connector." },
      { q: "Which product is better for editing Notion databases?", a: "Notion Agent is the better native choice for work centered on Notion pages and databases." },
      { q: "Which product supports Claude Code and Codex as local participants?", a: "Raltic verifies both through its local bridge runtime." },
    ],
  },
  {
    slug: "n8n-ai",
    competitor: "n8n AI workflows",
    category: "Automation and integration platform",
    metaTitle: "Raltic vs n8n AI: Agent Workflow Comparison",
    metaDescription:
      "Compare n8n's AI workflow automation with Raltic's collaborative rooms for local and cloud agents, shared evidence, tasks, and human decisions.",
    keywords: ["n8n AI alternative", "n8n vs agent workspace", "AI workflow automation comparison", "human in the loop agents"],
    eyebrow: "Raltic vs n8n AI workflows",
    h1: "Raltic vs n8n AI workflows.",
    intro:
      "n8n is a workflow automation platform that combines integrations, AI steps, human-in-the-loop checks, and inspectable executions. Raltic is collaboration-first: humans and local or cloud agents share a room where the brief, messages, tasks, posted artifacts, review state, and final decision remain together.",
    rows: [
      { need: "Visual automation builder and event triggers", them: "yes", raltic: "no" },
      { need: "Broad integration and API workflow catalog", them: "yes", raltic: "partial" },
      { need: "Execution inspection and human checks", them: "yes", raltic: "yes" },
      { need: "Human and agents sharing one conversational room", them: "partial", raltic: "yes" },
      { need: "Verified local Claude Code and Codex participation", them: "partial", raltic: "yes" },
      { need: "Reusable decision and task record as primary surface", them: "partial", raltic: "yes" },
    ],
    whereTheyStop: [
      "n8n is optimized for building and running automations across systems; Raltic is optimized for people and agents coordinating a bounded workflow and reviewing its evidence.",
      "Raltic's bridge provides a supported participant model for Claude Code and Codex rather than asking teams to build custom automation nodes around each local runtime.",
      "Raltic does not match n8n's breadth of event triggers or integrations and should not be chosen as a general automation replacement.",
    ],
    whenThemBetter: [
      "You need a visual automation builder with many integrations, triggers, branches, and deterministic system-to-system steps.",
      "The workflow should run mostly unattended and can be represented as an execution graph.",
      "Your primary need is integration automation rather than a shared operating room for human and agent participants.",
    ],
    sourceLinks: [
      { label: "n8n: AI workflow automation", href: "https://n8n.io/ai/" },
      { label: "n8n: Human-in-the-loop for tool calls", href: "https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/" },
    ],
    faqs: [
      { q: "Does Raltic replace n8n?", a: "No. n8n is stronger for trigger-driven integration automation. Raltic is designed for shared agent work, evidence, tasks, and human decisions." },
      { q: "Can n8n support human review?", a: "Yes. n8n documents human-in-the-loop checks for AI tool calls and provides execution inspection." },
      { q: "When is Raltic the better fit?", a: "Choose Raltic when local and cloud agents need to collaborate with people in a workflow room and the reviewable decision record is the primary product surface." },
    ],
  },
];

export function getComparisonPage(slug: string | null | undefined): ComparisonPage | null {
  if (!slug) return null;
  return COMPARISON_PAGES.find((page) => page.slug === slug) ?? null;
}
