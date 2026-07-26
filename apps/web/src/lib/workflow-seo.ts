import { WORKFLOW_STARTERS, type WorkflowStarterKey, type WorkflowStarterTemplate } from "@/lib/workflow-starters";
import type { FaqEntry } from "@/lib/seo";

export type WorkflowSeoPage = {
  starter: WorkflowStarterTemplate;
  path: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  searchIntent: string;
  audience: string;
  proofLabel: string;
  keywords: string[];
  steps: Array<{
    label: string;
    title: string;
    body: string;
  }>;
  proofPoints: string[];
  exampleOutput: {
    title: string;
    findings: string[];
    decision: string;
  };
  faqs: FaqEntry[];
};

const CONFIG: Record<WorkflowStarterKey, Omit<WorkflowSeoPage, "starter" | "path">> = {
  "customer-risk": {
    metaTitle: "AI Customer Risk Workflow Room",
    metaDescription:
      "Use Raltic to turn account notes, support context, and renewal risk into a shared AI workflow room with human approval and follow-up tasks.",
    eyebrow: "Customer success workflow",
    h1: "AI customer-risk workflow for renewal teams.",
    intro:
      "Raltic is an AI agent workflow platform for teams that need a visible customer-risk process, not another private chat with a model. Start a room, paste account context, let the agent draft the risk brief, and keep customer-facing follow-up behind a human approval gate.",
    searchIntent: "Teams looking for an AI workflow that turns customer notes into renewal-risk briefs and next actions.",
    audience: "Revenue, customer success, founder-led sales",
    proofLabel: "risk brief + follow-up tasks",
    keywords: [
      "AI customer success workflow",
      "customer risk brief AI",
      "renewal risk workflow",
      "AI account planning workflow",
    ],
    steps: [
      {
        label: "1. Brief",
        title: "Bring the account context together",
        body: "Paste call notes, support issues, competitor pressure, and renewal timing into one room so the agent works from the same facts your team can inspect.",
      },
      {
        label: "2. Draft",
        title: "Ask for risk, unknowns, and next actions",
        body: "The starter brief asks for a short risk summary, missing evidence, follow-up tasks, and the approval decision needed before anything reaches the customer.",
      },
      {
        label: "3. Approve",
        title: "Keep customer-facing copy gated",
        body: "Raltic keeps the approval boundary visible so agents can draft the work while a human owns the outbound message.",
      },
    ],
    proofPoints: [
      "A searchable account-risk brief instead of a scattered notes thread.",
      "Follow-up tasks tied to the workflow room where the evidence lives.",
      "A reusable account memory that helps the next renewal conversation start faster.",
    ],
    exampleOutput: {
      title: "Renewal risk is medium until sponsor and adoption evidence are confirmed",
      findings: [
        "Executive sponsor has not joined either of the last two review notes provided in the brief.",
        "Two support issues remain open, but their customer impact is not yet quantified.",
        "Next step: assign an owner to confirm adoption data and the sponsor meeting date.",
      ],
      decision: "A human owner approves any customer-facing follow-up after the missing evidence is attached.",
    },
    faqs: [
      {
        q: "Can Raltic replace a customer success workspace?",
        a: "No. Raltic is the workflow room for the agent-assisted risk brief and approval path. Your CRM and support tools remain systems of record.",
      },
      {
        q: "What should I paste into the customer-risk workflow?",
        a: "Start with call notes, support tickets, renewal timing, competitor notes, stakeholder context, and the decision you need before the next account call.",
      },
      {
        q: "Will the agent send messages to customers automatically?",
        a: "No. The starter keeps customer-facing copy behind a human approval gate. Raltic is built around visible review before action.",
      },
    ],
  },
  "launch-readiness": {
    metaTitle: "AI Launch Readiness Workflow Room",
    metaDescription:
      "Use Raltic to turn launch briefs, docs, owner maps, support risk, and approval gates into a visible AI launch readiness workflow.",
    eyebrow: "Product and GTM workflow",
    h1: "AI launch readiness workflow for product and GTM teams.",
    intro:
      "Raltic is an AI agent workflow platform for teams that need to ship launches with visible proof, owners, and approval gates. Start a launch-readiness room, give the agent the brief and open docs, then review blockers before anything public goes out.",
    searchIntent: "Teams searching for an AI workflow to check launch proof, docs, support readiness, and owner handoff.",
    audience: "Founder, product, marketing, support",
    proofLabel: "checklist + owner map",
    keywords: [
      "AI launch checklist",
      "launch readiness workflow",
      "AI product launch workflow",
      "GTM launch approval workflow",
    ],
    steps: [
      {
        label: "1. Collect",
        title: "Put the launch brief and open docs in one room",
        body: "The workflow starts from the public promise, docs links, support notes, target date, and current blockers.",
      },
      {
        label: "2. Review",
        title: "Ask the agent to find proof gaps",
        body: "The starter asks for a checklist, owner map, support risk, missing evidence, and a clear approval boundary.",
      },
      {
        label: "3. Decide",
        title: "Block public send until the gaps are owned",
        body: "Humans keep the decision log visible, so launch readiness becomes auditable instead of buried in private chats.",
      },
    ],
    proofPoints: [
      "A launch checklist tied to evidence, not a generic template.",
      "Owner mapping for docs, support, GTM, and product blockers.",
      "A decision log that shows why the launch was approved or held.",
    ],
    exampleOutput: {
      title: "Hold public launch until docs ownership and rollback proof are confirmed",
      findings: [
        "Release notes and the support brief do not have a named owner in the supplied context.",
        "The rollback path is described but no tested run or result is linked.",
        "The customer announcement remains blocked until both gaps have evidence.",
      ],
      decision: "The launch owner decides hold or ship after docs and rollback evidence are attached.",
    },
    faqs: [
      {
        q: "Is this a project-management board?",
        a: "No. Raltic is the agent workflow room around the launch decision. It can produce tasks and handoffs, but the core value is visible proof and approval.",
      },
      {
        q: "Can this workflow start without a local runtime?",
        a: "Yes. Launch readiness can start with the cloud runtime. Bring a local runtime later if the workflow needs private repos, keys, or internal files.",
      },
      {
        q: "What does the first output look like?",
        a: "The starter is designed to produce a checklist, owner map, support-risk notes, proof gaps, and the approval decision needed before public send.",
      },
    ],
  },
  "research-synthesis": {
    metaTitle: "AI Research Synthesis Workflow Room",
    metaDescription:
      "Use Raltic to turn scattered market notes, competitor evidence, source links, and customer quotes into a reusable AI research synthesis workflow.",
    eyebrow: "Research workflow",
    h1: "AI research synthesis workflow for decision memos.",
    intro:
      "Raltic is an AI agent workflow platform for teams that need research to become a decision, not another pile of notes. Start a synthesis room, add sources and quotes, let the agent structure the evidence, and review source quality before the memo becomes team memory.",
    searchIntent: "Teams looking for an AI research workflow that turns notes and sources into a decision-ready memo.",
    audience: "Founder, product, strategy, GTM research",
    proofLabel: "decision memo + evidence gaps",
    keywords: [
      "AI research synthesis",
      "AI decision memo workflow",
      "competitor research workflow",
      "market research AI agent",
    ],
    steps: [
      {
        label: "1. Source",
        title: "Add links, notes, and quotes",
        body: "Keep sources visible in one room so the agent can cite what it used and the team can challenge weak evidence.",
      },
      {
        label: "2. Synthesize",
        title: "Ask for recommendation, confidence, and gaps",
        body: "The starter asks for a short recommendation, supporting evidence, confidence level, open questions, and a decision owner.",
      },
      {
        label: "3. Reuse",
        title: "Promote the memo into team memory",
        body: "The final output stays searchable with the evidence trail, so future workflows can start from the prior decision instead of a blank prompt.",
      },
    ],
    proofPoints: [
      "A decision memo with the source trail visible beside the agent output.",
      "Evidence gaps that tell the team what to research next.",
      "A reusable research memory instead of a one-off AI summary.",
    ],
    exampleOutput: {
      title: "Evidence supports a narrow pilot; pricing confidence remains low",
      findings: [
        "Three supplied sources support the workflow pain, but only one includes a named buyer.",
        "No primary source validates willingness to pay at the proposed tier.",
        "Next research: five buyer interviews and a direct pricing comparison.",
      ],
      decision: "The decision owner approves a pilot, not a broad launch, until pricing evidence improves.",
    },
    faqs: [
      {
        q: "Can Raltic browse the web for research?",
        a: "Raltic focuses on the workflow room and agent coordination. Use the sources you trust first; specialist research agents can be added as the workflow repeats.",
      },
      {
        q: "How does Raltic reduce hallucination risk?",
        a: "The workflow keeps sources, quotes, confidence, gaps, and human review visible. The team reviews source quality before treating the memo as a decision.",
      },
      {
        q: "Who is this workflow for?",
        a: "It fits founders, product teams, strategy work, GTM research, and any recurring decision process that starts from scattered evidence.",
      },
    ],
  },
  "code-review": {
    metaTitle: "Local AI Code Review Workflow Room",
    metaDescription:
      "Use Raltic to run a local AI code review workflow where Claude Code or Codex inspects repo context locally while the team sees findings and tasks.",
    eyebrow: "Engineering workflow",
    h1: "Local-runtime AI code review with team-visible findings.",
    intro:
      "Raltic is an AI agent workflow platform for engineering teams that want code review outcomes visible beyond one local session. Create the workflow room, connect a verified local runtime such as Claude Code or Codex, and let the team review only the findings and artifacts posted to Raltic. The AI CLI may still send repo context to its model provider under that provider's terms.",
    searchIntent: "Engineering teams searching for a local AI code review workflow with human review and visible run records.",
    audience: "Engineering, devtool teams, security-sensitive repos",
    proofLabel: "findings + missing tests + run record",
    keywords: [
      "local AI code review",
      "Claude Code team workflow",
      "Codex code review workflow",
      "AI PR review without uploading code",
    ],
    steps: [
      {
        label: "1. Connect",
        title: "Bring a verified local runtime",
        body: "Use the bridge path for Claude Code or Codex when the workflow needs repo context, tests, or local tools that should stay on your machine.",
      },
      {
        label: "2. Review",
        title: "Ask for actionable findings only",
        body: "The starter asks for correctness risks, missing tests, regression paths, and fixes that a human reviewer can accept or reject.",
      },
      {
        label: "3. Record",
        title: "Keep the review visible to the team",
        body: "Raltic stores the review comments, task links, and run record without requiring every teammate to run the same local CLI session.",
      },
    ],
    proofPoints: [
      "The repository is read by the bridge-hosted runtime you operate.",
      "Only agent messages, artifacts, and run status cross into the workflow room.",
      "Review findings become tasks and searchable team memory.",
    ],
    exampleOutput: {
      title: "Two actionable findings; one needs a regression test before merge",
      findings: [
        "The authorization path lacks a denial test for a workspace non-member.",
        "A retry branch can emit the same side effect twice after a timeout.",
        "The proposed fix is scoped to the handler and one regression test.",
      ],
      decision: "A human reviewer accepts, rejects, or downgrades each finding before merge.",
    },
    faqs: [
      {
        q: "Does Raltic upload my repository for code review?",
        a: "For bridge-hosted agents, code is read on the machine running the local runtime. Raltic receives only the messages, artifacts, and run status posted to the room. The AI CLI may send code or context to its own model provider under that provider's privacy terms.",
      },
      {
        q: "Which local code runtimes are verified?",
        a: "Claude Code and OpenAI Codex are the verified bridge runtimes today. OpenClaw and Hermes remain evaluation-only until their smoke verification passes.",
      },
      {
        q: "Can I start this workflow without connecting a runtime?",
        a: "You can create the room, but the code-review starter is gated until a local runtime is connected because the workflow depends on local repo context.",
      },
    ],
  },
};

export const WORKFLOW_SEO_PAGES: WorkflowSeoPage[] = WORKFLOW_STARTERS.map((starter) => ({
  starter,
  path: `/workflows/${starter.key}`,
  ...CONFIG[starter.key],
}));

export function getWorkflowSeoPage(key: string | null | undefined): WorkflowSeoPage | null {
  if (!key) return null;
  return WORKFLOW_SEO_PAGES.find((page) => page.starter.key === key) ?? null;
}
