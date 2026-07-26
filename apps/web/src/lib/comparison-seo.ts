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
];

export function getComparisonPage(slug: string | null | undefined): ComparisonPage | null {
  if (!slug) return null;
  return COMPARISON_PAGES.find((page) => page.slug === slug) ?? null;
}
