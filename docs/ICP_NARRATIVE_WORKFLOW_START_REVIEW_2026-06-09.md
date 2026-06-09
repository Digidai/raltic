# Raltic ICP Narrative And Workflow Start Review

Date: 2026-06-09

## Decision

Raltic should target AI-native execution teams, not generic engineering teams and not generic chat users.

The current primary ICP is:

> 5-50 person founder-led teams that already use agents for real work, but need a shared place to brief, observe, approve, and reuse agent work across business workflows.

Engineering remains a strong beachhead because local code, provider keys, and runtime boundaries are concrete. It is not the whole ICP. The sharper behavior is that the team is already turning agent experiments into repeatable operating workflows.

## External Review

Reviewed current official/product sources on 2026-06-09:

- Helio positions itself as an AI-native workforce where AI colleagues work in channels, own tasks, handle coding sessions, and route approvals. It is broad and teammate/persona-first: https://www.helio.im/
- OpenAI Workspace Agents explicitly focus on repeatable tasks and workflows, Slack channel use, schedules, tools, connector constraints, and write-action approvals: https://help.openai.com/en/articles/20001143-chatgpt-workspace-agents-for-enterprise-and-business
- Slack/Agentforce frames agents as teammates in channels, DMs, and threads that can take actions in the flow of work: https://slack.com/ai-agents
- Microsoft Work Trend Index 2026 identifies advanced AI users as people using agents for multi-step workflows, multi-agent systems, workflow redesign, and shared AI standards: https://www.microsoft.com/en-us/worklab/work-trend-index/agents-human-agency-and-the-opportunity-for-every-organization
- Asana AI Studio is workflow-first: AI is embedded into business processes with full work context rather than used as a disconnected tool: https://asana.com/product/ai/ai-studio
- Atlassian Rovo Studio is also workflow/system-of-work oriented: build agents, automations, and apps grounded in Teamwork Graph context: https://www.atlassian.com/software/rovo/studio

Cross-check: the market is converging on agent workflows, handoffs, approvals, and governance. A small Raltic team should not try to out-platform OpenAI, Slack, Asana, or Atlassian. Raltic should make first value faster by helping users select one workflow outcome and prove it in a room.

## Product Implication

The first authenticated screen must answer:

1. What business outcome should I start with?
2. What will the agent produce first?
3. Where does human approval happen?
4. When do I need cloud vs local runtime?

The previous Start page showed starter cards, but the decision burden was still on the user. The improved Start page should guide users by outcome first, then create the workflow room only when they choose to start.

## Scope For This Pass

Implemented:

- Add a Start-page outcome picker.
- Add a new research-synthesis starter for founder/product/GTM research workflows.
- Add `bestFor` and `firstProof` to every starter so users know who should pick it and what to verify after the first run.
- Let the primary Start CTA follow the selected starter instead of always defaulting to launch readiness.
- Align marketing use cases and onboarding seed copy with the four starter set.
- Add a product event for starter selection before room creation.

Deliberately not implemented:

- No workflow builder.
- No schedules.
- No autonomous external actions.
- No schema change.
- No connector-triggered workflow automation.

Those features need explicit run semantics, idempotency, approval policies, and audit guarantees before shipping.

## Review Standard

This pass is valid only if tests prove:

- Start page copy matches workflow-first ICP.
- The outcome picker is visible and accessible.
- Selecting a different outcome changes the primary starter action.
- Local runtime-gated starters still open setup instead of creating a room.
- Marketing funnel event allowlist accepts the new selection event.
- Production verification uses authenticated workspace checks before claiming live success.
