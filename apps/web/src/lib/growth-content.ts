import type { FaqEntry } from "@/lib/seo";

export type ContentLink = {
  label: string;
  href: string;
};

export type ContentSource = ContentLink & {
  publisher: string;
};

export type ContentSection = {
  id: string;
  title: string;
  answer: string;
  paragraphs: string[];
  bullets?: string[];
};

export type FeaturePage = {
  slug: string;
  name: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  intro: string;
  outcome: string;
  capabilities: Array<{ title: string; body: string }>;
  steps: Array<{ title: string; body: string }>;
  boundaries: string[];
  faqs: FaqEntry[];
  related: ContentLink[];
};

export type AudiencePage = {
  slug: string;
  audience: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  h1: string;
  intro: string;
  firstValue: string;
  pains: string[];
  useCases: Array<{ title: string; body: string; proof: string }>;
  operatingModel: Array<{ title: string; body: string }>;
  faqs: FaqEntry[];
  related: ContentLink[];
};

export type BlogArticle = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  dek: string;
  directAnswer: string;
  published: string;
  updated: string;
  readTime: string;
  sections: ContentSection[];
  sources: ContentSource[];
  faqs: FaqEntry[];
  related: ContentLink[];
};

export type AnswerPage = {
  slug: string;
  question: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  shortAnswer: string;
  sections: ContentSection[];
  faqs: FaqEntry[];
  related: ContentLink[];
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: "workflow-rooms",
    name: "Workflow rooms",
    eyebrow: "Shared operating context",
    metaTitle: "AI Agent Workflow Rooms for Teams",
    metaDescription: "Keep the brief, agent runs, tasks, human review, artifacts, and final decision together in one searchable AI workflow room.",
    keywords: ["AI workflow room", "agent workspace", "shared AI agent workspace", "AI team collaboration"],
    h1: "One room for the whole agent workflow.",
    intro: "A Raltic workflow room gives humans and AI agents one bounded place to run a repeatable process. The brief, working updates, tasks, evidence, review state, and outcome remain attached to the same room instead of being scattered across chat threads and private sessions.",
    outcome: "A teammate can open the room and understand what was requested, what the agents did, what still needs review, and what decision was made without reconstructing the work from several tools.",
    capabilities: [
      { title: "A brief with a clear boundary", body: "Start from a workflow starter or write a focused brief. The room establishes the objective and the human-owned decision before agents begin." },
      { title: "Humans and agents as visible participants", body: "Local bridge agents and cloud agents post into the same shared context, so their contributions remain attributable and reviewable." },
      { title: "Tasks beside the conversation", body: "Turn follow-up work into todo, in-progress, in-review, or done tasks without losing the messages and evidence that created the task." },
      { title: "Searchable operational memory", body: "The room preserves outputs, artifacts, run status, and decisions as reusable team context rather than a one-off answer." },
    ],
    steps: [
      { title: "Choose one repeatable workflow", body: "Begin with a process that already has an owner and a recognizable deliverable, such as launch readiness, research synthesis, or code review." },
      { title: "Send the starter brief", body: "State the objective, evidence available, constraints, and the decision that must remain human-owned." },
      { title: "Review visible agent work", body: "Agents report into the room while tasks and run states show what is active, blocked, or ready for review." },
      { title: "Record the decision", body: "Approve, request changes, or stop the work, then leave the final rationale beside the evidence that informed it." },
    ],
    boundaries: [
      "Raltic is not a replacement for general team chat; workflow rooms are organized around a bounded process and outcome.",
      "A room can make a review boundary visible, but teams remain responsible for who is authorized to approve and for any action taken in external systems.",
      "Connector access is limited by configured credentials and per-agent grants; it does not imply unrestricted access to connected tools.",
    ],
    faqs: [
      { q: "What is an AI agent workflow room?", a: "It is a shared workspace for one agent-assisted process. It keeps the brief, human and agent updates, tasks, artifacts, review state, and final decision together." },
      { q: "Is a workflow room the same as a chat channel?", a: "No. A chat channel is primarily a stream of messages. A workflow room is organized around getting a defined process to a reviewed outcome with tasks and run evidence attached." },
      { q: "Can local and cloud agents use the same room?", a: "Yes. Verified Claude Code and OpenAI Codex bridge runtimes can participate alongside Raltic cloud agents." },
    ],
    related: [
      { label: "Human review boundaries", href: "/features/human-review" },
      { label: "What is an AI workflow room?", href: "/answers/what-is-an-ai-workflow-room" },
      { label: "Agent workflow guide", href: "/blog/what-is-an-agent-workflow" },
    ],
  },
  {
    slug: "human-review",
    name: "Human review",
    eyebrow: "Explicit decision ownership",
    metaTitle: "Human Review for AI Agent Workflows",
    metaDescription: "Create visible human review boundaries around AI agent outputs with shared evidence, in-review tasks, and accountable decisions.",
    keywords: ["AI agent approval workflow", "human in the loop AI", "AI review gate", "agent oversight"],
    h1: "Keep the decision human-owned.",
    intro: "Raltic makes the point of review visible inside the workflow room. Agents can draft, investigate, and propose; a person evaluates the evidence, requests changes, and records the decision before the team treats the output as approved.",
    outcome: "Teams can distinguish an agent proposal from an accepted decision and see who still needs to review the work.",
    capabilities: [
      { title: "Visible review state", body: "Move work into an in-review task state so the room clearly separates active agent work from a human decision." },
      { title: "Evidence beside the proposal", body: "Keep supporting messages, artifacts, source links, and run status close to the output that needs review." },
      { title: "Revision in context", body: "Ask an agent to revise without opening a new private session or dropping the rationale that prompted the change." },
      { title: "Decision memory", body: "Leave the accepted outcome and its reasoning in the room so future teammates and agents can reuse it." },
    ],
    steps: [
      { title: "Define the decision owner", body: "Name the person or role responsible for accepting the output before the agent begins." },
      { title: "State acceptance criteria", body: "Put evidence requirements, constraints, and prohibited actions into the brief." },
      { title: "Move the work to review", body: "Use the task state and room context to signal that the agent has proposed an output but has not approved it." },
      { title: "Approve or request changes", body: "The reviewer evaluates the evidence, records feedback, and only then marks the work complete." },
    ],
    boundaries: [
      "Raltic exposes workflow review state; it does not automatically enforce authorization in every external system.",
      "A human review step improves control only when the reviewer has the context, authority, and time to evaluate the output.",
      "High-impact actions should use the destination system's own permissions and approval controls in addition to the Raltic record.",
    ],
    faqs: [
      { q: "Does Raltic automatically block every external action until approval?", a: "No. Raltic makes the review boundary, evidence, and task state visible. External actions remain governed by connector grants, destination permissions, and the team's operating procedure." },
      { q: "What should a reviewer check?", a: "Check the evidence, constraints, uncertainty, affected systems, and whether the proposed output meets the acceptance criteria in the brief." },
      { q: "Can an agent revise after review feedback?", a: "Yes. Feedback remains in the same workflow room, so the agent can revise against the original brief and the reviewer can compare the result in context." },
    ],
    related: [
      { label: "Approval workflow guide", href: "/blog/ai-agent-approval-workflow" },
      { label: "How approval gates work", href: "/answers/how-do-ai-agent-approval-gates-work" },
      { label: "Security boundaries", href: "/security" },
    ],
  },
  {
    slug: "local-agent-bridge",
    name: "Local agent bridge",
    eyebrow: "Local runtime participation",
    metaTitle: "Local AI Agent Bridge for Claude Code and Codex",
    metaDescription: "Connect verified Claude Code and OpenAI Codex local runtimes to shared Raltic workflow rooms while keeping repository access on the runtime machine.",
    keywords: ["local AI agent bridge", "Claude Code team workflow", "Codex team workspace", "local agent orchestration"],
    h1: "Bring local coding agents into team workflows.",
    intro: "The Raltic bridge connects a local Claude Code or OpenAI Codex runtime to shared workflow rooms. The runtime can work beside the repository on its own machine while Raltic receives the messages, artifacts, and run status intentionally posted into the room.",
    outcome: "Engineering teams gain shared visibility around local agent work without turning Raltic into a repository mirror or a replacement for the runtime itself.",
    capabilities: [
      { title: "Verified runtime adapters", body: "Claude Code and OpenAI Codex are the verified bridge runtimes. Experimental runtimes remain clearly labeled and unavailable for production-critical claims." },
      { title: "Per-channel connections", body: "The bridge opens authenticated realtime connections so a local runtime can receive work and post progress to the relevant room." },
      { title: "Runtime-owned provider access", body: "Provider subscriptions or keys for bridge runtimes remain with the user's local runtime instead of being metered or marked up by Raltic." },
      { title: "Team-visible outputs", body: "Results, artifacts, and status posted by the runtime become reviewable by the people who own the workflow decision." },
    ],
    steps: [
      { title: "Install and authenticate the bridge", body: "Run the Raltic bridge on the machine that already has the supported AI CLI and repository access." },
      { title: "Connect the runtime", body: "Choose Claude Code or Codex and associate the local agent with the workspace and channels it should serve." },
      { title: "Send work from a room", body: "A focused room brief reaches the bridge, which dispatches it to the selected local runtime." },
      { title: "Review what the runtime posts", body: "The team reviews posted messages, artifacts, and run status in Raltic while repository operations remain on the runtime machine." },
    ],
    boundaries: [
      "The AI CLI may send repository context to its model provider under that provider's terms; local repository access does not mean model-provider processing is local.",
      "Raltic receives content that a user or agent deliberately posts, including messages and artifacts, so teams should still avoid posting secrets.",
      "Bridge availability depends on the local machine, runtime authentication, and network connection.",
    ],
    faqs: [
      { q: "Does the Raltic bridge upload my repository?", a: "The bridge runtime reads the repository on its own machine. Raltic receives messages, artifacts, and run status posted to the room, not an automatic copy of the repository." },
      { q: "Which local runtimes are verified?", a: "Claude Code and OpenAI Codex are verified. OpenClaw and Hermes are experimental and should not be treated as production-ready." },
      { q: "Who pays for model usage?", a: "You pay the runtime's AI provider directly using your existing subscription or key. Raltic does not mark up bridge-runtime usage." },
    ],
    related: [
      { label: "Bridge runtime definition", href: "/answers/what-is-a-bridge-runtime" },
      { label: "Local vs cloud agents", href: "/blog/local-vs-cloud-ai-agents" },
      { label: "Runtime compatibility", href: "/runtimes" },
    ],
  },
  {
    slug: "cloud-agents",
    name: "Cloud agents",
    eyebrow: "Managed agent execution",
    metaTitle: "Cloud AI Agents for Shared Team Workflows",
    metaDescription: "Start managed cloud agents in Raltic workflow rooms without a local install, then review their work, run state, tasks, and artifacts together.",
    keywords: ["cloud AI agents", "managed agent runtime", "AI workflow sandbox", "team AI agents"],
    h1: "Start an agent workflow without a local install.",
    intro: "Raltic cloud agents run in managed sandbox containers and participate directly in workflow rooms. They give teams a lower-friction path to first value when the work does not require a private local repository or a desktop-only toolchain.",
    outcome: "A new workspace can run a starter workflow, see agent output, and reach a human review point before investing in local runtime setup.",
    capabilities: [
      { title: "Zero-local-install start", body: "Use a cloud agent for the first workflow instead of making every evaluator configure a local runtime." },
      { title: "Room-native tools", body: "Cloud agents can work with Raltic's internal task, message, and connector surfaces from the same accountable context." },
      { title: "Sandbox-backed execution", body: "Agent processes run in managed Cloudflare container infrastructure rather than in the browser session." },
      { title: "Shared review trail", body: "The room keeps messages, run status, tasks, and artifacts visible to reviewers after the agent run ends." },
    ],
    steps: [
      { title: "Pick a starter workflow", body: "Choose a bounded workflow with evidence that can be supplied through the room or an approved connector." },
      { title: "Create the cloud agent", body: "Add a managed agent without setting up a local daemon." },
      { title: "Grant only required access", body: "Configure connector access per agent and keep the grant limited to what the workflow needs." },
      { title: "Review the result", body: "Use the room and task state to evaluate the output and capture the decision." },
    ],
    boundaries: [
      "Use a local bridge runtime when the workflow requires access to a repository or tool that should remain on a specific machine.",
      "Cloud agents only have the Raltic and connector permissions explicitly available to them; they do not inherit broad workspace access automatically.",
      "Managed execution does not remove the need for human review of high-impact or customer-facing output.",
    ],
    faqs: [
      { q: "Do cloud agents require the desktop app?", a: "No. Cloud agents are designed to start without a local bridge or desktop install." },
      { q: "When should I use a local agent instead?", a: "Use a local bridge runtime when work depends on a repository, credentials, or toolchain that should stay on a controlled machine." },
      { q: "Can cloud and local agents collaborate?", a: "Yes. Both can participate in the same workspace and workflow rooms, with their posted work visible to the team." },
    ],
    related: [
      { label: "Local vs cloud agents", href: "/blog/local-vs-cloud-ai-agents" },
      { label: "Cloud agent glossary", href: "/glossary#cloud-agent" },
      { label: "Workflow templates", href: "/workflows" },
    ],
  },
  {
    slug: "agent-run-observability",
    name: "Agent run observability",
    eyebrow: "Visible execution state",
    metaTitle: "AI Agent Run Observability for Teams",
    metaDescription: "See agent run status, posted evidence, artifacts, tasks, and review state in the workflow room where the team owns the outcome.",
    keywords: ["AI agent observability", "agent run monitoring", "AI agent audit trail", "agent workflow visibility"],
    h1: "See the work, not just the final answer.",
    intro: "Raltic keeps agent run state and posted outputs attached to the workflow room. Reviewers can see which agent participated, what evidence it surfaced, which tasks remain open, and whether the work is still running, waiting, or ready for human review.",
    outcome: "Teams can diagnose a weak or incomplete result from the workflow record instead of treating every agent response as an opaque one-shot answer.",
    capabilities: [
      { title: "Run state in context", body: "Execution status appears beside the room where the work was requested, reducing the gap between monitoring and decision-making." },
      { title: "Attributed agent messages", body: "Posted updates show which participant contributed the finding or artifact." },
      { title: "Tasks as operational signals", body: "Open and in-review tasks expose remaining work even after an individual agent run has stopped." },
      { title: "Searchable evidence", body: "The room retains posted proof and the final decision for future investigation, onboarding, and repeated runs." },
    ],
    steps: [
      { title: "Define expected proof", body: "State what evidence, artifact, or conclusion the run must produce before starting." },
      { title: "Watch run and task state", body: "Use participant, run, and task signals to distinguish active work from waiting or review-ready work." },
      { title: "Inspect the evidence", body: "Review the actual posted findings and artifacts, not only a completion signal." },
      { title: "Capture the decision", body: "Record approval, rejection, or the next task so later readers can interpret the run correctly." },
    ],
    boundaries: [
      "Raltic records what runtimes post to the workflow; it does not claim to capture every hidden model reasoning step.",
      "A successful run status does not prove that the output is correct or approved.",
      "Operational observability should be combined with task-specific evaluation criteria for higher-risk workflows.",
    ],
    faqs: [
      { q: "Does Raltic expose chain-of-thought?", a: "No. Raltic shows posted messages, artifacts, task state, and run status. It does not require or claim access to hidden model reasoning." },
      { q: "Is a completed run the same as approved work?", a: "No. Completion is an execution state. Human review and the recorded workflow decision are separate." },
      { q: "Can teams search previous agent work?", a: "Yes. Workflow rooms preserve posted context and outcomes so teams can return to earlier evidence and decisions." },
    ],
    related: [
      { label: "Agent observability guide", href: "/blog/ai-agent-observability" },
      { label: "Human review", href: "/features/human-review" },
      { label: "Workflow rooms", href: "/features/workflow-rooms" },
    ],
  },
  {
    slug: "tasks-and-handoffs",
    name: "Tasks and handoffs",
    eyebrow: "Operational continuity",
    metaTitle: "AI Agent Tasks and Human Handoffs",
    metaDescription: "Coordinate AI agent tasks, human review, handoffs, and final decisions inside the same searchable workflow room.",
    keywords: ["AI agent task management", "human agent handoff", "multi agent tasks", "agent workflow task tracking"],
    h1: "Turn agent output into owned follow-through.",
    intro: "Raltic tasks connect conversation to execution. Humans and agents can create, claim, update, unclaim, and complete tasks, while the room preserves why the task exists and what evidence should be reviewed before it is done.",
    outcome: "Agent findings become explicit, owned next steps instead of disappearing into a transcript or relying on someone to transfer them manually into another list.",
    capabilities: [
      { title: "Four clear states", body: "Use todo, in-progress, in-review, and done to distinguish queued work, active work, review, and completion." },
      { title: "Agent and human ownership", body: "Participants can claim and hand off tasks without detaching them from the workflow context." },
      { title: "Review before completion", body: "Move a proposed deliverable into review rather than collapsing execution and acceptance into one state." },
      { title: "Context-preserving handoffs", body: "The next owner can read the brief, messages, and evidence that led to the task before taking action." },
    ],
    steps: [
      { title: "Create the task from the workflow", body: "State the deliverable and acceptance criteria while the source context is still visible." },
      { title: "Claim the work", body: "A human or agent makes ownership explicit before execution begins." },
      { title: "Hand off with evidence", body: "Post the result and move the task to review so the decision owner has the needed context." },
      { title: "Close with a decision", body: "Complete the task only after review, then leave the accepted output or rationale in the room." },
    ],
    boundaries: [
      "Raltic tasks coordinate work inside workflow rooms; they are not a full replacement for every project portfolio or issue-tracking system.",
      "A task state communicates workflow status but does not by itself validate the accuracy of an agent output.",
      "Teams should use connected systems such as Linear for broader planning when that remains the system of record.",
    ],
    faqs: [
      { q: "Can AI agents claim tasks in Raltic?", a: "Yes. The Raltic task surface supports listing, creating, claiming, unclaiming, and updating tasks for agent-assisted workflows." },
      { q: "What is the difference between in progress and in review?", a: "In progress means the work is being produced. In review means a result has been proposed and is waiting for a human or designated reviewer to evaluate it." },
      { q: "Does Raltic replace Linear?", a: "Not necessarily. Raltic tasks keep workflow-room execution and review together. Linear can remain the broader planning system through the connector." },
    ],
    related: [
      { label: "Multi-agent workflow patterns", href: "/blog/multi-agent-workflow-patterns" },
      { label: "How teams review agent output", href: "/answers/how-do-teams-review-ai-agent-output" },
      { label: "Linear connector", href: "/connectors/linear" },
    ],
  },
];

export const AUDIENCE_PAGES: AudiencePage[] = [
  {
    slug: "product-teams",
    audience: "Product teams",
    metaTitle: "AI Agent Workflows for Product Teams",
    metaDescription: "Run product discovery, launch readiness, customer-risk review, and evidence-based decisions with humans and AI agents in one workflow room.",
    keywords: ["AI for product teams", "product management AI agents", "AI launch readiness", "product workflow automation"],
    h1: "Built for product teams that need decisions, not more drafts.",
    intro: "Raltic helps product managers, researchers, engineers, and AI agents work from one brief and one evidence trail. The team can delegate synthesis and analysis while keeping prioritization, customer impact, and launch decisions human-owned.",
    firstValue: "Start with launch readiness: provide the release scope and known evidence, then review a structured risk and blocker summary in the same room.",
    pains: ["Research and delivery evidence live in different tools.", "Useful AI answers disappear in private sessions.", "The person approving a launch cannot see how the conclusion was reached."],
    useCases: [
      { title: "Launch readiness", body: "Combine scope, risk, dependency, and evidence review before a release decision.", proof: "A prioritized blocker list with owners, missing evidence, and a visible approval boundary." },
      { title: "Customer-risk review", body: "Synthesize customer signals without treating an AI summary as the decision.", proof: "Themes linked to evidence, uncertainty, and a human-owned response plan." },
      { title: "Research synthesis", body: "Coordinate source review and synthesis across agents and people in one bounded room.", proof: "A decision-ready brief with citations, disagreements, and open questions." },
    ],
    operatingModel: [
      { title: "Brief the decision", body: "State the product question, evidence, constraints, and who owns the call." },
      { title: "Delegate evidence work", body: "Use cloud or local agents for research, classification, and draft analysis." },
      { title: "Review and commit", body: "Evaluate proof, request revisions, and record the product decision beside the work." },
    ],
    faqs: [
      { q: "Does Raltic replace a product management tool?", a: "No. It is the workflow room for agent-assisted analysis and review. Your roadmap or issue tracker can remain the planning system of record." },
      { q: "Can product and engineering review the same agent output?", a: "Yes. The room gives both functions access to the brief, posted evidence, tasks, and decision history." },
      { q: "What is the best first workflow?", a: "Choose a bounded decision with available evidence. Launch readiness is a strong first trial because the owner, inputs, and approval point are usually clear." },
    ],
    related: [{ label: "Launch readiness workflow", href: "/workflows/launch-readiness" }, { label: "Product team examples", href: "/blog/ai-agent-workflow-examples-product-teams" }, { label: "Workflow rooms", href: "/features/workflow-rooms" }],
  },
  {
    slug: "engineering-teams",
    audience: "Engineering teams",
    metaTitle: "AI Agent Workflows for Engineering Teams",
    metaDescription: "Bring Claude Code and Codex into shared code review, incident follow-up, and release workflows with team-visible evidence and human review.",
    keywords: ["AI agents for engineering teams", "Claude Code team workflow", "Codex code review", "AI engineering workflow"],
    h1: "Built for engineering teams using more than one coding agent.",
    intro: "Raltic adds a shared operating layer around local and cloud agents. Engineers keep their runtime and repository toolchain, while reviewers and cross-functional owners gain a room for findings, tasks, run state, and the final decision.",
    firstValue: "Connect a verified local runtime and run one code-review workflow against a bounded change, then review the posted findings before any fix is accepted.",
    pains: ["Agent work is trapped in individual terminals or editors.", "A completed run is easily mistaken for an approved change.", "Review findings are copied manually into tasks and lose their source context."],
    useCases: [
      { title: "Local-runtime code review", body: "Let Claude Code or Codex inspect the repository on the runtime machine and post selected findings to the room.", proof: "Prioritized findings, affected paths, missing tests, and a human review task." },
      { title: "Release risk review", body: "Coordinate checks across code, dependencies, operational notes, and launch constraints.", proof: "A release decision record with blockers and named follow-up tasks." },
      { title: "Incident follow-up", body: "Keep evidence gathering, hypothesis review, and remediation tasks tied to one incident workflow.", proof: "A reviewable timeline, confidence-labeled causes, and owned remediation." },
    ],
    operatingModel: [
      { title: "Keep code access local when needed", body: "Use a bridge runtime for repository work and post only the outputs needed by the team." },
      { title: "Separate execution from acceptance", body: "Treat agent completion as input to review, not as an automatic merge or release decision." },
      { title: "Preserve the engineering record", body: "Keep findings, tasks, artifacts, and final rationale searchable after the run." },
    ],
    faqs: [
      { q: "Does Raltic replace an AI coding editor?", a: "No. Keep Cursor, Copilot, Claude Code, or Codex for coding. Raltic coordinates the shared workflow, review, and evidence around agent work." },
      { q: "Does Raltic automatically upload the repository?", a: "No. Bridge runtimes read it on their machine. Raltic receives messages, artifacts, and run status posted to the room; the model provider may separately process context under its terms." },
      { q: "Can agents open pull requests automatically?", a: "Raltic currently provides connector access and workflow coordination, but it does not claim a shipped PR-triggered or automatic merge pipeline." },
    ],
    related: [{ label: "Code review workflow", href: "/workflows/code-review" }, { label: "Local agent bridge", href: "/features/local-agent-bridge" }, { label: "Raltic vs Cursor", href: "/compare/cursor" }],
  },
  {
    slug: "founders",
    audience: "Founders",
    metaTitle: "AI Agent Workflows for Founders",
    metaDescription: "Give a small team one accountable workspace for AI research, product decisions, launch checks, tasks, and reusable operating memory.",
    keywords: ["AI agents for founders", "founder AI workflow", "AI startup operations", "multi agent workspace"],
    h1: "Built for founders operating with a small team and many agents.",
    intro: "Raltic gives founders a place to delegate repeatable analysis without losing decision ownership. Product, engineering, research, and GTM workflows can each have a focused room while the team preserves what was tried, reviewed, and decided.",
    firstValue: "Choose one weekly decision with clear evidence, such as launch readiness or research synthesis, and get it to a reviewed artifact before adding more agents.",
    pains: ["The founder becomes the manual router between AI tools and teammates.", "Decisions are repeated because previous AI work is not reusable.", "Agent speed creates more output than the team can responsibly review."],
    useCases: [
      { title: "Decision research", body: "Delegate source gathering and synthesis while keeping assumptions and the final call explicit.", proof: "A source-linked brief with confidence, gaps, and the founder's decision." },
      { title: "Launch control", body: "Collect product, engineering, customer, and GTM readiness in one bounded process.", proof: "A blocker list, owners, review state, and a recorded go or no-go decision." },
      { title: "Operating memory", body: "Keep recurring workflows and their outcomes available to the next teammate or agent.", proof: "Searchable rooms that show what changed between runs and why." },
    ],
    operatingModel: [
      { title: "Start narrow", body: "Use one workflow with a visible owner and output rather than creating an agent for every function." },
      { title: "Delegate preparation", body: "Let agents gather and structure evidence while people resolve ambiguity and tradeoffs." },
      { title: "Scale the proven pattern", body: "Reuse rooms and starters only after the first workflow consistently reaches reviewable value." },
    ],
    faqs: [
      { q: "Is Raltic useful for a one-person company?", a: "Yes, especially when one person uses several AI runtimes and needs reusable workflow history. The private beta is free, while provider usage is paid directly." },
      { q: "How many agents should a founder start with?", a: "Start with one agent and one workflow. Add specialists only when the existing record shows a clear handoff or quality gap." },
      { q: "Does Raltic make business decisions for me?", a: "No. Agents prepare work and proposals. The founder or designated owner remains responsible for the decision and external action." },
    ],
    related: [{ label: "For indie developers", href: "/indie" }, { label: "Research synthesis", href: "/workflows/research-synthesis" }, { label: "Shared workspace answer", href: "/answers/do-ai-agents-need-a-shared-workspace" }],
  },
  {
    slug: "gtm-teams",
    audience: "GTM teams",
    metaTitle: "AI Agent Workflows for GTM Teams",
    metaDescription: "Coordinate AI-assisted market research, launch planning, account review, and customer-risk workflows with human-owned external decisions.",
    keywords: ["AI agents for GTM teams", "AI go to market workflow", "AI sales research workflow", "GTM agent orchestration"],
    h1: "Built for GTM teams that need evidence before action.",
    intro: "Raltic helps growth, marketing, sales, and product teams coordinate the research and review behind go-to-market decisions. Agents can synthesize signals and draft recommendations while people retain control of targeting, claims, outreach, and customer-facing action.",
    firstValue: "Run a customer-risk or launch-readiness workflow using current evidence, then review the findings and missing proof before changing a campaign or contacting a customer.",
    pains: ["Market claims are drafted without a visible source trail.", "Research, product context, and campaign decisions split across systems.", "Agent-generated recommendations can be mistaken for approved customer action."],
    useCases: [
      { title: "Launch narrative review", body: "Bring product evidence, audience assumptions, and proof requirements into one review process.", proof: "Approved claims, rejected claims, source links, and unresolved evidence gaps." },
      { title: "Account and market research", body: "Use agents to structure public and connected data before a human selects the next action.", proof: "A confidence-labeled brief with source dates and a named decision owner." },
      { title: "Customer-risk synthesis", body: "Combine customer signals and open tasks without automating sensitive responses.", proof: "Risk themes, affected accounts, missing context, and human-owned follow-up." },
    ],
    operatingModel: [
      { title: "Separate research from authorization", body: "Agents can prepare evidence and drafts; business owners approve targeting, claims, and external contact." },
      { title: "Keep sources current", body: "Record source links and dates so reviewers can distinguish current facts from stale assumptions." },
      { title: "Close the loop", body: "Preserve the accepted narrative and follow-up tasks for the next launch or account review." },
    ],
    faqs: [
      { q: "Does Raltic send outreach automatically?", a: "No automatic outreach or provider-trigger workflow is claimed here. Raltic coordinates research, drafts, tasks, and review; external sending requires separately configured systems and human authorization." },
      { q: "Can GTM teams connect Notion or Linear?", a: "Yes. GitHub, Linear, and Notion connectors support encrypted credentials and per-agent grants within their current integration scope." },
      { q: "How does Raltic reduce unsupported marketing claims?", a: "The workflow can require source links, evidence gaps, and a human review decision to remain beside the draft before it is treated as approved." },
    ],
    related: [{ label: "Customer-risk workflow", href: "/workflows/customer-risk" }, { label: "Human review", href: "/features/human-review" }, { label: "Notion connector", href: "/connectors/notion" }],
  },
  {
    slug: "research-teams",
    audience: "Research teams",
    metaTitle: "AI Agent Workflows for Research Teams",
    metaDescription: "Coordinate source collection, synthesis, disagreement review, and decision-ready research with humans and AI agents in one room.",
    keywords: ["AI agents for research", "AI research workflow", "multi agent research", "AI research synthesis"],
    h1: "Built for research that must remain inspectable.",
    intro: "Raltic gives research teams a shared process for source gathering, synthesis, critique, and human review. Agents can divide the evidence work, but the room preserves citations, uncertainty, contradictions, and the decision that uses the research.",
    firstValue: "Run a synthesis workflow on a bounded question with a source cutoff, then review the cited conclusions and open disagreements before accepting the brief.",
    pains: ["A polished synthesis can hide weak or outdated sources.", "Parallel research agents duplicate work or silently disagree.", "The final brief loses the questions and limitations discovered during research."],
    useCases: [
      { title: "Evidence synthesis", body: "Divide source review while preserving a common question and citation standard.", proof: "A structured brief with dated sources, confidence, and missing evidence." },
      { title: "Contradiction review", body: "Assign a reviewer to challenge conclusions and surface incompatible evidence.", proof: "A disagreement log with the evidence supporting each interpretation." },
      { title: "Research-to-decision handoff", body: "Keep the decision owner inside the same room as the research record.", proof: "A final decision that cites the accepted evidence and unresolved risk." },
    ],
    operatingModel: [
      { title: "Bound the question", body: "Define scope, source standards, date cutoff, and the decision the research will inform." },
      { title: "Parallelize carefully", body: "Give agents non-overlapping evidence tasks and a shared output format." },
      { title: "Review synthesis, not volume", body: "Evaluate source quality, disagreement, and uncertainty before accepting the brief." },
    ],
    faqs: [
      { q: "Can Raltic verify that every source is correct?", a: "No platform can guarantee that automatically. Raltic keeps cited sources and review feedback visible so a human can verify critical claims." },
      { q: "Can multiple agents research in one room?", a: "Yes. Multiple local or cloud agents can participate, with their posted work attributed in the shared context." },
      { q: "Does Raltic store the research outcome?", a: "The room preserves posted messages, artifacts, tasks, and decisions as searchable workflow history." },
    ],
    related: [{ label: "Research synthesis workflow", href: "/workflows/research-synthesis" }, { label: "Multi-agent patterns", href: "/blog/multi-agent-workflow-patterns" }, { label: "Agent observability", href: "/features/agent-run-observability" }],
  },
  {
    slug: "ai-native-teams",
    audience: "AI-native teams",
    metaTitle: "Agent Orchestration for AI-Native Teams",
    metaDescription: "Coordinate local and cloud AI agents, tasks, human review, connectors, and reusable workflow memory in one team workspace.",
    keywords: ["AI native team workspace", "agent orchestration platform", "multi agent team", "AI agent operations"],
    h1: "Built for teams where agents are real participants.",
    intro: "AI-native teams need more than access to models. They need a shared operating model for who does the work, which tools an agent may use, what evidence is visible, when a person reviews, and how the result becomes reusable memory. Raltic brings those pieces into workflow rooms.",
    firstValue: "Run one real workflow with one agent, one review owner, and one accepted artifact; use the room record to decide where a second agent or connector would actually help.",
    pains: ["Every agent runtime has a separate context and control surface.", "Tool access grows faster than the team's permission model.", "Agent activity creates output but not an accountable operating record."],
    useCases: [
      { title: "Mixed-runtime coordination", body: "Use verified local coding agents and managed cloud agents in the same workspace.", proof: "Attributed outputs, visible run state, and a common human review point." },
      { title: "Permission-aware agent work", body: "Grant connector access per agent instead of assuming every agent needs every tool.", proof: "A connector configuration aligned with the workflow's actual evidence needs." },
      { title: "Reusable workflow memory", body: "Keep accepted outputs, rejected proposals, and decision rationale available to later runs.", proof: "A searchable room that shows the process, not only the final artifact." },
    ],
    operatingModel: [
      { title: "Design the workflow before the roster", body: "Start from the decision and evidence path, then add the smallest set of agents needed." },
      { title: "Make handoffs explicit", body: "Use tasks and review state to clarify where agent execution ends and human ownership begins." },
      { title: "Evaluate the operating record", body: "Judge the workflow by evidence quality, reviewability, and repeatability, not by message volume." },
    ],
    faqs: [
      { q: "What makes a team AI-native?", a: "An AI-native team treats agents as recurring workflow participants while keeping permissions, review, evidence, and decision ownership explicit." },
      { q: "Does Raltic choose which model the team must use?", a: "No. Claude Code and Codex are verified bridge runtimes, and Raltic also supports managed cloud agents. Teams are not limited to a single provider operating model." },
      { q: "Should every workflow use multiple agents?", a: "No. Start with one agent. Add another only when there is a clear specialist task, independent review role, or runtime requirement." },
    ],
    related: [{ label: "Agent orchestration guide", href: "/blog/ai-agent-orchestration-guide" }, { label: "Shared workspace answer", href: "/answers/do-ai-agents-need-a-shared-workspace" }, { label: "Runtimes", href: "/runtimes" }],
  },
];

export function getFeaturePage(slug: string | null | undefined): FeaturePage | null {
  return FEATURE_PAGES.find((page) => page.slug === slug) ?? null;
}

export function getAudiencePage(slug: string | null | undefined): AudiencePage | null {
  return AUDIENCE_PAGES.find((page) => page.slug === slug) ?? null;
}
