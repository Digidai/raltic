export type EditorialConnection = {
  label: string;
  href: string;
  description: string;
};

const CONNECTIONS: Record<string, EditorialConnection[]> = {
  "what-is-an-agent-workflow": [
    { label: "See the workflow-room model", href: "/features/workflow-rooms", description: "Move from the definition to the product surface that keeps the brief, work, review, and decision together." },
    { label: "Compare orchestration platforms by job", href: "/best/ai-agent-orchestration-platforms", description: "Use the buyer's guide when you need to decide between a framework, automation builder, cloud platform, or shared operating room." },
    { label: "Start with a workflow template", href: "/workflows", description: "Pick a bounded process with a named owner and a visible first proof." },
    { label: "Get the short answer", href: "/answers/what-is-an-ai-workflow-room", description: "Use the direct definition when you need a concise explanation of the room itself." },
  ],
  "human-in-the-loop-ai-workflows": [
    { label: "Inspect Raltic's review boundary", href: "/features/human-review", description: "See what the product records and what still depends on destination-system permissions." },
    { label: "Shortlist human-review platforms", href: "/best/human-in-the-loop-ai-platforms", description: "Compare review models without treating every approval button as the same control." },
    { label: "Read how approval gates work", href: "/answers/how-do-ai-agent-approval-gates-work", description: "A concise explanation of what pauses, what a reviewer sees, and what happens next." },
    { label: "Design an approval workflow", href: "/blog/ai-agent-approval-workflow", description: "Turn risk and reversibility into concrete review points." },
  ],
  "ai-agent-orchestration-guide": [
    { label: "Compare Raltic and LangGraph", href: "/compare/langgraph", description: "Separate a low-level orchestration runtime from a shared room for people and runtime agents." },
    { label: "Compare Raltic and CrewAI", href: "/compare/crewai", description: "See where code-defined crews and flows differ from team-visible workflow operations." },
    { label: "Browse the 2026 orchestration shortlist", href: "/best/ai-agent-orchestration-platforms", description: "Choose by build surface, runtime model, review needs, and implementation lift." },
    { label: "Define the platform category", href: "/answers/what-is-an-ai-agent-orchestration-platform", description: "Use the answer page for a concise, citation-ready definition." },
  ],
  "local-vs-cloud-ai-agents": [
    { label: "See the local bridge", href: "/features/local-agent-bridge", description: "Understand what runs on the local machine and what Raltic receives." },
    { label: "See managed cloud agents", href: "/features/cloud-agents", description: "Use the cloud path when the first workflow does not need a private repository or desktop-only toolchain." },
    { label: "Compare Raltic with Cursor", href: "/compare/cursor", description: "Separate editor-native coding help from the team workflow around agent output." },
    { label: "Clarify the bridge boundary", href: "/answers/what-is-a-bridge-runtime", description: "Get the short definition of a bridge runtime and its data path." },
  ],
  "ai-agent-approval-workflow": [
    { label: "Use the human-review feature", href: "/features/human-review", description: "Make proposal, evidence, task state, and reviewer feedback visible in one room." },
    { label: "Compare human-review platforms", href: "/best/human-in-the-loop-ai-platforms", description: "Find the product type that matches your actual review boundary." },
    { label: "Compare Raltic and Copilot Studio", href: "/compare/microsoft-copilot-studio", description: "Review the difference between low-code agent flows and shared multi-runtime work." },
    { label: "Answer: when is approval needed?", href: "/answers/when-should-ai-agents-require-human-approval", description: "Use impact, reversibility, uncertainty, and authority to place the gate." },
  ],
  "ai-agent-observability": [
    { label: "See run evidence in Raltic", href: "/features/agent-run-observability", description: "Inspect the run state, posted evidence, tasks, and human decision in context." },
    { label: "Define an agent audit trail", href: "/answers/what-should-an-ai-agent-audit-trail-include", description: "Use the direct checklist for runs, tools, evidence, review, and outcomes." },
    { label: "Compare Raltic and LangGraph", href: "/compare/langgraph", description: "Choose between application-level traces and the shared operating record around agent work." },
    { label: "Evaluate platforms before buying", href: "/blog/how-to-evaluate-ai-agent-platforms", description: "Test failure recovery and reviewability with a real workflow, not a scripted demo." },
  ],
  "multi-agent-workflow-patterns": [
    { label: "See tasks and handoffs", href: "/features/tasks-and-handoffs", description: "Keep ownership and review state attached to the evidence that created the work." },
    { label: "Compare Raltic and CrewAI", href: "/compare/crewai", description: "Contrast code-defined agent teams with a shared workspace for agents and people." },
    { label: "Browse agent workflow platforms", href: "/best/ai-agent-workflow-platforms", description: "Shortlist products by implementation model and the kind of collaboration they support." },
    { label: "Answer: how do handoffs work?", href: "/answers/how-do-ai-agents-hand-off-tasks", description: "A good handoff transfers task state, evidence, constraints, and ownership." },
  ],
  "ai-agent-workflow-examples-product-teams": [
    { label: "Raltic for product teams", href: "/built-for/product-teams", description: "Connect the examples to a first-value path for product discovery and launch decisions." },
    { label: "Start a launch-readiness room", href: "/workflows/launch-readiness", description: "Turn one example into a concrete brief, evidence packet, and go or no-go decision." },
    { label: "Use the workflow-room feature", href: "/features/workflow-rooms", description: "Keep agent contributions, open tasks, and the product decision in the same record." },
    { label: "Compare workflow platforms", href: "/best/ai-agent-workflow-platforms", description: "See which products fit collaboration, automation, framework, and suite-native jobs." },
  ],
  "how-to-evaluate-ai-agent-platforms": [
    { label: "Open the orchestration shortlist", href: "/best/ai-agent-orchestration-platforms", description: "Apply the evaluation criteria to current frameworks, cloud platforms, automation tools, and Raltic." },
    { label: "Compare every Raltic alternative", href: "/compare", description: "Use first-party-sourced, one-to-one comparisons for the products on your shortlist." },
    { label: "Check Raltic's current boundaries", href: "/security", description: "Verify data, runtime, connector, and review claims before starting a trial." },
    { label: "Answer: how should platforms be compared?", href: "/answers/how-do-you-compare-ai-agent-platforms", description: "Use the concise seven-dimension comparison method." },
  ],
  "build-vs-buy-ai-agent-orchestration": [
    { label: "Compare Raltic and LangGraph", href: "/compare/langgraph", description: "See the practical difference between building an orchestration runtime and adopting a shared operating surface." },
    { label: "Compare Raltic and Gemini Agent Platform", href: "/compare/gemini-enterprise-agent-platform", description: "Contrast a full cloud lifecycle platform with a narrower workflow-room product." },
    { label: "Browse orchestration platforms", href: "/best/ai-agent-orchestration-platforms", description: "Choose the layer you need before choosing a vendor." },
    { label: "Start with one bounded workflow", href: "/workflows", description: "A real workflow trial exposes integration, review, and recovery costs faster than a feature checklist." },
  ],
};

export function getEditorialConnections(slug: string): EditorialConnection[] {
  return CONNECTIONS[slug] ?? [];
}
