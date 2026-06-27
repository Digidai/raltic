import type { FaqEntry } from "@/lib/seo";

// ───────────────────────────────────────────────────────────────────────────
// Per-connector integration pages (/connectors/[connector]).
//
// Truth bar (mirrors the /connectors hub): connectors today are PAT storage
// (envelope-encrypted at rest) + per-agent grants + the agent tools that read
// those credentials. NOT shipped: webhook triggers, scheduled runs, workflow
// automation. Keep every page honest about that boundary.
// ───────────────────────────────────────────────────────────────────────────

export type ConnectorPage = {
  slug: string;
  name: string;          // "GitHub"
  icon: "github" | "linear" | "notion";
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  h1: string;
  intro: string;
  capabilities: string[];     // what an agent granted this connector can do
  goodFirstWorkflow: string;  // one concrete starter
  faqs: FaqEntry[];
};

// Each step carries a short title (used as the HowToStep `name` for richer
// structured-data extraction) plus the full instruction `text`.
const SETUP_STEPS = [
  {
    title: "Store the token once",
    text: "In workspace settings → Connectors, paste a personal access token for the service once.",
  },
  {
    title: "Grant the connector per agent",
    text: "In each agent's settings, grant the connector. Grants are per-agent — one agent's access does not leak to another.",
  },
  {
    title: "Use it in a workflow room",
    text: "The agent gets tools to call that service. Mention it in a workflow room and it uses the token to do the work.",
  },
  {
    title: "Revoke access instantly",
    text: "Revoke any grant or token instantly; the agent loses access immediately while room history stays intact.",
  },
] as const;

export const CONNECTOR_SETUP_STEPS = SETUP_STEPS;

// Shared, honest boundary shown on every connector page.
export const CONNECTOR_NOT_SHIPPED =
  "Connectors today give agents tool access — they do not react to external events. Webhook triggers, scheduled runs, and PR-triggered automation are not shipped yet; they are on the roadmap.";

export const CONNECTOR_PAGES: ConnectorPage[] = [
  {
    slug: "github",
    name: "GitHub",
    icon: "github",
    metaTitle: "GitHub Connector for AI Agents",
    metaDescription:
      "Give Raltic agents scoped GitHub access: read repos, files, and PR diffs, then file issues, comment, and open PRs — with a per-agent, encrypted token.",
    keywords: [
      "AI agent GitHub access",
      "GitHub AI agent connector",
      "AI PR review GitHub",
      "Raltic GitHub integration",
    ],
    eyebrow: "GitHub connector",
    h1: "Connect GitHub to your AI agents.",
    intro:
      "Grant an agent scoped GitHub access and it can pull repo and file context, read pull-request diffs, and draft issues, comments, and pull requests the way you would from the gh CLI — inside a workflow room the whole team can see, with a token that stays encrypted at rest.",
    capabilities: [
      "Read repositories and any file at a branch, tag, or commit to ground the agent in the real code.",
      "Read the files and diffs in a pull request to review a change without cloning the repo.",
      "Open pull requests and post issue and PR comments — visible in the room so a human stays in the loop on what ships.",
    ],
    goodFirstWorkflow:
      "Pair the GitHub connector with the local code-review workflow: a bridge runtime reads the diff locally, while GitHub context and the team's review record live in the room.",
    faqs: [
      {
        q: "Does the GitHub connector upload my source code to Raltic?",
        a: "The connector reads GitHub through your token for repo, file, and pull-request context. For deep code review, pair it with a bridge runtime so the diff is read on your own machine — Raltic receives only what the agent posts into the room.",
      },
      {
        q: "How is my GitHub token stored?",
        a: "It is envelope-encrypted at rest and only used when an agent you explicitly granted it to makes a request. Revoke the grant or the token at any time and access ends immediately.",
      },
      {
        q: "Can a Raltic agent run on every new pull request automatically?",
        a: "Not yet. Connectors give agents tool access, not event triggers — webhook and PR-triggered automation are on the roadmap, not shipped today.",
      },
    ],
  },
  {
    slug: "linear",
    name: "Linear",
    icon: "linear",
    metaTitle: "Linear Connector for AI Agents",
    metaDescription:
      "Let Raltic agents read and create Linear issues and comment on them, with per-agent grants and encrypted token storage. Triage from a workflow room.",
    keywords: [
      "AI agent Linear integration",
      "Linear AI agent",
      "AI issue triage Linear",
      "Raltic Linear connector",
    ],
    eyebrow: "Linear connector",
    h1: "Connect Linear to your AI agents.",
    intro:
      "Grant an agent Linear access and it can read and create issues and comment on them — so triage and follow-ups happen inside a workflow room instead of a side conversation, with the human approval boundary kept visible.",
    capabilities: [
      "List and read issues, filtered by team or state, so an agent has the current picture.",
      "Create issues and comment on existing ones to file what a discussion surfaced.",
      "Turn workflow outcomes into tracked Linear tickets, created from the room where the evidence lives.",
    ],
    goodFirstWorkflow:
      "Use Linear with the customer-risk or launch-readiness workflow so the agent's follow-ups land as real tickets tied to the room where the evidence lives.",
    faqs: [
      {
        q: "What can the Linear connector do?",
        a: "An agent granted the Linear connector can list and read issues, create new ones, and comment on them — useful for triage and turning workflow outcomes into tracked tickets.",
      },
      {
        q: "Is my Linear token secure?",
        a: "Yes. Tokens are envelope-encrypted at rest, scoped per agent, and revocable instantly. An agent only uses the token when it makes a request you set up.",
      },
      {
        q: "Will agents change my Linear tickets without review?",
        a: "Agents can create issues and add comments — they can't silently edit or close your existing tickets. Raltic is built around a visible approval boundary, and you control which agents have the connector at all.",
      },
    ],
  },
  {
    slug: "notion",
    name: "Notion",
    icon: "notion",
    metaTitle: "Notion Connector for AI Agents",
    metaDescription:
      "Let Raltic agents search Notion pages and databases, read page content, and create new pages — with per-agent grants and encrypted token storage.",
    keywords: [
      "AI agent Notion integration",
      "Notion AI agent",
      "AI draft Notion pages",
      "Raltic Notion connector",
    ],
    eyebrow: "Notion connector",
    h1: "Connect Notion to your AI agents.",
    intro:
      "Grant an agent Notion access and it can search across your pages and databases, read page content, and create new pages — so it pulls in the docs you reference and can draft pages from a discussion, all inside a workflow room where the result becomes reusable team memory.",
    capabilities: [
      "Read page content as clean text so an agent can ground its work in your existing docs.",
      "Search across the pages and databases the integration can see to find the right doc.",
      "Create new pages under a parent so a discussion becomes a written, reusable doc.",
    ],
    goodFirstWorkflow:
      "Pair Notion with the research-synthesis workflow so sources and the final decision memo are written back where the rest of the team already reads.",
    faqs: [
      {
        q: "Can a Raltic agent write to my Notion workspace?",
        a: "Yes, if you grant it. With the Notion connector an agent can search, read pages, and create new pages — useful for pulling docs into a workflow or drafting pages from a discussion. You choose which agents have access.",
      },
      {
        q: "How is my Notion token handled?",
        a: "It is envelope-encrypted at rest and only used when a granted agent makes a request. Per-agent grants and instant revoke keep access scoped and reversible.",
      },
      {
        q: "Does the Notion connector run on a schedule?",
        a: "No. Connectors are tool access for agents, not scheduled jobs. Scheduled and event-triggered runs are on the roadmap, not shipped yet.",
      },
    ],
  },
];

export function getConnectorPage(slug: string | null | undefined): ConnectorPage | null {
  if (!slug) return null;
  return CONNECTOR_PAGES.find((p) => p.slug === slug) ?? null;
}
