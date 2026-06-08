export type WorkflowStarterKey = "customer-risk" | "launch-readiness" | "code-review";

export interface WorkflowStarterTemplate {
  key: WorkflowStarterKey;
  title: string;
  channelName: string;
  description: string;
  brief: string;
  agent: string;
  gate: string;
  output: string;
  type: "public" | "private";
  requiresLocalRuntime?: boolean;
  draftFocus: string;
  draftNeed: string;
  draftContext: string;
}

export const WORKFLOW_STARTERS: WorkflowStarterTemplate[] = [
  {
    key: "customer-risk",
    title: "Customer-risk brief",
    channelName: "customer-risk",
    description: "Workflow room for renewal risk briefs, call notes, support context, and follow-up tasks.",
    brief: "Bring call notes and support context before the next account call.",
    agent: "Start with the onboarding agent for the first brief; add research or ops specialists when this becomes recurring.",
    gate: "Human approves anything customer-facing before it leaves the room.",
    output: "Risk brief, follow-up tasks, reusable account memory.",
    type: "private",
    draftFocus: "Prepare a renewal-risk brief before the next account call.",
    draftNeed: "A short risk summary, unknowns, follow-up tasks, and the approval decision needed from me.",
    draftContext: "Paste call notes, support issues, account context, or competitor notes here.",
  },
  {
    key: "launch-readiness",
    title: "Launch readiness",
    channelName: "launch-readiness",
    description: "Workflow room for launch proof, docs, support risk, approval, and owner handoff.",
    brief: "Drop the launch brief, open docs, and the decision you need by Friday.",
    agent: "Start with the onboarding agent to structure the launch checklist; add reviewer and writer agents when they exist.",
    gate: "Human blocks public send until support and docs are ready.",
    output: "Decision log, checklist, owner map.",
    type: "public",
    draftFocus: "Turn this launch into a visible readiness workflow.",
    draftNeed: "A launch checklist, proof gaps, owner map, support risks, and the approval boundary before anything public ships.",
    draftContext: "Paste the launch brief, docs links, target date, and current blockers here.",
  },
  {
    key: "code-review",
    title: "Local code review",
    channelName: "code-review",
    description: "Workflow room for PR review where local runtimes can inspect code while the team sees outcomes.",
    brief: "Use this when a workflow touches repo context, tests, or local tools.",
    agent: "Create the room first; connect a local runtime before asking an agent to inspect repo context.",
    gate: "Human accepts only actionable review items.",
    output: "Review comments, task links, searchable run record.",
    type: "private",
    requiresLocalRuntime: true,
    draftFocus: "Review a local-code change without uploading repo context into a hosted AI tool.",
    draftNeed: "Actionable findings only: correctness risks, missing tests, regression paths, and recommended fixes.",
    draftContext: "After connecting a local runtime, paste the PR link, branch, failing tests, or review scope here.",
  },
];

export function getWorkflowStarter(key: string | null): WorkflowStarterTemplate | null {
  if (!key) return null;
  return WORKFLOW_STARTERS.find((starter) => starter.key === key) ?? null;
}

export function buildWorkflowStarterDraft(
  starter: WorkflowStarterTemplate,
  agentSlug?: string | null,
): string {
  const mention = agentSlug ? `@${agentSlug} ` : "";
  return `${mention}Start this workflow.

Focus:
${starter.draftFocus}

What I need:
${starter.draftNeed}

Context:
${starter.draftContext}

Approval boundary:
${starter.gate}`;
}
