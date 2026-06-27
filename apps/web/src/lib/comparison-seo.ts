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
  competitor: string;       // display name, e.g. "ChatGPT for Work"
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
  faqs: FaqEntry[];
};

export const COMPARISON_PAGES: ComparisonPage[] = [
  {
    slug: "chatgpt-for-work",
    competitor: "ChatGPT for Work",
    category: "Hosted AI assistant",
    metaTitle: "Raltic vs ChatGPT for Work: Team AI Workflows",
    metaDescription:
      "ChatGPT for Work is a hosted assistant for solo chats. Raltic is the shared workflow room where humans and multiple AI agents do accountable team work.",
    keywords: [
      "ChatGPT for Work alternative",
      "ChatGPT Team alternative",
      "AI workflow vs ChatGPT",
      "team AI assistant comparison",
    ],
    eyebrow: "Raltic vs ChatGPT for Work",
    h1: "Raltic vs ChatGPT for Work.",
    intro:
      "ChatGPT for Work gives each person a strong hosted assistant. Raltic is the layer above that: a shared workflow room where the agent's output, the human approval, and the resulting decision stay visible to the whole team instead of trapped in one person's private chat.",
    rows: [
      { need: "Workflow outputs reach the whole team", them: "no", raltic: "yes" },
      { need: "Mix multiple AI providers in one place", them: "no", raltic: "yes" },
      { need: "Your source code never uploads", them: "no", raltic: "yes" },
      { need: "Multiple specialist agents in one workflow", them: "no", raltic: "yes" },
      { need: "Human approval gate before the work ships", them: "partial", raltic: "yes" },
      { need: "No per-seat markup on the AI you already pay for", them: "no", raltic: "yes" },
    ],
    whereTheyStop: [
      "Work happens in private one-to-one chats, so useful output rarely becomes team memory the next person can find.",
      "It is a single-provider assistant — you cannot run an Anthropic Claude agent and an OpenAI agent side by side in the same room.",
      "Code and context are sent to the hosted model; there is no bridge path that keeps a private repo on your own machine.",
    ],
    whenThemBetter: [
      "You want a personal assistant for individual drafting, brainstorming, and Q&A — not a shared, auditable team process.",
      "You are happy on a single provider and do not need multiple specialist agents collaborating in one place.",
      "You do not need a human approval boundary before the agent's output reaches a customer or a repo.",
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
      "Cursor and Copilot are AI pair-programmers in the editor. Raltic is the team room around agent work, with local code review that keeps your repo private.",
    keywords: [
      "Cursor alternative for teams",
      "Copilot alternative",
      "AI code review without uploading code",
      "team AI workflow vs Cursor",
    ],
    eyebrow: "Raltic vs Cursor / Copilot",
    h1: "Raltic vs Cursor and Copilot.",
    intro:
      "Cursor and Copilot make one developer faster inside the editor. Raltic is not an IDE — it is the shared room where agent work like code review becomes visible to the team, with findings, tasks, and a run record the whole team can inspect, and with a local-runtime path that keeps private repo context off hosted models.",
    rows: [
      { need: "Outputs reach the whole team, not one editor", them: "no", raltic: "yes" },
      { need: "Your source code never uploads", them: "partial", raltic: "yes" },
      { need: "Provider keys never leave your machine", them: "partial", raltic: "yes" },
      { need: "Multiple specialist agents in one workflow", them: "no", raltic: "yes" },
      { need: "Human approval gate before the work ships", them: "no", raltic: "yes" },
      { need: "Mix multiple AI providers in one place", them: "partial", raltic: "yes" },
    ],
    whereTheyStop: [
      "They live in one developer's editor, so a review or refactor stays in that session instead of becoming a shared, searchable team record.",
      "They are built for writing code, not for coordinating a multi-step agent workflow with approvals across a team.",
      "There is no workflow room where non-engineers can see the agent's output and own the approval decision.",
    ],
    whenThemBetter: [
      "You want inline AI completions and edits while actively writing code — that is exactly what an AI IDE is for.",
      "The work is a solo developer task that never needs team visibility or a human approval gate.",
      "You do not need several agents (research, reviewer, ops) collaborating in one accountable space.",
    ],
    faqs: [
      {
        q: "Is Raltic an AI code editor like Cursor?",
        a: "No. Raltic is a workflow room, not an IDE. For code review it connects a verified local runtime such as Claude Code or Codex through the bridge, so the editor stays yours while the findings and tasks become team-visible.",
      },
      {
        q: "Does Raltic upload my repository to review code?",
        a: "No. For bridge-hosted agents, code is read on the same machine as your repo using your existing AI CLI. Raltic receives only the messages, artifacts, and run status the agent chooses to post into the room.",
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
      "Slack plus AI bots stays chat-first, with agent work scattered across bots. Raltic is workflow-first: one accountable room per process.",
    keywords: [
      "Slack AI bot alternative",
      "AI agents in Slack alternative",
      "workflow rooms vs Slack",
      "team AI workflow platform",
    ],
    eyebrow: "Raltic vs Slack + AI bots",
    h1: "Raltic vs Slack and AI bots.",
    intro:
      "Bolting AI bots onto Slack keeps everything chat-first: helpful in the moment, but the agent work scatters across threads and per-vendor bots with no shared approval or memory. Raltic is workflow-first — one accountable room per process, where the brief, the agent run, the human approval, and the result stay together.",
    rows: [
      { need: "Workflow outputs reach the whole team", them: "partial", raltic: "yes" },
      { need: "Mix multiple AI providers in one place", them: "partial", raltic: "yes" },
      { need: "Your source code never uploads", them: "no", raltic: "yes" },
      { need: "Multiple specialist agents in one workflow", them: "no", raltic: "yes" },
      { need: "Off-board a teammate in one click", them: "no", raltic: "yes" },
      { need: "Provider keys never leave your machine", them: "no", raltic: "yes" },
    ],
    whereTheyStop: [
      "Chat is organized around messages passing by, not around a repeatable process with a visible approval boundary.",
      "Each AI bot is its own vendor and surface, so there is no single place that holds the workflow's approvals and memory.",
      "There is no local-execution path — sensitive code and provider keys cannot stay on your machine the way a bridge runtime allows.",
    ],
    whenThemBetter: [
      "You only need light, occasional AI help inside conversations you are already having.",
      "Your team has no repeatable agent-assisted process that needs an approval gate and a reusable record.",
      "You are not concerned about consolidating agent work, approvals, or runtime control in one place.",
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
        a: "Yes. For bridge-hosted agents, source code and provider keys stay on the machine running the runtime. Only the outputs the agent chooses to share cross into the room.",
      },
    ],
  },
];

export function getComparisonPage(slug: string | null | undefined): ComparisonPage | null {
  if (!slug) return null;
  return COMPARISON_PAGES.find((page) => page.slug === slug) ?? null;
}
