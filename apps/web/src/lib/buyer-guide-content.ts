import type { ContentLink } from "@/lib/growth-content";
import type { FaqEntry } from "@/lib/seo";

export type BuyerGuidePick = {
  name: string;
  category: string;
  bestFor: string;
  implementation: "Low" | "Moderate" | "High";
  reviewModel: string;
  summary: string;
  strengths: string[];
  watchFor: string;
  source: { label: string; href: string };
  comparisonHref?: string;
};

export type BuyerGuide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  dek: string;
  directAnswer: string;
  published: string;
  updated: string;
  readTime: string;
  method: string[];
  picks: BuyerGuidePick[];
  decisionSteps: Array<{ title: string; body: string }>;
  faqs: FaqEntry[];
  related: ContentLink[];
};

const UPDATED = "2026-08-13";

export const BUYER_GUIDES: BuyerGuide[] = [
  {
    slug: "ai-agent-orchestration-platforms",
    title: "The best AI agent orchestration platforms for 2026, by job",
    metaTitle: "Best AI Agent Orchestration Platforms 2026",
    metaDescription: "Compare seven AI agent orchestration platforms by runtime model, human review, observability, implementation lift, and the job each handles best.",
    keywords: ["best AI agent orchestration platforms", "AI orchestration tools 2026", "agent orchestration platform comparison", "multi agent platform"],
    eyebrow: "2026 buyer's guide",
    dek: "There is no honest universal winner here. A low-level graph runtime, an automation builder, an enterprise cloud control plane, and a shared team workspace solve different layers of the agent problem.",
    directAnswer: "The best AI agent orchestration platform depends on what you are orchestrating. Choose LangGraph for code-defined, long-running stateful agents; CrewAI for Python-based crews and flows; n8n for integration-heavy automation; Microsoft Copilot Studio for low-code agents in the Microsoft ecosystem; Gemini Enterprise Agent Platform for a broad Google Cloud agent lifecycle; and Raltic when local and cloud agents need to work with people in one reviewable workflow room. Start by choosing the layer, then the product.",
    published: UPDATED,
    updated: UPDATED,
    readTime: "14 min read",
    method: [
      "The product has a current, maintained orchestration or agent-workflow surface documented by its publisher.",
      "Each pick is assigned to the job its operating model handles best; there is no fabricated aggregate score.",
      "We compare runtime control, human review, observability, shared context, and implementation lift.",
      "Preview features are not treated as generally available production capabilities.",
      "Raltic publishes this guide. Inclusion is not paid, and every external claim links to an official source.",
    ],
    picks: [
      {
        name: "Raltic",
        category: "Shared agent workflow rooms",
        bestFor: "Teams coordinating local and cloud agents with human owners",
        implementation: "Low",
        reviewModel: "Visible room, task, evidence, and decision state",
        summary: "Raltic is the narrowest product in this list. It does not ask a team to build a graph or visual automation before the first useful run. People, verified Claude Code or Codex bridge agents, and managed cloud agents work in the same bounded room. The tradeoff is equally clear: Raltic is not a general integration builder or a low-level agent framework.",
        strengths: ["Mixed local and managed runtimes", "Team-visible tasks and run evidence", "Fast path from brief to reviewed artifact"],
        watchFor: "Choose another product when the main requirement is event-trigger automation, framework-level control, or enterprise model infrastructure.",
        source: { label: "Raltic product and feature index", href: "/features" },
      },
      {
        name: "LangGraph",
        category: "Low-level orchestration runtime",
        bestFor: "Developers building stateful, long-running agent applications",
        implementation: "High",
        reviewModel: "Inspect and modify graph state at interrupt points",
        summary: "LangGraph gives engineers fine-grained control over deterministic and model-driven steps in the same graph. Its official documentation emphasizes persistence, durable execution, human-in-the-loop state changes, streaming, and memory. It is a strong foundation when the agent application itself is the product and your team is ready to own its graph, deployment, and user experience.",
        strengths: ["Durable, stateful execution", "Precise graph control", "Deep LangSmith tracing and evaluation path"],
        watchFor: "A framework and runtime do not automatically provide a shared operating room for non-developers, task owners, and approval decisions.",
        source: { label: "LangGraph overview", href: "https://docs.langchain.com/oss/python/langgraph/overview" },
        comparisonHref: "/compare/langgraph",
      },
      {
        name: "CrewAI",
        category: "Multi-agent framework and flows",
        bestFor: "Python teams composing role-based crews and event-driven flows",
        implementation: "High",
        reviewModel: "Human-in-the-loop triggers inside tasks and processes",
        summary: "CrewAI separates open-ended agent collaboration into Crews and structured orchestration into Flows. That split is useful when developers want named agent roles but still need deterministic routes, persisted state, guardrails, and monitored production runs. The team remains responsible for building the surrounding product and reviewer experience.",
        strengths: ["Role-based multi-agent crews", "Structured flows and persisted execution", "Enterprise deployment and run monitoring"],
        watchFor: "Crew metaphors can add coordination cost when one well-scoped agent would do the work more simply.",
        source: { label: "CrewAI documentation", href: "https://docs.crewai.com/" },
        comparisonHref: "/compare/crewai",
      },
      {
        name: "n8n",
        category: "Visual automation platform",
        bestFor: "Integration-heavy, trigger-driven workflows",
        implementation: "Moderate",
        reviewModel: "Pause selected AI tool calls for approval or input",
        summary: "n8n is strongest when the workflow is an execution graph across applications and APIs. It combines deterministic nodes, AI steps, broad integrations, execution inspection, and human checks around selected tool calls. It is a better fit than a collaboration product when most runs should proceed unattended after the graph is designed.",
        strengths: ["Large integration surface", "Visual branching and triggers", "Inspectable executions and reruns"],
        watchFor: "A visual automation canvas is not the same as a shared room where people and several runtime agents build and review the decision together.",
        source: { label: "n8n human-in-the-loop tools", href: "https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/" },
        comparisonHref: "/compare/n8n-ai",
      },
      {
        name: "Microsoft Copilot Studio",
        category: "Low-code enterprise agent builder",
        bestFor: "Organizations building agents around Microsoft 365 and Power Platform",
        implementation: "Moderate",
        reviewModel: "Human requests, supervision, testing, and activity traces",
        summary: "Copilot Studio offers a broad agent lifecycle: authoring, knowledge, tools, flows, tests, publishing, analytics, data policies, and Microsoft 365 channels. It belongs on the shortlist when Microsoft data and governance are already the center of the organization. Current documentation also separates standard and newer preview experiences, which buyers should evaluate carefully.",
        strengths: ["Microsoft 365 and Power Platform context", "Low-code authoring and channels", "Enterprise administration and evaluation"],
        watchFor: "Licensing, environment setup, harness choice, and preview status can matter more than a feature checklist suggests.",
        source: { label: "Microsoft Copilot Studio documentation", href: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/" },
        comparisonHref: "/compare/microsoft-copilot-studio",
      },
      {
        name: "Gemini Enterprise Agent Platform",
        category: "Enterprise cloud agent lifecycle",
        bestFor: "Google Cloud teams building, deploying, governing, and evaluating agents",
        implementation: "High",
        reviewModel: "Policy, identity, observability, evaluation, and application-defined review",
        summary: "Google's current Agent Platform spans low-code Agent Studio, the model-agnostic ADK, managed runtimes, sessions, memory, agent identity, gateways, evaluation, and tracing. It is a much broader infrastructure choice than Raltic. That breadth is useful for a platform team, but it brings cloud architecture, governance, and implementation decisions with it.",
        strengths: ["Full build-to-optimize lifecycle", "Managed stateful runtime and memory", "Agent identity, gateway, policy, and evaluation"],
        watchFor: "Do not buy a cloud control plane when the immediate problem is simply making agent work visible to a small team.",
        source: { label: "Gemini Enterprise Agent Platform overview", href: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/overview?hl=en" },
        comparisonHref: "/compare/gemini-enterprise-agent-platform",
      },
      {
        name: "Asana AI Studio",
        category: "AI inside work management",
        bestFor: "Asana teams adding AI steps to existing project workflows",
        implementation: "Low",
        reviewModel: "Human review steps inside smart workflows",
        summary: "Asana AI Studio starts from the tasks, projects, rules, and ownership model an Asana team already uses. That makes it practical for operations that should stay inside a work-management system. It is less suitable when local coding runtimes need to become first-class participants or when the main record is a conversational evidence trail.",
        strengths: ["Native Asana work graph", "No-code workflow construction", "Human steps tied to existing tasks"],
        watchFor: "It is not a runtime-neutral orchestration layer and should not be evaluated as one.",
        source: { label: "Asana AI Studio", href: "https://asana.com/product/ai/ai-studio" },
        comparisonHref: "/compare/asana-ai-studio",
      },
    ],
    decisionSteps: [
      { title: "Name the layer", body: "Decide whether you need a framework, runtime, automation graph, cloud control plane, work-management extension, or shared operating room." },
      { title: "Run one failure case", body: "Test a missing source, unavailable tool, reviewer rejection, and interrupted run. Recovery tells you more than the polished demo." },
      { title: "Inspect the review packet", body: "Check whether the reviewer can see evidence, uncertainty, affected systems, and the requested decision without reconstructing the run." },
      { title: "Price the operating work", body: "Include implementation, integrations, evaluation, monitoring, reviewer time, and migration cost, not only the subscription." },
    ],
    faqs: [
      { q: "What is the best AI agent orchestration platform overall?", a: "There is no credible universal winner because these products operate at different layers. LangGraph is a low-level runtime, n8n is an automation platform, Copilot Studio and Gemini Agent Platform are broader enterprise builders, and Raltic is a shared workflow room." },
      { q: "Which platform is easiest for a team to try?", a: "Raltic and products embedded in an existing work system can start with less engineering. Frameworks and cloud lifecycle platforms provide more control but require implementation work." },
      { q: "Which products support human review?", a: "All listed products can support some form of human review, but the review object differs: graph state, a tool call, an agent flow, a work-management step, or a shared decision record." },
      { q: "Is this ranking sponsored?", a: "No. Raltic publishes the guide and appears in it, but inclusion is not paid and competitor claims link to official documentation. Picks are ordered by the guide's operating-model method, not a hidden score." },
    ],
    related: [
      { label: "How to evaluate an agent platform", href: "/blog/how-to-evaluate-ai-agent-platforms" },
      { label: "All one-to-one comparisons", href: "/compare" },
      { label: "What is orchestration?", href: "/answers/what-is-an-ai-agent-orchestration-platform" },
    ],
  },
  {
    slug: "human-in-the-loop-ai-platforms",
    title: "The best human-in-the-loop AI platforms for 2026",
    metaTitle: "Best Human-in-the-Loop AI Platforms 2026",
    metaDescription: "Compare six human-in-the-loop AI platforms by review object, reviewer context, authority boundary, implementation lift, and best-fit workflow.",
    keywords: ["best human in the loop AI platforms", "AI approval workflow tools", "human review AI agents", "AI governance workflow platform"],
    eyebrow: "Review and control guide",
    dek: "A human-in-the-loop checkbox tells you almost nothing. The real questions are what pauses, what the reviewer can inspect, and whether that person can change what happens next.",
    directAnswer: "The best human-in-the-loop AI platform is the one whose review object matches the risk. Raltic fits team decisions that need a shared evidence record; LangGraph fits application teams that need to interrupt and edit agent state; n8n fits approval around selected tool calls; Microsoft Copilot Studio fits Microsoft-centered agent flows and supervision; Asana AI Studio fits review inside project work; and CrewAI fits developers placing human triggers inside code-defined crews and flows.",
    published: UPDATED,
    updated: UPDATED,
    readTime: "12 min read",
    method: [
      "We identify the exact object under review: output, state, tool call, task, flow, or external action.",
      "A platform gets credit only when the reviewer can inspect relevant context and alter the next step.",
      "Destination permissions remain separate from an in-product approval state.",
      "We compare fit and implementation lift rather than assigning a generic governance score.",
      "Raltic publishes this guide; all external capabilities link to official product documentation.",
    ],
    picks: [
      {
        name: "Raltic",
        category: "Shared decision record",
        bestFor: "Cross-functional teams reviewing agent-produced evidence and artifacts",
        implementation: "Low",
        reviewModel: "Proposal, evidence, task state, feedback, and decision in one room",
        summary: "Raltic works best when review is a team operating step rather than a callback inside application code. The reviewer can read the room, inspect posted evidence and artifacts, request changes, and record a decision. Raltic does not claim that its task state automatically blocks actions in every connected system.",
        strengths: ["Context visible to non-developers", "Local and cloud agent participants", "Decision remains attached to the workflow"],
        watchFor: "Use destination-system permissions for high-impact actions; the room record is not a substitute for authorization enforcement.",
        source: { label: "Raltic human review", href: "/features/human-review" },
      },
      {
        name: "LangGraph",
        category: "Stateful application control",
        bestFor: "Developers who need to pause, inspect, and change agent state",
        implementation: "High",
        reviewModel: "Interrupt graph execution and update state before resuming",
        summary: "LangGraph places review inside the application runtime. That fits cases where a person needs to approve a tool call, correct state, or choose a branch before execution continues. The product team must still design the reviewer interface, identity model, notification path, and durable business record around that interrupt.",
        strengths: ["Review at precise graph points", "State can be inspected and modified", "Durable resume after interruption"],
        watchFor: "The framework supplies primitives, not the finished reviewer experience or organizational process.",
        source: { label: "LangGraph human-in-the-loop", href: "https://docs.langchain.com/oss/python/langgraph/human-in-the-loop" },
        comparisonHref: "/compare/langgraph",
      },
      {
        name: "n8n",
        category: "Tool-call approval",
        bestFor: "Automation teams controlling selected AI actions across integrations",
        implementation: "Moderate",
        reviewModel: "Pause before a designated AI tool executes",
        summary: "n8n's human-in-the-loop pattern is concrete: the workflow can ask a person to approve or deny selected tool calls through supported communication channels. This is a good fit when the risk sits at an action boundary inside an automation graph. It is less natural for collaborative investigation where the decision emerges from a long evidence discussion.",
        strengths: ["Approval attached to a specific tool call", "Broad integration options", "Execution graph remains inspectable"],
        watchFor: "Approving a tool call does not by itself prove that the underlying analysis or evidence is sound.",
        source: { label: "n8n human-in-the-loop tools", href: "https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/" },
        comparisonHref: "/compare/n8n-ai",
      },
      {
        name: "Microsoft Copilot Studio",
        category: "Enterprise agent flow supervision",
        bestFor: "Microsoft organizations routing agent requests to designated reviewers",
        implementation: "Moderate",
        reviewModel: "Request human information, supervise actions, test, trace, and monitor",
        summary: "Copilot Studio supports agent flows, designated human requests, activity traces, evaluations, analytics, authentication, and data policies. It is particularly relevant when Outlook, Teams, Microsoft 365 data, and Power Platform already define the operating environment. Buyers should distinguish generally available standard experiences from current preview surfaces.",
        strengths: ["Reviewer routing in the Microsoft ecosystem", "Testing and activity traces", "Administrative controls and channels"],
        watchFor: "Harness choice, licensing, preview status, and the exact destination-system permission model require close review.",
        source: { label: "Copilot Studio human review in flows", href: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/flows-request-for-information" },
        comparisonHref: "/compare/microsoft-copilot-studio",
      },
      {
        name: "Asana AI Studio",
        category: "Work-management review",
        bestFor: "Teams whose approvals already live in Asana projects and tasks",
        implementation: "Low",
        reviewModel: "Human steps inside an AI Studio smart workflow",
        summary: "Asana can place human review in a workflow that already has task ownership, projects, and downstream work. That lowers adoption cost for existing Asana teams. The review remains shaped by Asana's work-management model rather than by a multi-runtime room or a developer-controlled execution graph.",
        strengths: ["Review tied to existing owners", "No-code workflow changes", "Project context remains in Asana"],
        watchFor: "Do not assume that a work-management review step provides application-level runtime control.",
        source: { label: "Asana AI Studio human-in-the-loop", href: "https://help.asana.com/s/article/ai-studio-human-in-the-loop" },
        comparisonHref: "/compare/asana-ai-studio",
      },
      {
        name: "CrewAI",
        category: "Code-defined agent review",
        bestFor: "Python teams adding human checkpoints to crews and flows",
        implementation: "High",
        reviewModel: "Human-in-the-loop triggers in tasks and processes",
        summary: "CrewAI lets developers combine collaborative crews with structured flows and human triggers. It fits teams that want review inside the orchestration code and are prepared to build the surrounding interface and operating process. The framework also supports guardrails, memory, observability, and enterprise deployment paths.",
        strengths: ["Checkpoints inside multi-agent work", "Flows provide deterministic structure", "Framework-level customization"],
        watchFor: "A named human trigger can still become rubber-stamping if the interface does not show evidence and uncertainty.",
        source: { label: "CrewAI documentation", href: "https://docs.crewai.com/" },
        comparisonHref: "/compare/crewai",
      },
    ],
    decisionSteps: [
      { title: "Locate the risk", body: "Identify the exact transition that could affect a customer, production system, money, access, or an irreversible decision." },
      { title: "Design the packet", body: "Show the proposal, supporting and conflicting evidence, uncertainty, affected systems, and requested decision." },
      { title: "Give the reviewer authority", body: "The person must be able to reject, request changes, or stop the next action, not merely acknowledge a message." },
      { title: "Test overload", body: "Run enough cases to see whether reviewers can maintain attention or start approving by habit." },
    ],
    faqs: [
      { q: "What makes a human-in-the-loop platform effective?", a: "It pauses at a meaningful risk boundary, gives a qualified reviewer enough evidence, lets that reviewer change the outcome, and records the decision." },
      { q: "Is human review the same as authorization?", a: "No. A review state records a decision inside the workflow. The destination system must still enforce credentials, roles, and permissions for consequential actions." },
      { q: "Should every AI action require approval?", a: "No. Requiring approval for trivial work creates fatigue. Reserve focused review for uncertain, high-impact, or hard-to-reverse transitions." },
      { q: "Which platform is best for non-technical reviewers?", a: "Raltic, Asana AI Studio, and Microsoft Copilot Studio provide more direct team-facing surfaces. LangGraph and CrewAI give developers primitives that require a reviewer experience to be built." },
    ],
    related: [
      { label: "Human-in-the-loop workflow guide", href: "/blog/human-in-the-loop-ai-workflows" },
      { label: "Approval workflow design", href: "/blog/ai-agent-approval-workflow" },
      { label: "When approval is required", href: "/answers/when-should-ai-agents-require-human-approval" },
    ],
  },
  {
    slug: "ai-agent-workflow-platforms",
    title: "The best AI agent workflow platforms for teams in 2026",
    metaTitle: "Best AI Agent Workflow Platforms for Teams 2026",
    metaDescription: "Compare seven AI agent workflow platforms for team collaboration, automation, work management, knowledge work, local runtimes, and human review.",
    keywords: ["best AI agent workflow platforms", "AI workflow tools for teams", "agent collaboration platform", "AI workflow software 2026"],
    eyebrow: "Team workflow shortlist",
    dek: "The right platform depends on where the work already lives. A team may need a room, a project system, a document workspace, a chat surface, or an automation graph. Those are different buying decisions.",
    directAnswer: "For team-facing AI workflows, choose Raltic when local and cloud agents need a shared room with people; Asana AI Studio when the work already runs through Asana; Notion Agent when pages and databases are the main context; Slack's agent platform when the conversation should stay in Slack; n8n when integrations and triggers drive the process; ChatGPT Business when one provider's projects and assistants cover the need; and Microsoft Copilot Studio when Microsoft 365 data, channels, and administration define the environment.",
    published: UPDATED,
    updated: UPDATED,
    readTime: "13 min read",
    method: [
      "The shortlist covers products with a current team-facing agent or AI workflow surface.",
      "We distinguish the system of work: room, project, document, chat, automation graph, assistant workspace, or enterprise agent builder.",
      "We compare the path to first value, shared context, review model, runtime flexibility, and implementation lift.",
      "A product is recommended only for the job its native surface handles well.",
      "Raltic publishes this guide and links competitor claims to official sources; placements are not paid.",
    ],
    picks: [
      {
        name: "Raltic",
        category: "Workflow room",
        bestFor: "Teams mixing local coding agents, cloud agents, and human reviewers",
        implementation: "Low",
        reviewModel: "Room evidence, tasks, feedback, and decision",
        summary: "Raltic gives one agent-assisted process a dedicated room. The brief, attributed agent updates, tasks, posted artifacts, run state, and final decision stay together. It fits teams that need operational continuity across runtimes, but it does not replace a full project portfolio, document suite, chat product, or automation builder.",
        strengths: ["Runtime-neutral shared context", "Local bridge and managed cloud paths", "Reviewable decision history"],
        watchFor: "Raltic is in private beta and has a narrower connector and automation surface than mature suites.",
        source: { label: "Raltic workflow rooms", href: "/features/workflow-rooms" },
      },
      {
        name: "Asana AI Studio",
        category: "Project and work management",
        bestFor: "Adding AI steps to existing Asana projects, rules, and ownership",
        implementation: "Low",
        reviewModel: "Human steps and task ownership in smart workflows",
        summary: "Asana is the practical choice when the project graph already exists and AI should classify, draft, route, or update work inside it. Teams keep portfolio and workload management in the same product. Local coding runtimes and a conversational evidence trail are not its primary model.",
        strengths: ["Existing project context", "No-code smart workflows", "Portfolio and workload management"],
        watchFor: "Choose it as an Asana extension, not as a neutral agent runtime layer.",
        source: { label: "Asana AI Studio", href: "https://asana.com/product/ai/ai-studio" },
        comparisonHref: "/compare/asana-ai-studio",
      },
      {
        name: "Notion Agent",
        category: "Knowledge and document workspace",
        bestFor: "Creating, editing, and researching inside Notion pages and databases",
        implementation: "Low",
        reviewModel: "User permissions and review inside the workspace",
        summary: "Notion Agent is strongest when the output is a page, database update, research synthesis, or workspace action grounded in Notion and connected apps. It avoids moving knowledge into a separate tool. Teams that need explicit run state, local coding agents, and a workflow-specific approval record may need another layer around it.",
        strengths: ["Native document and database work", "Workspace and connected-app context", "Low-friction adoption for Notion teams"],
        watchFor: "Document collaboration and runtime-agent coordination are different product jobs.",
        source: { label: "Notion Agent", href: "https://www.notion.com/help/notion-agent" },
        comparisonHref: "/compare/notion-ai-agent",
      },
      {
        name: "Slack agent platform",
        category: "Team communication",
        bestFor: "Bringing agents into conversations that already happen in Slack",
        implementation: "Low",
        reviewModel: "Conversation, app, workflow, and platform-specific controls",
        summary: "Slack reduces adoption friction because people already spend time there. Its agent platform and AI features can bring assistants and third-party agents into that communication layer. The compromise is structural: channels remain conversation-first, so a bounded workflow's tasks, run evidence, and decision record may still be spread across messages and connected tools.",
        strengths: ["Existing team communication graph", "Third-party agent participation", "Broad app ecosystem"],
        watchFor: "A busy channel can hide the difference between a proposal, an approved decision, and unfinished work.",
        source: { label: "Slack agentic platform", href: "https://slack.com/features/Agentic-Platform" },
        comparisonHref: "/compare/slack-ai-bots",
      },
      {
        name: "n8n",
        category: "Automation graph",
        bestFor: "Event-driven workflows across applications and APIs",
        implementation: "Moderate",
        reviewModel: "Human approval around selected AI tool calls",
        summary: "n8n excels when the workflow is a sequence of triggers, transformations, branches, API calls, and AI steps. Once built, many runs can proceed with limited attention. It is less suited to open-ended team investigation where evidence and reviewer discussion are the main product surface.",
        strengths: ["Triggers and integration breadth", "Visual control flow", "Execution inspection and human checks"],
        watchFor: "Automation efficiency does not replace task-specific evaluation or decision ownership.",
        source: { label: "n8n AI workflows", href: "https://n8n.io/ai/" },
        comparisonHref: "/compare/n8n-ai",
      },
      {
        name: "ChatGPT Business",
        category: "Hosted assistant workspace",
        bestFor: "Teams standardizing projects and assistants on OpenAI",
        implementation: "Low",
        reviewModel: "Human review of conversations and shared project outputs",
        summary: "ChatGPT Business is a straightforward choice for drafting, analysis, research, and custom assistants inside one provider's workspace. Projects keep related context and files together. Teams that need multiple runtime providers, local CLI participation, explicit task states, and a durable approval boundary need a different operating layer.",
        strengths: ["Fast individual and team adoption", "Projects and shared assistants", "Broad general-purpose model capabilities"],
        watchFor: "A productive conversation is not automatically a repeatable, accountable workflow." ,
        source: { label: "Projects in ChatGPT", href: "https://help.openai.com/en/articles/10169521-projects-in-chatgpt" },
        comparisonHref: "/compare/chatgpt-for-work",
      },
      {
        name: "Microsoft Copilot Studio",
        category: "Enterprise agent builder",
        bestFor: "Microsoft organizations building agents for Microsoft 365 and business channels",
        implementation: "Moderate",
        reviewModel: "Agent flows, designated reviewers, evaluations, and monitoring",
        summary: "Copilot Studio combines agent authoring, knowledge, tools, flows, testing, channels, analytics, and policy. It makes sense when the organization already governs work through Microsoft identities, data, and Power Platform. It is a broader platform decision than adopting a lightweight team workflow product.",
        strengths: ["Microsoft 365 grounding and channels", "Low-code builder plus administration", "Evaluation and monitoring surfaces"],
        watchFor: "Confirm the exact harness, region, license, and release status needed for the intended workflow.",
        source: { label: "Microsoft Copilot Studio", href: "https://learn.microsoft.com/en-us/microsoft-copilot-studio/" },
        comparisonHref: "/compare/microsoft-copilot-studio",
      },
    ],
    decisionSteps: [
      { title: "Find the current system of work", body: "Identify whether the durable record already lives in projects, documents, chat, an automation graph, or nowhere useful." },
      { title: "Choose the first proof", body: "Define the artifact or decision a new user should reach in the first session." },
      { title: "Trace the handoff", body: "Check how an agent passes work to another agent or person without losing sources, constraints, and ownership." },
      { title: "Inspect the long-term record", body: "Return a week later and verify that someone new can understand what happened and why." },
    ],
    faqs: [
      { q: "What is an AI agent workflow platform?", a: "It is software that coordinates agent-assisted work across context, tools, execution, handoffs, review, and an accepted outcome. Products differ in which of those layers they own." },
      { q: "Is an AI workflow platform the same as an automation platform?", a: "No. Automation platforms center on triggers and execution graphs. Team workflow platforms may center on shared context, tasks, evidence, and human decisions." },
      { q: "Which platform works with local coding agents?", a: "Raltic provides verified bridge paths for Claude Code and OpenAI Codex. Developer frameworks can also be built around local processes, but require implementation." },
      { q: "Should a team replace Slack, Asana, or Notion?", a: "Usually not. Choose a focused agent-workflow layer only where the existing system fails to preserve runtime work, evidence, handoffs, or review. Keep broader communication, project, and document systems for the jobs they already handle well." },
    ],
    related: [
      { label: "AI agent workflow guide", href: "/blog/what-is-an-agent-workflow" },
      { label: "Workflow-room feature", href: "/features/workflow-rooms" },
      { label: "All product comparisons", href: "/compare" },
    ],
  },
];

export function getBuyerGuide(slug: string | null | undefined): BuyerGuide | null {
  if (!slug) return null;
  return BUYER_GUIDES.find((guide) => guide.slug === slug) ?? null;
}
