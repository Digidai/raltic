import type { AnswerPage, BlogArticle } from "@/lib/growth-content";

const PUBLISHED = "2026-08-15";

export const ROUND_TWO_BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "ai-agent-stack-layers",
    title: "AI agent stack layers: framework, builder, runtime, observability, and workflow room",
    metaTitle: "AI Agent Stack: Framework vs Platform Layers",
    metaDescription: "Map the AI agent stack from SDKs and visual builders through runtimes, observability, evaluation, and team workflow rooms so you can compare the right products.",
    keywords: ["AI agent stack", "agent framework vs platform", "AI agent architecture layers", "agent orchestration stack"],
    dek: "Most agent-platform comparisons fail before the feature table begins. They place a developer SDK, a visual builder, a cloud runtime, a trace viewer, and a team workspace in one category even though each owns a different part of the work.",
    directAnswer: "The AI agent stack has five practical layers: SDKs and frameworks define agent behavior; visual builders package flows and applications; runtimes execute and persist work; observability and evaluation tools explain and score behavior; and workflow rooms coordinate the people, evidence, tasks, and decisions around that work. One product may cover several layers, but no label proves that it covers the layer your team actually needs.",
    published: PUBLISHED,
    updated: PUBLISHED,
    readTime: "13 min read",
    visual: {
      eyebrow: "Four operating questions",
      title: "Separate how an agent is built from how its work becomes an accepted team outcome.",
      mode: "stack",
      items: [
        { label: "Build", detail: "Define models, tools, prompts, state, routes, and application behavior." },
        { label: "Run", detail: "Execute, persist, resume, scale, secure, and deploy the agent system." },
        { label: "Understand", detail: "Trace steps, evaluate quality, compare versions, and catch regressions." },
        { label: "Operate", detail: "Assign work, review evidence, correct outputs, and record the decision." },
      ],
    },
    sections: [
      {
        id: "why-category-breaks",
        title: "Why the agent-platform category keeps breaking",
        answer: "The category name describes a market, not a stable product boundary.",
        paragraphs: [
          "A team searching for an agent platform may be trying to build a customer-facing assistant, connect a model to ten business systems, run a durable graph, debug tool failures, or let product and engineering review agent work together. Those are separate purchasing jobs. A feature matrix that ignores the job rewards whichever vendor covers the most nouns.",
          "Start with the object the team must own after purchase. Source code points to a framework decision. A published application points to a builder. A fleet of long-running processes points to runtime infrastructure. A set of traces and regression cases points to observability and evaluation. A recurring cross-functional decision points to an operating workspace.",
        ],
        bullets: ["What must exist after the first month?", "Who builds and maintains it?", "Where does execution state live?", "How is failure diagnosed?", "Who accepts the outcome?"],
      },
      {
        id: "framework-builder",
        title: "Layer 1 and 2: frameworks define behavior; builders package an application",
        answer: "Frameworks offer code primitives, while visual builders make an application graph and delivery surface easier to assemble.",
        paragraphs: [
          "OpenAI Agents SDK, Google ADK, Microsoft Agent Framework, LangGraph, and CrewAI give developers abstractions for agents, tools, handoffs, state, guardrails, workflows, or evaluation. The application team still decides how those pieces become a product. The framework is valuable precisely because it leaves that product open.",
          "Dify, Flowise, Langflow, n8n, and Copilot Studio move more decisions into a canvas and managed environment. They may add knowledge, connectors, tests, logs, APIs, embedded interfaces, or publishing. This reduces setup, but the canvas also becomes a production artifact with versions, credentials, owners, and failure paths that need maintenance.",
        ],
        bullets: ["Framework: code and runtime primitives", "Builder: graph, configuration, and app packaging", "Check whether the canvas is source-controlled", "Check how custom code and components are reviewed", "Test migration before the first large workflow"],
      },
      {
        id: "runtime-control-plane",
        title: "Layer 3: runtime and control plane keep work alive",
        answer: "The runtime owns execution; a control plane helps teams govern many executions and agent identities.",
        paragraphs: [
          "A serious runtime question appears when work must survive a process restart, wait hours for approval, resume from a checkpoint, isolate tools, scale across tenants, or preserve session state. Some frameworks supply persistence hooks, while cloud platforms provide managed sessions, memory, identity, gateways, policy, and deployment infrastructure.",
          "Do not buy a control plane because the architecture diagram looks complete. A small team running one reviewed workflow may need a much narrower product. Conversely, a company operating hundreds of customer-facing agents should not expect a collaboration room to replace runtime isolation, policy enforcement, fleet management, or service-level monitoring.",
        ],
        bullets: ["Durability and resume semantics", "Tenant and process isolation", "Identity and tool authorization", "Deployment, scaling, and rollback", "Fleet policy and operational ownership"],
      },
      {
        id: "observability-evaluation",
        title: "Layer 4: observability explains behavior; evaluation judges it",
        answer: "Tracing and evaluation use the same run data for different questions.",
        paragraphs: [
          "A trace can show the model call, retrieved documents, tool arguments, handoff, latency, and error. It tells an engineer what happened. An evaluation adds a criterion: whether the tool was appropriate, the evidence was grounded, the route matched an expected trajectory, or the final output satisfied a rubric.",
          "Production quality needs a loop between the two. Inspect a failure, label the failure mode, promote a representative case into a dataset, run the candidate version against the same case, and monitor after release. A dashboard with no regression process is an archive, not a quality system.",
        ],
        bullets: ["Trace one complete unit of work", "Attach version and environment metadata", "Define expected behavior with reviewed cases", "Measure judge and human disagreement", "Feed production failures back into tests"],
      },
      {
        id: "workflow-room",
        title: "Layer 5: the workflow room records what the team decided",
        answer: "Technical telemetry cannot explain every business decision made around a run.",
        paragraphs: [
          "A team may reject a technically valid answer because a source is stale, a customer constraint changed, or the proposed action conflicts with a product promise. That reasoning often lives in a meeting, private message, or review comment. A workflow room keeps the brief, posted evidence, agent updates, tasks, corrections, and final decision in a form that another person can read.",
          "This layer complements the others. Engineers still need traces and automated regression tests. The operating team needs to know who asked for the work, what was considered sufficient, which concerns changed the result, and who owned acceptance. Raltic is built for that team-facing record and does not claim to replace the application framework beneath it.",
        ],
        bullets: ["Original brief and decision owner", "Evidence visible to the reviewer", "Agent and human contributions in context", "Tasks and unresolved follow-up", "Accepted outcome and rationale"],
      },
    ],
    sources: [
      { publisher: "OpenAI", label: "Agents SDK overview", href: "https://openai.github.io/openai-agents-python/" },
      { publisher: "Google", label: "Agent Development Kit", href: "https://adk.dev/" },
      { publisher: "Dify", label: "Workflow Studio", href: "https://dify.ai/workflows" },
      { publisher: "LangChain", label: "LangSmith observability concepts", href: "https://docs.langchain.com/langsmith/observability-concepts" },
    ],
    faqs: [
      { q: "What are the main layers of an AI agent stack?", a: "A practical stack includes framework or SDK, visual application builder, runtime or control plane, observability and evaluation, and a team workflow layer. Products can span layers, so map specific responsibilities rather than relying on category names." },
      { q: "Can one AI agent platform cover every layer?", a: "Some enterprise platforms cover development, runtime, governance, tracing, and evaluation. Teams may still use separate collaboration, business workflow, or decision systems. Breadth should be tested, not assumed." },
      { q: "Where does Raltic sit in the stack?", a: "Raltic sits mainly in the team workflow layer. It coordinates local and cloud agent participants with people, tasks, posted evidence, review, and a decision record. It is not a general agent SDK or technical tracing platform." },
    ],
    related: [
      { label: "Orchestration platforms by job", href: "/best/ai-agent-orchestration-platforms" },
      { label: "Visual AI agent builders", href: "/best/visual-ai-agent-builders" },
      { label: "Framework vs platform answer", href: "/answers/what-is-the-difference-between-an-agent-framework-and-platform" },
    ],
  },
  {
    slug: "ai-agent-evaluation-scorecard",
    title: "An AI agent evaluation scorecard that catches real workflow failures",
    metaTitle: "AI Agent Evaluation Scorecard & Test Method",
    metaDescription: "Build an AI agent evaluation scorecard for outcomes, evidence, tool use, trajectory, safety, cost, and human review, then turn failures into regression tests.",
    keywords: ["AI agent evaluation scorecard", "agent evals", "AI agent testing", "agent evaluation framework"],
    dek: "A single quality score hides the failure you need to fix. A useful scorecard separates the final outcome from the path, evidence, tools, risk, and reviewer effort, then runs the same cases again after every change.",
    directAnswer: "An AI agent evaluation scorecard should grade at least seven dimensions: task outcome, evidence quality, tool choice and arguments, trajectory efficiency, policy and permission compliance, latency and cost, and the amount of human correction required. Start with 10 to 30 reviewed cases, define pass conditions before running the agent, keep deterministic checks separate from subjective rubrics, and turn production failures into new regression cases.",
    published: PUBLISHED,
    updated: PUBLISHED,
    readTime: "14 min read",
    visual: {
      eyebrow: "Evaluation loop",
      title: "A failure is useful only when it becomes a named case the next version must pass.",
      mode: "loop",
      items: [
        { label: "Define", detail: "Write the outcome, constraints, expected evidence, and prohibited actions." },
        { label: "Run", detail: "Capture the full trajectory, tools, sources, output, cost, and version." },
        { label: "Review", detail: "Apply deterministic checks, rubrics, and domain-expert judgment separately." },
        { label: "Regress", detail: "Add failures to a dataset and compare the candidate against the baseline." },
      ],
    },
    sections: [
      {
        id: "scorecard-before-run",
        title: "Write the scorecard before looking at the result",
        answer: "Predefined criteria prevent a persuasive output from moving the goalposts.",
        paragraphs: [
          "Suppose an agent prepares a launch-readiness brief. The answer may sound polished while relying on old analytics, omitting an open security issue, or recommending launch without naming the decision owner. If reviewers invent criteria after reading the draft, fluency can hide those omissions.",
          "Write the required evidence, freshness window, mandatory sections, prohibited actions, and acceptance owner first. Some checks can be exact: every claim has a source URL, dates fall within 30 days, and no external change occurred. Others require judgment: whether the evidence supports the conclusion and whether uncertainty is explained honestly.",
        ],
        bullets: ["Named task and user outcome", "Required sources and freshness", "Hard constraints and prohibited actions", "Expected tool or route where necessary", "Authorized acceptance owner"],
      },
      {
        id: "seven-dimensions",
        title: "Use seven dimensions instead of one magic score",
        answer: "Separate failure types so the team knows what to change.",
        paragraphs: [
          "Outcome quality asks whether the artifact solves the task. Evidence quality checks grounding and freshness. Tool quality examines selection, arguments, and side effects. Trajectory quality looks for loops, unnecessary handoffs, and early stopping. Policy checks permissions and prohibited behavior. Efficiency covers latency and cost. Human correction measures how much expert work remained.",
          "Keep dimension scores visible rather than averaging everything into 82 out of 100. A high average can conceal a policy failure or an external action that should have been blocked. For consequential workflows, some dimensions are gates: if the agent violates access policy or omits mandatory evidence, the run fails regardless of its writing quality.",
        ],
        bullets: ["Outcome", "Evidence", "Tools", "Trajectory", "Policy", "Efficiency", "Human correction"],
      },
      {
        id: "dataset-design",
        title: "Build the first dataset from work people actually recognize",
        answer: "A small, reviewed dataset beats hundreds of synthetic prompts with unclear expectations.",
        paragraphs: [
          "Collect normal cases, edge cases, and known failures from the target workflow. Include ambiguous requests, missing sources, unavailable tools, conflicting evidence, permission denials, and a reviewer rejection. Each case needs enough context to reproduce the decision, not only the final user message.",
          "Ten to thirty cases are enough to expose whether the scorecard is usable. Ask two domain reviewers to score a sample independently. Their disagreements reveal unclear rubrics, contested policy, or genuinely subjective work. Fix the rubric before automating it with an LLM judge.",
        ],
        bullets: ["Common successful task", "Missing or stale evidence", "Tool or connector failure", "Ambiguous or conflicting instruction", "High-impact action requiring review", "Known production failure"],
      },
      {
        id: "judge-design",
        title: "Give code, model judges, and people different jobs",
        answer: "Use the cheapest reliable evaluator for each criterion and preserve human authority over contested outcomes.",
        paragraphs: [
          "Code is best for schemas, required fields, exact tools, forbidden actions, latency, cost, and deterministic policy checks. Model judges help with relevance, completeness, groundedness, and rubric-based comparison, but their scores should include explanations and be calibrated against human examples. People remain necessary for domain judgment, policy interpretation, and disputed cases.",
          "Measure evaluator quality too. Track false passes, false failures, stability across repeated judging, and disagreement with domain reviewers. A model judge that produces a precise decimal without a stable decision rule is adding theater, not confidence.",
        ],
        bullets: ["Code for exact invariants", "Model judges for documented qualitative rubrics", "Pairwise comparison for close variants", "Humans for policy and domain judgment", "Escalation path for evaluator disagreement"],
      },
      {
        id: "production-loop",
        title: "Connect offline regression to production review",
        answer: "Offline evals protect known behavior; production monitoring finds the cases you did not anticipate.",
        paragraphs: [
          "Run the scorecard on every material prompt, model, tool, routing, or retrieval change. Compare the candidate with the current version on the same dataset and inspect dimension-level regressions. A faster model that increases tool mistakes may still be the wrong release even if its average answer score rises.",
          "After deployment, sample real traces, collect reviewer corrections, and label recurring failure modes. Promote representative failures into the offline dataset with sensitive data removed or transformed. The evaluation system improves when the production workflow and test library share a disciplined feedback path.",
        ],
        bullets: ["Version every evaluated candidate", "Compare on identical cases", "Set gate dimensions before release", "Sample production by risk and uncertainty", "Promote corrected failures into regression tests"],
      },
    ],
    sources: [
      { publisher: "Google", label: "ADK agent evaluation", href: "https://adk.dev/evaluate/" },
      { publisher: "LangChain", label: "LangSmith evaluation concepts", href: "https://docs.langchain.com/langsmith/evaluation-concepts" },
      { publisher: "Braintrust", label: "Systematic evaluation", href: "https://www.braintrust.dev/docs/evaluate" },
      { publisher: "NIST", label: "AI Risk Management Framework", href: "https://www.nist.gov/itl/ai-risk-management-framework" },
    ],
    faqs: [
      { q: "How many cases are needed for the first agent evaluation?", a: "Start with 10 to 30 reviewed cases covering normal work, edge conditions, known failures, unavailable tools, conflicting evidence, and human rejection. Expand from real failures rather than synthetic volume alone." },
      { q: "Should an AI agent get one overall score?", a: "Usually not. Keep outcome, evidence, tools, trajectory, policy, efficiency, and human correction separate. Some dimensions should be hard gates regardless of the average." },
      { q: "Can an LLM evaluate another AI agent?", a: "Yes, for documented qualitative rubrics, but calibrate the judge against human labels, record its explanation, test stability, and preserve an escalation path for disagreement." },
    ],
    related: [
      { label: "Observability and eval tools", href: "/best/ai-agent-observability-evaluation-tools" },
      { label: "What is an agent evaluation?", href: "/answers/what-is-an-ai-agent-evaluation" },
      { label: "Agent run observability", href: "/features/agent-run-observability" },
    ],
  },
  {
    slug: "visual-ai-agent-builder-production-checklist",
    title: "A production checklist for visual AI agent builders",
    metaTitle: "Visual AI Agent Builder Production Checklist",
    metaDescription: "Use this production checklist to test visual AI agent builders for state, failures, human review, permissions, observability, evaluation, deployment, and ownership.",
    keywords: ["visual AI agent builder checklist", "Dify production checklist", "Flowise production", "Langflow production"],
    dek: "The first canvas demo usually works. The useful evaluation starts when a source is missing, a credential expires, the reviewer says no, and a new operator has to understand the workflow six months later.",
    directAnswer: "Before shipping a visual AI agent workflow, verify eight areas: versioned inputs and graph changes, explicit state and resume behavior, bounded tools and credentials, failure and timeout paths, meaningful human review, trace and cost visibility, repeatable evaluation cases, and a named operator. Test each item on the deployed artifact, not only in the builder playground.",
    published: PUBLISHED,
    updated: PUBLISHED,
    readTime: "12 min read",
    visual: {
      eyebrow: "Production path",
      title: "Move the workflow through four tests before anyone depends on it.",
      mode: "loop",
      items: [
        { label: "Version", detail: "Pin the graph, prompts, models, components, and deployment configuration." },
        { label: "Break", detail: "Exercise missing data, denied tools, timeouts, interruptions, and retries." },
        { label: "Review", detail: "Give a real owner enough evidence and authority to reject or revise." },
        { label: "Operate", detail: "Trace runs, evaluate changes, rotate credentials, and assign maintenance." },
      ],
    },
    sections: [
      {
        id: "artifact-versioning",
        title: "Treat the canvas as production code",
        answer: "A visual graph needs review, versioning, ownership, and rollback even when it contains little handwritten code.",
        paragraphs: [
          "Record the exported graph or declarative definition, component versions, model identifiers, prompts, knowledge sources, environment variables, and deployment target. A screenshot cannot reproduce behavior. If the platform supports drafts and published versions, define who can publish and how a previous version is restored.",
          "Custom code nodes and community components deserve the same scrutiny as a library dependency. Review source, pin versions where possible, document network and filesystem access, and test the effect of an upgrade in a separate environment. Visual placement does not make executable code safer.",
        ],
        bullets: ["Exportable or source-controlled definition", "Prompt and model version", "Component and plugin provenance", "Environment-specific configuration", "Rollback procedure and publisher role"],
      },
      {
        id: "state-recovery",
        title: "Prove what happens to state when a run stops",
        answer: "Long-running agent work is only reliable when interruption and resume behavior are explicit.",
        paragraphs: [
          "Test a process restart halfway through a run, a reviewer who responds the next day, an expired checkpoint, and a duplicate retry. Ask whether completed steps run again, whether tool side effects can repeat, and whether the current graph version can resume work started on an older version.",
          "Builders use different state models. Flowise documents per-execution Flow State and checkpoints for human input. Langflow uses stateful checkpoints for human gates. Dify exposes workflow variables, logs, and timeout branches. Read the exact semantics instead of treating every pause node as equivalent.",
        ],
        bullets: ["Interrupted run", "Delayed approval", "Duplicate delivery or retry", "Graph changed before resume", "Checkpoint expired or missing"],
      },
      {
        id: "tools-permissions",
        title: "Scope tools before improving prompts",
        answer: "A persuasive instruction cannot compensate for a credential that can do too much.",
        paragraphs: [
          "List every tool, credential, endpoint, and data source available to the workflow. Give each only the operation and data scope required by the job. Separate read, draft, publish, delete, payment, and administrative actions so high-impact operations can receive their own controls.",
          "Test denied access and malformed arguments. The workflow should expose a useful error, stop or route predictably, and avoid retrying an irreversible action blindly. Human approval inside the builder does not override authorization in the destination system.",
        ],
        bullets: ["Least-privilege credential", "Read and write operations separated", "Secrets excluded from logs and prompts", "Denied access handled explicitly", "Destination system enforces final authority"],
      },
      {
        id: "human-review",
        title: "Make review a decision, not a pause button",
        answer: "The reviewer needs the proposed action, evidence, uncertainty, alternatives, and authority to change the path.",
        paragraphs: [
          "Place the gate before the consequential transition, not after the tool has already acted. Show the draft or tool arguments in a readable format and include source links, affected systems, and known gaps. Let the reviewer reject, edit, request revision, or escalate where the workflow requires more than a binary click.",
          "Then test the social system. Route the request to the real role, leave it unanswered until timeout, reject it with feedback, and confirm that the next step uses that feedback. A technically correct checkpoint can still fail if no one owns the queue.",
        ],
        bullets: ["Gate placed before side effect", "Readable evidence packet", "Reject and revision path", "Named reviewer and escalation", "Timeout and abandoned-request handling"],
      },
      {
        id: "observe-evaluate-operate",
        title: "Connect traces, evaluation, and day-two ownership",
        answer: "A workflow is production-ready only when someone can diagnose it and verify a change.",
        paragraphs: [
          "Capture one trace that links input, retrieval, model calls, tools, branches, human decisions, timing, token usage, and errors. Tag the run with graph, prompt, model, and environment versions. Make sure sensitive values are redacted before the telemetry leaves the runtime.",
          "Create a small evaluation set from normal cases and the failures found during testing. Run it before publishing a new version and inspect regressions by failure type. Finally, assign an operator for alerts, stale knowledge, credential rotation, cost, reviewer backlog, and component upgrades. Without that owner, the canvas becomes abandoned infrastructure.",
        ],
        bullets: ["End-to-end trace with version metadata", "Sensitive-data policy", "Reviewed baseline dataset", "Pre-release regression run", "Named operator and maintenance cadence"],
      },
    ],
    sources: [
      { publisher: "Dify", label: "Human Input node", href: "https://docs.dify.ai/en/use-dify/nodes/human-input" },
      { publisher: "Flowise", label: "Agentflow V2", href: "https://docs.flowiseai.com/using-flowise/agentflowv2" },
      { publisher: "Langflow", label: "Human-in-the-Loop", href: "https://docs.langflow.org/next/human-in-the-loop" },
      { publisher: "n8n", label: "Human-in-the-loop tools", href: "https://docs.n8n.io/advanced-ai/human-in-the-loop-tools/" },
    ],
    faqs: [
      { q: "Can a visual AI agent workflow be production-ready?", a: "Yes, if its graph and dependencies are versioned, state and recovery are tested, tools are scoped, review is meaningful, traces are safe and useful, evaluation cases are repeatable, and an operator owns maintenance." },
      { q: "What is the most important failure test?", a: "Test an interruption around a consequential tool call or human gate. Verify whether state resumes correctly, side effects remain idempotent, evidence is preserved, and the reviewer can still change the outcome." },
      { q: "Do visual builders remove the need for engineering?", a: "They reduce some authoring work. Production systems still need access design, custom integrations, testing, deployment, monitoring, evaluation, incident handling, and lifecycle ownership." },
    ],
    related: [
      { label: "Best visual agent builders", href: "/best/visual-ai-agent-builders" },
      { label: "Compare Raltic and Flowise", href: "/compare/flowise" },
      { label: "How approval gates work", href: "/answers/how-do-ai-agent-approval-gates-work" },
    ],
  },
];

export const ROUND_TWO_ANSWER_PAGES: AnswerPage[] = [
  {
    slug: "what-is-an-ai-agent-builder",
    question: "What is an AI agent builder?",
    metaTitle: "What Is an AI Agent Builder?",
    metaDescription: "An AI agent builder is a visual or low-code environment for configuring models, tools, knowledge, state, workflow logic, tests, and deployment surfaces.",
    keywords: ["what is an AI agent builder", "visual AI agent builder definition", "low code agent builder"],
    shortAnswer: "An AI agent builder is a visual or low-code development environment for configuring an agent's models, instructions, tools, knowledge, state, routes, tests, and delivery surface. Builders reduce the amount of application code needed for common patterns, but the team still owns permissions, failure handling, evaluation, deployment, and ongoing operation.",
    visual: {
      eyebrow: "Builder output",
      title: "The canvas becomes an application only after execution, review, and delivery are designed.",
      mode: "stack",
      items: [
        { label: "Compose", detail: "Models, instructions, knowledge, tools, and components." },
        { label: "Control", detail: "Variables, branches, loops, state, and failure routes." },
        { label: "Review", detail: "Human input, tool approval, tests, traces, and evaluation." },
        { label: "Deliver", detail: "API, embedded interface, channel, permissions, and operation." },
      ],
    },
    sections: [
      { id: "builder-contains", title: "What does an agent builder usually contain?", answer: "Most builders combine a canvas, reusable components, test surface, and deployment path.", paragraphs: ["Common components include model calls, prompts, retrieval, tools, agents, conditions, loops, variables, input and output nodes, and connectors. More complete products add logs, traces, evaluations, human checkpoints, APIs, embedded chat, environments, and team controls."], bullets: ["Visual workflow canvas", "Model, knowledge, and tool configuration", "State and routing", "Testing and run inspection", "Publishing or API access"] },
      { id: "builder-framework", title: "How is a builder different from a framework?", answer: "A builder stores more of the application as configuration and visual structure; a framework expresses it primarily in code.", paragraphs: ["Dify, Flowise, Langflow, n8n, and Copilot Studio expose different visual models. OpenAI Agents SDK, Google ADK, Microsoft Agent Framework, and LangGraph give developers code primitives. Hybrid teams often use a builder for common paths and code for custom behavior."] },
      { id: "builder-limit", title: "What does the builder not solve automatically?", answer: "It does not choose the right permissions, quality bar, reviewer, or operating owner for you.", paragraphs: ["Before production, test missing inputs, denied tools, interrupted runs, approval timeout, duplicate retries, and graph upgrades. Version the artifact, define evaluation cases, and assign someone to maintain credentials, costs, traces, and stale knowledge."], bullets: ["Least privilege", "Recovery semantics", "Meaningful review", "Regression evaluation", "Named operator"] },
    ],
    faqs: [
      { q: "Is an AI agent builder no-code?", a: "Some common paths are no-code, but production workflows often need formulas, scripts, custom components, APIs, deployment work, and security review. Low-code is usually the more accurate description." },
      { q: "Is Raltic an AI agent builder?", a: "No. Raltic is a shared workflow room for people and existing local or cloud agents. It does not provide a general visual canvas for building an agent application." },
    ],
    related: [
      { label: "Best visual agent builders", href: "/best/visual-ai-agent-builders" },
      { label: "Builder production checklist", href: "/blog/visual-ai-agent-builder-production-checklist" },
      { label: "Compare Raltic and Dify", href: "/compare/dify" },
    ],
  },
  {
    slug: "what-is-an-ai-agent-sdk",
    question: "What is an AI agent SDK?",
    metaTitle: "What Is an AI Agent SDK?",
    metaDescription: "An AI agent SDK is a code library that provides agent loops, tools, state, handoffs, guardrails, tracing, and other primitives for custom agent applications.",
    keywords: ["what is an AI agent SDK", "agent SDK definition", "AI agent framework vs SDK"],
    shortAnswer: "An AI agent SDK is a code library that helps developers build agent applications with reusable primitives such as agents, model clients, tools, run loops, state, sessions, handoffs, guardrails, tracing, and human interruptions. The SDK accelerates application logic; it does not automatically provide the finished user interface, business workflow, deployment, or operating team.",
    visual: {
      eyebrow: "SDK responsibility map",
      title: "The SDK supplies runtime primitives; the product team supplies the surrounding application.",
      mode: "stack",
      items: [
        { label: "Define", detail: "Agent instructions, models, tools, output schemas, and guardrails." },
        { label: "Coordinate", detail: "Loops, handoffs, graphs, state, sessions, and interruptions." },
        { label: "Inspect", detail: "Events, traces, usage, errors, and application-specific eval hooks." },
        { label: "Productize", detail: "Authentication, UI, permissions, deployment, alerts, and ownership." },
      ],
    },
    sections: [
      { id: "sdk-primitives", title: "What primitives do agent SDKs provide?", answer: "The common core is an agent definition, a run loop, tools, state, and extension points.", paragraphs: ["OpenAI Agents SDK emphasizes agents, tools, handoffs, guardrails, sessions, tracing, and human approval. Google ADK and Microsoft Agent Framework add broader graph, multi-agent, deployment, and evaluation patterns. Exact capabilities and language support change, so compare the current release rather than the category label."], bullets: ["Agent and model configuration", "Tools and structured inputs", "State, sessions, or checkpoints", "Handoffs or workflow control", "Tracing and evaluation hooks"] },
      { id: "sdk-vs-api", title: "How is an SDK different from a model API?", answer: "A model API returns model responses; an agent SDK manages more of the loop around those calls.", paragraphs: ["Developers can call a model API directly and own tool dispatch, retries, context, state, and stopping conditions. An SDK packages common patterns so the team writes less orchestration code and follows a consistent runtime model."] },
      { id: "sdk-vs-platform", title: "How is an SDK different from a platform?", answer: "A platform usually supplies more runtime, deployment, observability, governance, or user-facing workflow.", paragraphs: ["The boundary is not absolute. Some vendors offer an SDK plus hosted runtime and evaluation services. Ask what the team must still build, deploy, monitor, secure, and explain to users after adopting the SDK."], bullets: ["Application UI", "Authentication and authorization", "Durable hosting", "Business review process", "Operational support"] },
    ],
    faqs: [
      { q: "Which AI agent SDK is best?", a: "Choose by language, model and provider needs, orchestration style, state model, tracing, evaluation, deployment target, and how much surrounding infrastructure the team will own." },
      { q: "Does Raltic provide an agent SDK?", a: "Raltic provides product and internal agent-tool surfaces, but its main user value is a shared workflow room. It should not be evaluated as a general replacement for OpenAI Agents SDK, Google ADK, or Microsoft Agent Framework." },
    ],
    related: [
      { label: "AI agent stack layers", href: "/blog/ai-agent-stack-layers" },
      { label: "Compare OpenAI Agents SDK", href: "/compare/openai-agents-sdk" },
      { label: "Framework vs platform", href: "/answers/what-is-the-difference-between-an-agent-framework-and-platform" },
    ],
  },
  {
    slug: "what-is-ai-agent-observability",
    question: "What is AI agent observability?",
    metaTitle: "What Is AI Agent Observability?",
    metaDescription: "AI agent observability captures and connects model calls, retrieval, tools, handoffs, state, latency, cost, errors, and outcomes so teams can explain a run.",
    keywords: ["what is AI agent observability", "agent observability definition", "AI agent tracing"],
    shortAnswer: "AI agent observability is the ability to reconstruct and analyze what happened during an agent run across model calls, retrieval, tools, handoffs, state changes, latency, cost, errors, and final outcomes. It depends on structured traces and metadata, not only application logs. Evaluation adds quality judgments to that observed behavior.",
    visual: {
      eyebrow: "Observable run",
      title: "A useful trace connects the request to the final outcome without losing causal order.",
      mode: "loop",
      items: [
        { label: "Request", detail: "User intent, version, environment, session, and allowed context." },
        { label: "Trajectory", detail: "Retrieval, model calls, tools, agents, branches, and state changes." },
        { label: "Outcome", detail: "Output, side effects, errors, latency, cost, and completion status." },
        { label: "Learning", detail: "Feedback, evaluation scores, failure labels, and regression cases." },
      ],
    },
    sections: [
      { id: "observe", title: "What should an agent trace capture?", answer: "Capture the causal path through the system with enough context to explain each consequential step.", paragraphs: ["A trace commonly includes model inputs and outputs, retrieval results, tool names and arguments, handoffs, guardrails, timing, token or cost data, errors, and version metadata. Sensitive inputs may need redaction or exclusion."], bullets: ["Trace and span identifiers", "Agent, model, prompt, and release version", "Tool and retrieval events", "Latency, cost, and errors", "Final output and side effects"] },
      { id: "evaluation", title: "How is observability different from evaluation?", answer: "Observability records behavior; evaluation scores behavior against a criterion.", paragraphs: ["A trace can show that the agent called a refund tool. An evaluation can judge whether that tool was appropriate, whether its arguments matched policy, and whether the final response was correct. Most quality programs need both."] },
      { id: "workflow-evidence", title: "Is room history the same as technical observability?", answer: "No. Human-readable workflow evidence and technical traces answer different questions.", paragraphs: ["A workflow room can show the brief, posted findings, reviewer feedback, tasks, and accepted decision. Engineers still need application traces for intermediate model calls, tool errors, latency, token cost, and runtime state."], bullets: ["Technical trace: how the run executed", "Evaluation: whether behavior met a criterion", "Workflow record: what the team reviewed and accepted"] },
    ],
    faqs: [
      { q: "Are logs enough for AI agent observability?", a: "Usually not. Structured traces preserve parent-child relationships and causal order across model, retrieval, tool, and agent steps, while plain logs often require manual reconstruction." },
      { q: "Is Raltic an agent tracing platform?", a: "No. Raltic exposes team-level run status and posted evidence in workflow context. Pair it with framework or observability telemetry when step-level traces, latency, cost, and automated evaluation are required." },
    ],
    related: [
      { label: "Observability and eval tools", href: "/best/ai-agent-observability-evaluation-tools" },
      { label: "Evaluation scorecard", href: "/blog/ai-agent-evaluation-scorecard" },
      { label: "Raltic run observability", href: "/features/agent-run-observability" },
    ],
  },
  {
    slug: "what-is-an-ai-agent-evaluation",
    question: "What is an AI agent evaluation?",
    metaTitle: "What Is an AI Agent Evaluation?",
    metaDescription: "An AI agent evaluation measures final outcomes and the trajectory behind them, including evidence, tool choice, arguments, policy, efficiency, and review effort.",
    keywords: ["what is an AI agent evaluation", "agent eval definition", "AI agent testing"],
    shortAnswer: "An AI agent evaluation measures whether an agent completed a task well and whether its path was acceptable. It can score the final output, evidence, tool choice and arguments, intermediate trajectory, policy compliance, latency, cost, and human correction. Reliable evaluation uses reviewed cases, explicit criteria, repeatable runs, and more than one evaluator type.",
    visual: {
      eyebrow: "Evaluation anatomy",
      title: "A repeatable evaluation ties one task to a versioned run and an explicit judgment.",
      mode: "loop",
      items: [
        { label: "Case", detail: "Input, context, constraints, expected behavior, and metadata." },
        { label: "Run", detail: "Versioned agent execution with outputs and intermediate steps." },
        { label: "Score", detail: "Code checks, rubrics, model judges, or human labels." },
        { label: "Compare", detail: "Baseline and candidate results on the same cases and criteria." },
      ],
    },
    sections: [
      { id: "evaluate-what", title: "What should an agent evaluation measure?", answer: "Measure the result and the trajectory whenever the path affects safety, cost, or correctness.", paragraphs: ["A good final answer can still come from the wrong source or an unauthorized tool. Conversely, a correct route can fail because a dependency was unavailable. Keep outcome, evidence, tools, trajectory, policy, efficiency, and human correction visible as separate dimensions."], bullets: ["Task outcome", "Evidence quality", "Tool use and arguments", "Trajectory and handoffs", "Policy, latency, cost, and correction"] },
      { id: "evaluator-types", title: "What types of evaluator are used?", answer: "Use deterministic code, model-based judges, pairwise comparisons, and human reviewers for different criteria.", paragraphs: ["Code works for schemas, required fields, exact tools, and hard policy. Model judges help with documented qualitative rubrics. Humans remain important for domain judgment, policy interpretation, and calibrating automated scores."] },
      { id: "evaluation-loop", title: "How does evaluation improve a production agent?", answer: "Known and newly discovered failures become versioned regression cases.", paragraphs: ["Run candidate changes against the same offline dataset before release. After deployment, sample traces and corrections, label failures, and promote representative cases back into the dataset. This joins pre-release testing with production learning."], bullets: ["Curate cases", "Run a baseline", "Compare a candidate", "Monitor production", "Add failures to regression"] },
    ],
    faqs: [
      { q: "Is agent evaluation the same as unit testing?", a: "It includes deterministic tests but also handles probabilistic outputs, tool trajectories, qualitative rubrics, and human judgment. The result may be a score or label rather than a single exact assertion." },
      { q: "Can one evaluation score prove an agent is safe?", a: "No. Safety depends on permissions, tool design, policy, context, deployment, and ongoing monitoring. Keep high-impact requirements as explicit gates rather than hiding them in an average." },
    ],
    related: [
      { label: "Agent evaluation scorecard", href: "/blog/ai-agent-evaluation-scorecard" },
      { label: "Observability and eval tools", href: "/best/ai-agent-observability-evaluation-tools" },
      { label: "What is agent observability?", href: "/answers/what-is-ai-agent-observability" },
    ],
  },
  {
    slug: "what-is-multi-agent-orchestration",
    question: "What is multi-agent orchestration?",
    metaTitle: "What Is Multi-Agent Orchestration?",
    metaDescription: "Multi-agent orchestration controls which agents run, how they share context and state, when they hand off, how failures recover, and where humans intervene.",
    keywords: ["what is multi agent orchestration", "multi agent orchestration definition", "AI agent coordination"],
    shortAnswer: "Multi-agent orchestration coordinates which specialist agents run, in what order or in parallel, what context and tools each receives, how state and outputs move between them, when control is handed off, how failures recover, and where a human intervenes. It can be model-directed, code-directed, or a hybrid of both.",
    visual: {
      eyebrow: "Orchestration path",
      title: "Specialization helps only when task state and ownership survive every handoff.",
      mode: "loop",
      items: [
        { label: "Route", detail: "Choose a specialist by code, model decision, or explicit graph." },
        { label: "Context", detail: "Transfer the task, sources, constraints, state, and expected output." },
        { label: "Coordinate", detail: "Run sequentially, concurrently, through handoff, or under a manager." },
        { label: "Resolve", detail: "Merge results, recover failures, escalate uncertainty, and review." },
      ],
    },
    sections: [
      { id: "patterns", title: "What are common multi-agent patterns?", answer: "Common patterns include manager-and-specialists, handoffs, sequential pipelines, parallel fan-out, review loops, and group collaboration.", paragraphs: ["OpenAI Agents SDK distinguishes agents-as-tools from handoffs. Microsoft Agent Framework documents sequential, concurrent, handoff, group, and manager-led patterns. The best pattern depends on whether the model or code should decide the next step."], bullets: ["Manager calls specialists", "Triage handoff", "Sequential pipeline", "Parallel investigation", "Generator and reviewer loop"] },
      { id: "state", title: "What must an orchestration layer preserve?", answer: "It must preserve task state, context boundaries, outputs, ownership, and recovery information.", paragraphs: ["Passing an entire transcript can be expensive and unsafe; passing too little causes repeated work and lost constraints. Define the handoff packet and who owns the final result before adding more agents."] },
      { id: "when", title: "When should a team use multiple agents?", answer: "Use multiple agents for clear specialization, independent critique, parallel evidence gathering, or incompatible runtime needs.", paragraphs: ["Do not create several personas for a task one agent can complete reliably. Every additional agent adds routing, context, latency, cost, failure, evaluation, and ownership work."], bullets: ["Specialist capability", "Independent check", "Parallel speed", "Runtime or permission boundary", "Measured improvement over one agent"] },
    ],
    faqs: [
      { q: "Does multi-agent orchestration require a graph?", a: "No. Code can call agents sequentially or in parallel, a manager agent can invoke specialists as tools, or agents can hand control to one another. Graphs are useful when the path and recovery rules should be explicit." },
      { q: "Is more agents always better?", a: "No. Multiple agents increase coordination cost and failure surface. Add one only when specialization, independent review, parallel work, or a runtime boundary produces measurable value." },
    ],
    related: [
      { label: "Multi-agent workflow patterns", href: "/blog/multi-agent-workflow-patterns" },
      { label: "Compare Microsoft Agent Framework", href: "/compare/microsoft-agent-framework" },
      { label: "Tasks and handoffs", href: "/features/tasks-and-handoffs" },
    ],
  },
  {
    slug: "what-is-an-ai-agent-control-plane",
    question: "What is an AI agent control plane?",
    metaTitle: "What Is an AI Agent Control Plane?",
    metaDescription: "An AI agent control plane manages identities, policies, routing, deployment, sessions, telemetry, evaluation, budgets, and lifecycle across many agent runtimes.",
    keywords: ["what is an AI agent control plane", "agent control plane definition", "AI agent governance platform"],
    shortAnswer: "An AI agent control plane is the management layer used to register, configure, route, secure, observe, evaluate, and govern many agents or runtimes. It commonly manages agent identities, policies, deployment versions, sessions, gateways, telemetry, budgets, and lifecycle. The data plane performs the actual model and tool work; the control plane manages how that work is allowed and operated.",
    visual: {
      eyebrow: "Control-plane boundary",
      title: "The control plane governs a fleet; it does not automatically supply the business workflow each agent serves.",
      mode: "stack",
      items: [
        { label: "Register", detail: "Agent identity, owner, version, model, tools, and deployment." },
        { label: "Govern", detail: "Policies, grants, gateways, budgets, environment, and risk tier." },
        { label: "Observe", detail: "Health, traces, cost, quality, incidents, and fleet inventory." },
        { label: "Operate", detail: "Release, rollback, disable, rotate, migrate, and retire agents." },
      ],
    },
    sections: [
      { id: "responsibilities", title: "What does an agent control plane manage?", answer: "It centralizes fleet-level configuration and governance that individual runtimes should not each reinvent.", paragraphs: ["Typical responsibilities include registry and ownership, identity, model and tool policy, deployment versions, sessions or memory configuration, gateways, telemetry, evaluation status, cost limits, and lifecycle actions."], bullets: ["Registry and identity", "Policy and permissions", "Deployment and routing", "Telemetry and evaluation", "Budget and lifecycle"] },
      { id: "data-plane", title: "How is the control plane different from the data plane?", answer: "The control plane configures and governs; the data plane executes model calls, retrieval, tools, and agent work.", paragraphs: ["Separating the layers can reduce duplicated policy and improve fleet visibility. It also introduces a critical dependency, so availability, tenancy, audit, and regional data paths need explicit design."] },
      { id: "need", title: "When does a team need a control plane?", answer: "It becomes useful when many agents, teams, environments, and policies create coordination cost that local configuration cannot manage safely.", paragraphs: ["A small team with one bounded workflow may not need a fleet platform. Start with the operating problem, then add a control plane when identity, policy, release, telemetry, or inventory must be consistent across many runtimes."], bullets: ["Many agent deployments", "Shared policy requirements", "Multiple teams or tenants", "Central cost and quality reporting", "Lifecycle and incident control"] },
    ],
    faqs: [
      { q: "Is an AI agent control plane the same as orchestration?", a: "No. Orchestration controls the flow of work within or across runs. A control plane manages fleet-level identity, policy, deployment, telemetry, and lifecycle, though one platform may provide both." },
      { q: "Is Raltic an enterprise agent control plane?", a: "No. Raltic provides shared workflow rooms and agent participation for team operations. It does not claim to replace enterprise fleet identity, gateway, policy, deployment, or governance infrastructure." },
    ],
    related: [
      { label: "AI agent stack layers", href: "/blog/ai-agent-stack-layers" },
      { label: "Gemini Agent Platform comparison", href: "/compare/gemini-enterprise-agent-platform" },
      { label: "What is orchestration?", href: "/answers/what-is-an-ai-agent-orchestration-platform" },
    ],
  },
];
