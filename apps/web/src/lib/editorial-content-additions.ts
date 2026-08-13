import type { AnswerPage, BlogArticle } from "@/lib/growth-content";

const PUBLISHED = "2026-08-13";

export const EXPANDED_BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "how-to-evaluate-ai-agent-platforms",
    title: "How to evaluate an AI agent platform without buying the demo",
    metaTitle: "How to Evaluate an AI Agent Platform",
    metaDescription: "Evaluate AI agent platforms with a real workflow, failure cases, evidence review, runtime boundaries, total operating cost, and a reusable scorecard.",
    keywords: ["how to evaluate AI agent platforms", "AI agent platform checklist", "AI agent software evaluation", "agent platform buying guide"],
    dek: "A polished agent demo usually shows the happy path and hides the expensive parts: context assembly, permissions, failed tools, reviewer effort, and recovery. Test the operating model before you compare feature lists.",
    directAnswer: "Evaluate an AI agent platform with one real, bounded workflow. Give every vendor the same brief, sources, permissions, and acceptance criteria. Then test a normal run, a missing-source case, a failed tool, a reviewer rejection, and an interrupted run. Score time to reviewable value, evidence quality, recovery, permission clarity, human effort, and whether the final record can be reused. Do not choose on output fluency alone.",
    published: PUBLISHED,
    updated: PUBLISHED,
    readTime: "12 min read",
    sections: [
      {
        id: "test-one-workflow",
        title: "Start with one workflow the team already understands",
        answer: "A useful evaluation begins with a familiar process, not a vendor's scripted example.",
        paragraphs: [
          "Choose work that repeats, has real evidence, and ends with a named human decision. Launch readiness, customer-risk review, research synthesis, and bounded code review work well because the team can recognize a good artifact and spot missing proof.",
          "Write the brief before opening a product. Include the source set, date cutoff, prohibited actions, expected artifact, and acceptance criteria. Every platform should receive the same task. Otherwise, the evaluation measures demo quality rather than product fit.",
        ],
        bullets: ["One recurring process", "One accountable owner", "Known source material", "A reviewable artifact", "A decision that must remain human-owned"],
      },
      {
        id: "break-the-happy-path",
        title: "Break the happy path on purpose",
        answer: "The fastest way to understand an agent platform is to watch it fail and recover.",
        paragraphs: [
          "Remove a required source. Expire a credential. Give two sources that disagree. Reject the first output and ask for a revision. Interrupt a run midway. These are ordinary operating conditions, not edge cases, and they expose whether the product has useful state or merely a convincing final answer.",
          "A strong system identifies what failed, preserves completed work, shows what remains uncertain, and gives a person a reasonable next action. A weak one retries silently, loses the brief, or reports success because the process ended.",
        ],
        bullets: ["Missing or stale evidence", "Unavailable tool or expired credential", "Conflicting sources", "Reviewer rejection", "Interrupted run and resume"],
      },
      {
        id: "score-operating-quality",
        title: "Score operating quality, not model charisma",
        answer: "The winning output is the one a reviewer can trust, correct, and reuse with the least hidden work.",
        paragraphs: [
          "Measure time from the brief to a review-ready artifact. Check whether claims point to adequate evidence and whether uncertainty is visible. Count the corrections a reviewer makes, but also record why: poor source selection, lost context, weak tool use, or an unclear brief require different fixes.",
          "Model quality matters, but most mature platforms can call capable models. The harder questions concern context, tools, state, review, and recovery. Those are the parts the team will operate every week.",
        ],
        bullets: ["Time to reviewable value", "Evidence coverage and freshness", "Reviewer correction rate", "Recovery after failure", "Context reused on the next run"],
      },
      {
        id: "price-real-cost",
        title: "Price the work around the subscription",
        answer: "Total cost includes setup, integration, monitoring, evaluation, review, and migration, not only seats or tokens.",
        paragraphs: [
          "A low subscription can be expensive if engineers must build identity, notifications, reviewer screens, and run history. A broad enterprise platform can also be wasteful when one team only needs a shared workflow record. List what the product supplies and what your team must own.",
          "End the trial by exporting or revisiting the completed workflow. Ask a teammate who did not join the run to explain what happened. If they cannot identify the evidence, open tasks, reviewer feedback, and final decision, the platform has not created reusable operating memory.",
        ],
        bullets: ["Implementation and integration", "Evaluation and monitoring", "Reviewer attention", "Provider and infrastructure usage", "Exit, export, and migration"],
      },
    ],
    sources: [
      { publisher: "NIST", label: "AI Risk Management Framework", href: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10" },
      { publisher: "LangChain", label: "LangSmith evaluation lifecycle", href: "https://docs.langchain.com/langsmith/evaluation" },
      { publisher: "OpenAI", label: "A practical guide to building AI agents", href: "https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/" },
    ],
    faqs: [
      { q: "How long should an AI agent platform trial run?", a: "Run enough repetitions to include normal work, a failure, a reviewer correction, and a second run that reuses prior context. One polished demo is not enough." },
      { q: "What is the most important evaluation metric?", a: "Time to reviewable value is a useful lead metric because it includes agent speed and the human effort required to trust the result." },
      { q: "Should every vendor use the same model?", a: "Use the same model when the platform allows it, but document when a product is tied to another provider. The goal is to separate model quality from workflow quality." },
      { q: "What should disqualify a platform?", a: "Unclear data boundaries, hidden failure state, missing reviewer authority, unsupported product claims, or an inability to reconstruct what happened should stop the purchase." },
    ],
    related: [
      { label: "2026 orchestration platform shortlist", href: "/best/ai-agent-orchestration-platforms" },
      { label: "Raltic comparisons", href: "/compare" },
      { label: "Agent observability guide", href: "/blog/ai-agent-observability" },
    ],
  },
  {
    slug: "build-vs-buy-ai-agent-orchestration",
    title: "Build vs buy AI agent orchestration: choose the layer first",
    metaTitle: "Build vs Buy AI Agent Orchestration",
    metaDescription: "Decide whether to build or buy AI agent orchestration by separating frameworks, runtimes, automation, team workflow, governance, and reviewer experience.",
    keywords: ["build vs buy AI agent orchestration", "buy AI agent platform", "build agent orchestration", "agent platform decision"],
    dek: "Teams often ask whether to build or buy before agreeing on what they need. A runtime, an automation graph, a reviewer interface, and a shared team record are separate layers with different ownership costs.",
    directAnswer: "Build AI agent orchestration when the agent behavior is part of your product, you need custom state and recovery, and your team can own runtime, evaluation, security, and reviewer experience. Buy when the workflow is an internal operating process and the product already supplies the shared context, permissions, review, and history you need. Many teams should combine both: build the domain-specific agent or graph, then buy the surrounding collaboration, observability, or governance layer.",
    published: PUBLISHED,
    updated: PUBLISHED,
    readTime: "11 min read",
    sections: [
      {
        id: "separate-layers",
        title: "Separate the six layers before estimating anything",
        answer: "Most build-versus-buy debates combine components that can be chosen independently.",
        paragraphs: [
          "The model decides and generates. A framework structures tools and agent loops. A runtime handles state, queues, persistence, and recovery. An automation layer connects systems and triggers. A team surface carries briefs, tasks, evidence, and review. Governance covers identity, policy, evaluation, and audit requirements.",
          "Write down which layers create product differentiation and which are operating infrastructure. Building a custom research planner may be sensible. Building another login system, notification service, reviewer inbox, and activity history often is not.",
        ],
        bullets: ["Model and tool loop", "Framework or graph", "Runtime and durable state", "Integrations and triggers", "Team workflow and review", "Governance and evaluation"],
      },
      {
        id: "when-to-build",
        title: "Build when orchestration behavior is part of the product",
        answer: "Custom code is justified when the workflow itself creates defensible product value or requires unusual control.",
        paragraphs: [
          "A customer-facing agent may need domain-specific state, deterministic branches, custom recovery, latency targets, and tightly controlled tool execution. Frameworks such as LangGraph and CrewAI exist for this job. They give developers primitives without deciding the final product experience.",
          "The build estimate must include more than the first successful run. Add deployment, state migrations, retries, observability, evaluation datasets, access control, red-team cases, support, and the UI where a person handles exceptions.",
        ],
        bullets: ["Agent behavior differentiates the product", "State and recovery are domain-specific", "Latency or deployment constraints are unusual", "The team owns long-term runtime operations", "A custom reviewer experience is funded"],
      },
      {
        id: "when-to-buy",
        title: "Buy when the workflow is important but not proprietary",
        answer: "A team should buy the surrounding operating layer when speed, adoption, and continuity matter more than custom runtime logic.",
        paragraphs: [
          "Internal launch review, research synthesis, customer-risk analysis, and routine handoffs rarely need a bespoke orchestration engine on day one. They need a clear brief, available evidence, bounded agent access, visible progress, a reviewer, and a record that survives the meeting.",
          "Buying also makes sense when non-developers own the workflow. If every change to a review step needs a framework engineer, the technical architecture has captured a business process that should remain adaptable.",
        ],
        bullets: ["The process is common across teams", "A usable room or workflow already exists", "Non-developers own acceptance", "Time to first reviewed artifact matters", "Custom runtime control adds little value"],
      },
      {
        id: "hybrid-path",
        title: "The practical answer is often hybrid",
        answer: "Build the narrow intelligence or runtime that matters, and buy the undifferentiated operating surfaces around it.",
        paragraphs: [
          "A team might build a LangGraph application, deploy it on a cloud agent platform, use n8n for deterministic integrations, and keep human review in an existing work system. Another team may connect Claude Code and Codex through Raltic and avoid building orchestration code altogether. Both are coherent if ownership boundaries are explicit.",
          "Before committing, draw the data and control path. Name who owns each credential, where state persists, what the reviewer sees, which system authorizes the action, and how the team recovers when one layer fails. The diagram usually settles the argument faster than a long feature spreadsheet.",
        ],
        bullets: ["Build the differentiated agent logic", "Buy commodity workflow surfaces", "Keep authorization in the destination system", "Connect layers through explicit contracts", "Test failure across every boundary"],
      },
    ],
    sources: [
      { publisher: "Anthropic", label: "Building effective agents", href: "https://www.anthropic.com/engineering/building-effective-agents" },
      { publisher: "LangChain", label: "Frameworks, runtimes, and harnesses", href: "https://docs.langchain.com/oss/python/concepts/products" },
      { publisher: "Google Cloud", label: "Gemini Enterprise Agent Platform overview", href: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/overview?hl=en" },
    ],
    faqs: [
      { q: "Is it cheaper to build an agent platform?", a: "Only if the team includes ongoing runtime, integration, evaluation, security, reviewer, and support work. Prototype cost is not operating cost." },
      { q: "Can a team combine an open-source framework with a SaaS workflow product?", a: "Yes. Keep contracts explicit: the framework owns agent execution, while the SaaS layer may own collaboration, review, observability, or governance." },
      { q: "When should a startup buy first?", a: "Buy first when the workflow is internal and a commercial product can produce a reviewed artifact quickly. Build later if real usage exposes a differentiated runtime requirement." },
      { q: "What is the biggest hybrid architecture risk?", a: "Ambiguous ownership. Teams must know which layer stores state, retries work, enforces permissions, alerts reviewers, and records the final decision." },
    ],
    related: [
      { label: "Orchestration platforms by job", href: "/best/ai-agent-orchestration-platforms" },
      { label: "Raltic vs LangGraph", href: "/compare/langgraph" },
      { label: "AI agent orchestration guide", href: "/blog/ai-agent-orchestration-guide" },
    ],
  },
];

export const EXPANDED_ANSWER_PAGES: AnswerPage[] = [
  {
    slug: "what-is-an-ai-agent-orchestration-platform",
    question: "What is an AI agent orchestration platform?",
    metaTitle: "What Is an AI Agent Orchestration Platform?",
    metaDescription: "An AI agent orchestration platform coordinates agent roles, context, tools, state, handoffs, review, recovery, and the final workflow outcome.",
    keywords: ["what is an AI agent orchestration platform", "agent orchestration platform definition", "AI orchestration software"],
    shortAnswer: "An AI agent orchestration platform coordinates how one or more agents receive context, use tools, share state, hand work to other agents or people, recover from failure, and reach a reviewed outcome. The category includes different layers: developer frameworks, runtimes, automation builders, cloud lifecycle platforms, and team workflow products. A useful evaluation starts by identifying which layer the team actually needs.",
    sections: [
      { id: "responsibilities", title: "What does orchestration control?", answer: "It controls routing, context, tools, execution state, handoffs, review, and recovery.", paragraphs: ["The model call is only one step. The platform determines what happens before the call, what evidence follows it, who sees the result, and what the system does when the work fails or remains uncertain."], bullets: ["Task and role routing", "Context and tool access", "State and persistence", "Handoffs and escalation", "Human review and recovery"] },
      { id: "categories", title: "Why do orchestration products look so different?", answer: "Products own different layers of the same stack.", paragraphs: ["LangGraph and CrewAI supply code-level primitives. n8n supplies an automation graph. Copilot Studio and Google's Agent Platform cover broader build and governance lifecycles. Raltic supplies a team-facing workflow room."] },
      { id: "choice", title: "How should a team choose?", answer: "Choose the layer first, then test one workflow and one failure case.", paragraphs: ["Do not compare a framework and a collaboration product as if they were interchangeable. Decide what your team will build, what it will operate, and what a reviewer must be able to see and change."], bullets: ["Name the required layer", "Define the first useful artifact", "Test failure and resume", "Inspect reviewer context", "Price the operating work"] },
    ],
    faqs: [
      { q: "Is agent orchestration the same as workflow automation?", a: "No. Workflow automation usually runs predefined steps. Agent orchestration also coordinates probabilistic agent decisions, context, tools, handoffs, evaluation, and review." },
      { q: "Does orchestration require multiple agents?", a: "No. One agent, one tool path, and one reviewer can still require useful orchestration." },
      { q: "What is the best orchestration platform?", a: "The answer depends on the layer. Choose a framework for custom agent applications, automation software for trigger-driven integrations, a cloud platform for enterprise lifecycle needs, or a workflow room for team operations." },
    ],
    related: [
      { label: "Orchestration guide", href: "/blog/ai-agent-orchestration-guide" },
      { label: "2026 platform shortlist", href: "/best/ai-agent-orchestration-platforms" },
      { label: "Build vs buy", href: "/blog/build-vs-buy-ai-agent-orchestration" },
    ],
  },
  {
    slug: "what-is-the-difference-between-an-agent-framework-and-platform",
    question: "What is the difference between an AI agent framework and a platform?",
    metaTitle: "AI Agent Framework vs Platform: What Differs?",
    metaDescription: "An agent framework provides code primitives; an agent platform adds runtime, deployment, observability, governance, or team workflow surfaces.",
    keywords: ["AI agent framework vs platform", "agent framework definition", "agent platform difference"],
    shortAnswer: "An AI agent framework is a developer library for defining models, tools, state, and control flow. An AI agent platform supplies more of the operating environment, such as managed runtime, deployment, persistence, observability, evaluation, identity, integrations, or a team-facing workflow surface. Some vendors offer both. The practical difference is how much application and operational work your team still owns.",
    sections: [
      { id: "framework", title: "What does a framework provide?", answer: "A framework provides code-level building blocks and leaves the application experience to the developer.", paragraphs: ["Typical primitives include agents, tools, graphs, tasks, memory adapters, callbacks, guardrails, and state transitions."], bullets: ["Maximum code-level control", "Custom application behavior", "Team owns deployment and UX", "Team owns most operating integration"] },
      { id: "platform", title: "What does a platform add?", answer: "A platform owns more of the runtime or operating surface.", paragraphs: ["That may include hosting, queues, persistence, tracing, evaluations, identity, policy, integrations, reviewer screens, collaboration, or workflow history. No platform includes every layer, so read the boundary carefully."] },
      { id: "decision", title: "Which should a team choose?", answer: "Choose a framework when agent behavior differentiates the product; choose a platform when the surrounding operations are the larger burden.", paragraphs: ["A hybrid is common. Developers can build a domain agent with a framework and use separate products for deployment, observability, automation, or team review."] },
    ],
    faqs: [
      { q: "Is LangGraph a framework or a platform?", a: "LangGraph is a low-level framework and runtime. LangSmith supplies related observability, evaluation, and deployment platform capabilities." },
      { q: "Is Raltic an agent framework?", a: "No. Raltic is a team-facing workflow-room platform for operating agent-assisted work." },
      { q: "Can a framework connect to a platform?", a: "Yes. Keep responsibility for state, credentials, retries, review, and authorization explicit between the layers." },
    ],
    related: [
      { label: "Build vs buy guide", href: "/blog/build-vs-buy-ai-agent-orchestration" },
      { label: "Raltic vs LangGraph", href: "/compare/langgraph" },
      { label: "Platform evaluation guide", href: "/blog/how-to-evaluate-ai-agent-platforms" },
    ],
  },
  {
    slug: "how-do-ai-agents-hand-off-tasks",
    question: "How do AI agents hand off tasks?",
    metaTitle: "How Do AI Agents Hand Off Tasks?",
    metaDescription: "A reliable AI agent handoff transfers task state, evidence, constraints, artifacts, uncertainty, ownership, and the next acceptance condition.",
    keywords: ["how AI agents hand off tasks", "multi agent handoff", "agent task handoff"],
    shortAnswer: "AI agents hand off tasks by transferring a bounded task package to another agent or person. The package should include the objective, completed work, source evidence, artifacts, constraints, unresolved questions, uncertainty, current state, and the next acceptance condition. A message such as 'continue this' is not a reliable handoff because it hides what the next participant needs to trust and finish the work.",
    sections: [
      { id: "packet", title: "What belongs in a handoff packet?", answer: "The recipient needs enough context to continue without replaying the entire run.", paragraphs: ["Keep the task small and name the expected next artifact. Preserve source attribution so a specialist or reviewer can verify the work rather than trusting a summary."], bullets: ["Objective and owner", "Completed work", "Evidence and artifacts", "Constraints and uncertainty", "Next acceptance condition"] },
      { id: "state", title: "How should handoff state be represented?", answer: "Use explicit ownership and status rather than inferring progress from conversation order.", paragraphs: ["A task should show whether it is unclaimed, active, blocked, in review, or complete. The handoff should name the new owner and retain the prior contributor's evidence."] },
      { id: "failure", title: "What causes handoffs to fail?", answer: "Handoffs fail when summaries erase sources, ownership is ambiguous, or the next agent receives too much unrelated context.", paragraphs: ["The fix is not a larger prompt. Transfer the smallest complete task package and make missing information visible."], bullets: ["Vague next step", "Missing source links", "No named recipient", "Lost constraints", "Completion without acceptance"] },
    ],
    faqs: [
      { q: "Should agents message each other directly?", a: "They can, but the task and evidence should remain visible to the workflow owner so the handoff is inspectable and recoverable." },
      { q: "Can a human receive an agent handoff?", a: "Yes. Human review is a handoff where the packet must state the proposal, evidence, uncertainty, and requested decision." },
      { q: "How many handoffs are too many?", a: "Every handoff adds latency and context-loss risk. Add one only when specialization, independent critique, or a runtime boundary justifies it." },
    ],
    related: [
      { label: "Tasks and handoffs", href: "/features/tasks-and-handoffs" },
      { label: "Multi-agent patterns", href: "/blog/multi-agent-workflow-patterns" },
      { label: "Workflow rooms", href: "/features/workflow-rooms" },
    ],
  },
  {
    slug: "what-should-an-ai-agent-audit-trail-include",
    question: "What should an AI agent audit trail include?",
    metaTitle: "What Should an AI Agent Audit Trail Include?",
    metaDescription: "An AI agent audit trail should record the brief, participants, evidence, tool events, task and run state, artifacts, review, and final outcome.",
    keywords: ["AI agent audit trail", "agent run record", "AI workflow audit log"],
    shortAnswer: "An AI agent audit trail should record the workflow brief, participants and runtimes, relevant inputs, source evidence, tool events, task and run state, posted artifacts, errors, reviewer feedback, and final decision. It should distinguish execution completion from human approval and should not claim access to hidden model reasoning. The record must be useful for investigation and recovery, not merely verbose.",
    sections: [
      { id: "minimum", title: "What is the minimum useful record?", answer: "Record enough to reconstruct what was requested, what happened, what evidence supported it, and who accepted the outcome.", paragraphs: ["Timestamps and identifiers matter, but a wall of logs is not a decision record. Link operational events to the task, artifact, and reviewer they affected."], bullets: ["Brief and acceptance criteria", "Agent and human participants", "Inputs, sources, and tools", "Run, error, and task state", "Review feedback and final decision"] },
      { id: "reasoning", title: "Should it include chain-of-thought?", answer: "No. Record observable inputs, actions, outputs, evidence, and decisions instead of requiring hidden reasoning.", paragraphs: ["A concise explanation or cited rationale can help a reviewer. Hidden model reasoning is not required for an operational audit trail and may create false confidence."] },
      { id: "quality", title: "How do you test an audit trail?", answer: "Give the record to someone who did not observe the run and ask them to diagnose a failure or continue the work.", paragraphs: ["If they cannot identify the source, failed step, current owner, and next action, the record is incomplete. If they cannot find the decision among noisy events, it is poorly designed."] },
    ],
    faqs: [
      { q: "Is a completed run the same as approved work?", a: "No. Completion records that execution ended. Approval records that an authorized person accepted the result." },
      { q: "Should every model token be stored?", a: "No. Store the observable evidence and events needed for the workflow's risk and debugging needs while applying privacy and retention rules." },
      { q: "Who should be able to read the audit trail?", a: "Access should match workspace roles, data sensitivity, and investigation duties. A shared record does not imply unrestricted access." },
    ],
    related: [
      { label: "Agent run observability", href: "/features/agent-run-observability" },
      { label: "Observability guide", href: "/blog/ai-agent-observability" },
      { label: "Security boundaries", href: "/security" },
    ],
  },
  {
    slug: "when-should-ai-agents-require-human-approval",
    question: "When should AI agents require human approval?",
    metaTitle: "When Should AI Agents Require Human Approval?",
    metaDescription: "AI agents should require human approval for high-impact, hard-to-reverse, uncertain, externally visible, or permission-changing actions.",
    keywords: ["when AI agents need human approval", "AI approval gate", "agent human review criteria"],
    shortAnswer: "AI agents should require human approval before actions that are high-impact, hard to reverse, legally or financially consequential, customer-facing, permission-changing, or based on uncertain evidence. Low-risk preparation such as drafting, classifying, and summarizing can often proceed without approval. The reviewer must have relevant evidence, enough time, and real authority to reject or change the next step.",
    sections: [
      { id: "risk", title: "Which risk signals should trigger approval?", answer: "Use impact, reversibility, uncertainty, exposure, and authority as the main signals.", paragraphs: ["A familiar action can still be risky when it affects many users. An unusual action can be low-risk when it remains a private draft. Evaluate the transition, not the sophistication of the model."], bullets: ["Customer or public exposure", "Money, legal, or access impact", "Production system change", "Weak or conflicting evidence", "Action that is hard to undo"] },
      { id: "reviewer", title: "What does the reviewer need?", answer: "The reviewer needs the proposal, evidence, uncertainty, affected systems, and the exact decision requested.", paragraphs: ["An approval request without context shifts the investigation burden to the person and encourages rubber-stamping."] },
      { id: "avoid-fatigue", title: "How do teams avoid approval fatigue?", answer: "Automate low-risk preparation, group routine work, and escalate exceptions instead of asking for a click on every step.", paragraphs: ["Measure repeated corrections and approval volume. Both can reveal a poor brief, weak evidence requirements, or a gate placed at the wrong point."] },
    ],
    faqs: [
      { q: "Should an AI agent require approval before sending email?", a: "Customer-facing or consequential outreach generally needs an authorized human and destination-system controls unless the organization has explicitly approved a narrower automated case." },
      { q: "Does a high confidence score remove the need for approval?", a: "No. Confidence does not change the impact or authority required for an action." },
      { q: "Can approval happen after the action?", a: "Post-action audit can supplement control, but it cannot prevent irreversible harm. Place approval before high-impact transitions." },
    ],
    related: [
      { label: "Human review feature", href: "/features/human-review" },
      { label: "Approval workflow guide", href: "/blog/ai-agent-approval-workflow" },
      { label: "Human-in-the-loop platforms", href: "/best/human-in-the-loop-ai-platforms" },
    ],
  },
  {
    slug: "how-do-you-compare-ai-agent-platforms",
    question: "How do you compare AI agent platforms?",
    metaTitle: "How Do You Compare AI Agent Platforms?",
    metaDescription: "Compare AI agent platforms across product layer, runtime, context, tools, review, observability, recovery, implementation, and total cost.",
    keywords: ["how to compare AI agent platforms", "AI agent platform comparison criteria", "agent platform evaluation"],
    shortAnswer: "Compare AI agent platforms across nine dimensions: the layer they own, runtime model, context and memory, tool permissions, orchestration control, human review, observability, failure recovery, and total operating cost. Use one real workflow and the same acceptance criteria for every product. A framework, automation builder, cloud platform, and shared team workspace should not receive the same scorecard because they solve different parts of the stack.",
    sections: [
      { id: "dimensions", title: "Which dimensions matter?", answer: "Start with the product layer, then evaluate the operating path from brief to accepted outcome.", paragraphs: ["Model access and integration counts are easy to compare but often less decisive than state, permissions, reviewer context, and recovery."], bullets: ["Product layer and runtime", "Context and memory", "Tools and permissions", "Review and authorization boundary", "Observability, recovery, and cost"] },
      { id: "trial", title: "What should the trial include?", answer: "Run a normal case, a missing-source case, a tool failure, a reviewer rejection, and a repeated run.", paragraphs: ["Use the same brief and evidence for each platform. Record human setup and correction time so the fastest model response does not hide the slowest operating process."] },
      { id: "decision", title: "How should the final decision be made?", answer: "Choose the lowest-complexity product that meets the workflow's control and evidence needs.", paragraphs: ["More autonomy, integrations, or infrastructure are not automatically better. Buy the layer that removes real coordination cost without hiding ownership."] },
    ],
    faqs: [
      { q: "Should price be compared per seat or per token?", a: "Compare total operating cost: seats, provider usage, infrastructure, integration, evaluation, monitoring, reviewer effort, and migration." },
      { q: "How do you compare a framework with a SaaS platform?", a: "Do not score them as direct substitutes. Compare how much of the final workflow each supplies and what your team must build and operate." },
      { q: "What is a useful proof of concept?", a: "A bounded workflow that reaches a reviewable artifact, survives one failure, accepts reviewer feedback, and leaves a reusable record." },
    ],
    related: [
      { label: "Full evaluation guide", href: "/blog/how-to-evaluate-ai-agent-platforms" },
      { label: "Orchestration platform shortlist", href: "/best/ai-agent-orchestration-platforms" },
      { label: "All comparisons", href: "/compare" },
    ],
  },
];
