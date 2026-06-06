# Multica to Raltic: Agent Run Layer Review

Date: 2026-06-05
Status: Module 1-11 implementation review + Agent Team hardening + final bridge-scope fixes

## Research Verdict

Multica's strongest transferable idea is not its issue-tracker shape. It is the execution control plane behind the issue tracker: every agent job has a durable lifecycle, an owning runtime, a trigger, a result, retries/failures, and an operator-facing audit trail.

Raltic should keep its own product shape: AI-native workflow rooms where humans and agents coordinate in channels. The missing foundation is that a room message can trigger real work, but Raltic currently has no durable run object that proves what happened after dispatch.

## What We Copy

- A first-class run ledger with statuses beyond chat message delivery.
- Trigger provenance: source, channel, agent, caller, and triggering message.
- Result provenance: output message id, completion timestamp, and error.
- Read APIs scoped by existing channel/workspace policy.
- Lifecycle hooks in dispatch and cloud agent execution paths.

## What We Do Not Copy Yet

- A full Linear/Jira-style issue model.
- Multica squads, autopilots, and runtime deletion cascades as one large migration.
- PostgreSQL queue semantics such as `FOR UPDATE SKIP LOCKED`; Raltic's current cloud agent path is Durable Object RPC, not a daemon polling queue.
- Multica's daemon-polling task queue semantics for Raltic bridge agents. Bridge agents already receive channel messages through WebSocket, so run tracking should remain event-driven over the existing bridge path.

## Module 1 Acceptance

1. Raltic has an `agent_runs` table with channel, workspace, agent, trigger, status, timing, output, error, and metadata fields.
2. Shared protocol exports run statuses, sources, list query validation, and response shape.
3. API exposes read-only run listing/detail routes through existing `policy` checks.
4. Cloud agent dispatch from REST and ChatRoom WebSocket creates a run before invoking the agent.
5. `RalticAgent` marks the run `running`, then `completed` or `failed`, and records the output message id when available.
6. Scheduled cloud-agent invocations create and update a run even when no external dispatcher provided one.
7. Tests prove policy scoping and lifecycle transitions for the new API/agent hooks.

## Module 2 Acceptance

1. Bridge runtimes can create run rows through a narrow write API that only accepts bridge tokens.
2. Bridge run creation requires the requested agent to be a member of the requested channel, not merely another bound agent in that channel.
3. Local bridge execution marks runs `queued` before dispatch, `running` when the runtime receives the turn, and `completed` on the runtime's terminal `turn_complete` event.
4. Runtime unavailable, spawn/send failure, process exit, shutdown, and queued-message disposal mark the affected run as `failed` with a bounded error string.
5. Runtime activity errors only fail a run when the runtime marks the error as terminal; non-terminal tool/item errors remain transient activity.
6. Bridge channel triggers use `source=channel_message`; DMs use `source=dm`. This avoids pretending every bridge-triggered channel run came from an @-mention.
7. Run write APIs are not exposed as a generic user/manual launch feature yet. That belongs with a deliberate workflow/playbook UX, not a hidden API.

## Module 3 Acceptance

1. The agent profile has a `Runs` tab, because run evidence belongs next to the agent a team is evaluating, not in a detached issue-tracker clone.
2. The web API client exposes typed `listAgentRuns` query support for server, channel, agent, task, status, source, and limit filters.
3. The Runs tab shows the recent execution count, active count, completed count, failed count, status, source, runtime mode, created time, duration, input preview, and bounded error text.
4. Channel and DM runs route back to the relevant workspace surface with distinct `Open channel` and `Open DM` actions.
5. The tab lazy-loads once per agent and supports explicit refresh. Agent switching invalidates stale run requests so a late response from agent A cannot overwrite agent B's page.
6. The five-tab navigation remains responsive on a 390px viewport without horizontal overflow.
7. The UI stays audit/diagnostic focused. It does not add workflow launch, retry, reassignment, or Linear-style task operations before those surfaces have a real product model.

## Module 4 Acceptance

1. The five-minute API cron now runs an agent-run sweeper independently from Vectorize backfill, so indexing failures cannot block execution-ledger hygiene.
2. The sweeper only touches active statuses: `queued`, `dispatched`, `running`, and `waiting_input`.
3. The stale threshold is conservative: 24 hours without a lifecycle update. This avoids killing legitimate long bridge work or future team-plan cloud work while still preventing permanent false-running records.
4. Stale runs are marked `failed`, get `completedAt` and `updatedAt`, and receive a bounded operator-readable error explaining the scheduled sweeper action.
5. The sweeper logs count, cutoff, oldest updated timestamp, and per-status counts for Workers Logs / Sentry triage.
6. Tests prove stale active runs fail while fresh running runs and old completed runs are not touched.
7. The module intentionally does not add automatic retry. Retry needs idempotent workflow/playbook semantics; blindly retrying agent work can duplicate edits, messages, or external side effects.

## Module 5 Acceptance

1. Agent runs now automatically link to `task_id` when their triggering message is a Raltic task message.
2. The linkage applies across cloud REST dispatch, ChatRoom DO dispatch, RalticAgent fallback run creation, and bridge-created runs.
3. The bridge write API does not accept caller-supplied `taskId`; the API derives it from `triggerMessageId + channelId`. This prevents a bridge from falsely attaching a run to an unrelated task.
4. The Runs tab exposes linked task evidence with a compact task id and a route back to the workspace task board.
5. Tests prove bridge-created runs and cloud dispatch runs inherit the task id from the triggering task message.
6. This copies Multica's task/run provenance value, not its issue-tracker form. Raltic keeps tasks as chat-native work messages and treats runs as execution evidence attached to those messages.

## Module 6 Acceptance

1. `GET /api/v1/tasks` now returns a `latestRun` evidence summary for each visible task without adding a second task model.
2. The summary is derived from `agent_runs.task_id` after the existing task visibility query runs, so hidden-channel tasks and their runs are not exposed.
3. The task board shows recent agent execution state directly on task cards: status, source, runtime mode, update time, failure summary, and a route back to the owning agent.
4. Agent-assigned tasks with no run show a compact `Not started` state. This is important for GTM: the buyer can see not just completed automation, but gaps where an assigned agent has not actually picked up work.
5. The UI remains evidence-first. It does not add retry, launch, dependency, approval, or playbook controls before Raltic has idempotent workflow semantics and a clear user-facing launch model.
6. API tests prove the newest run is selected and that hidden-channel task runs do not leak through the task list.
7. Browser verification used a mocked authenticated local workspace and validated desktop plus 390px mobile layouts with no horizontal overflow.

## Module 7 Acceptance

1. The task board Quick add flow can now assign a new task to an agent owner at creation time.
2. The UI uses the existing `createTask` API fields (`assigneeId`, `assigneeType=agent`) rather than creating a parallel workflow-launch API.
3. Optimistic task insertion preserves the chosen agent owner and sets `latestRun=null`, so the card immediately shows the owner plus `Not started`.
4. This is intentionally assignment, not launch. Raltic's current task contract says agents claim/handle tasks in context; automatic run launch needs a future idempotent playbook/approval model.
5. Browser verification proved desktop and 390px mobile layouts do not overflow, and confirmed the POST body carries the chosen agent assignment.

## Module 8 Acceptance

1. The agent profile's Tasks tab now shows the same latest-run evidence the task board uses: run status, source, runtime mode, and bounded failure text.
2. Tasks without a run show `Not started`, so the agent page does not imply assigned work has already executed.
3. Desktop and 390px mobile browser checks validated completed, failed, and no-run task rows with no horizontal overflow.
4. The mobile layout keeps the task title readable by placing empty-run evidence on its own row.

## Module 9 Acceptance

1. Task board links can target `?taskId=...`; the page loads the normal task list plus a precise, policy-scoped lookup for the focused task, then highlights and scrolls to the card when visible.
2. A hidden-channel `taskId` lookup still returns no task because the API applies the existing channel/workspace visibility query before attaching run evidence.
3. Task-card run evidence links to `/agents/:agentId?tab=runs&runId=...`, so an operator can jump from business work to the exact agent execution row.
4. The agent profile accepts `?tab=runs&runId=...` and `?tab=tasks&taskId=...`, keeps tab state in the URL, and removes irrelevant focus params when the user switches tabs.
5. Work-log rows link back to `/tasks?taskId=...`; agent-task rows expose an `Open task` link to the same focused board state.
6. This copies Multica's best audit-navigation idea: durable evidence should be cross-linked and inspectable. It does not copy Multica's issue route hierarchy or timeline model into Raltic yet.

## Module 10 Acceptance

1. The workspace Agents directory now reads recent workspace `agent_runs` and summarizes work per agent without introducing Multica's queue/capacity model.
2. Each agent card can show the latest run status, relative update time, active count, and failed count, then deep-link to `/agents/:agentId?tab=runs&runId=...`.
3. Agents with no visible runs in the latest policy-scoped sample show `No work in latest sample`, making the sampling boundary explicit instead of implying full historical inactivity.
4. The run summary is derived from the existing policy-scoped `GET /api/v1/agent-runs?serverId=...`, so the card only reflects runs the viewer can already inspect.
5. This copies Multica's useful roster-level workload signal. It does not copy daemon queue leasing, capacity math, cancellation flows, or issue-board workload columns into Raltic.

## Module 11 Acceptance

1. Channel headers now show a compact agent roster for public/private channels, derived from the already-fetched channel members and workspace agents.
2. Desktop headers show visible agent identities with live status dots, accessible profile links, and readable names at medium widths; mobile headers collapse to a compact labeled count that opens the workspace Agents directory.
3. The composer audience label now distinguishes a single agent DM, a single-agent room, and a multi-agent room such as `2 agents in room`.
4. The feature translates Multica's Squad idea into Raltic's product shape: a channel is the workflow room, so the room should make its agent participants visible.
5. It does not add squad tables, leader delegation, squad assignment, or routing semantics. Those would need a deliberate workflow ownership model and are not necessary for the current Raltic GTM surface.

## Agent Team Hardening Review

The post-implementation review found the following issues worth fixing before deployment:

1. Task creation could broadcast the task message before `tasks.message_id` was persisted, allowing a bridge run to be created with `task_id=null`. The route now backfills both the task message pointer and any matching `agent_runs` row after ChatRoom returns the committed message id.
2. Bridge run updates were too permissive. They now require `runtime_mode=bridge`, reject already-terminal runs, and only update rows still in active statuses.
3. `GET /api/v1/tasks` could duplicate tasks for bridge tokens when multiple bound agents shared a channel. The list now deduplicates by task id before attaching run evidence.
4. Task Quick add could assign an agent that was not a member of the selected channel. The API rejects invalid assignees, and the web form filters the agent owner dropdown by the selected channel's `agentIds`.
5. User-facing run evidence exposed raw runtime labels and raw error strings. The UI now shows `Local Bridge` / `Raltic Cloud`, uses `Work log` instead of `Execution runs`, and all user-visible failure text goes through shared redaction before display.
6. Runtime errors could still be stored with secrets or local paths. The API, cloud agent path, ChatRoom path, RalticAgent fallback, and bridge manager now sanitize error text before persisting or PATCHing run failures.
7. Agent profile and task-board deep links could miss older focused runs or tasks because only the latest page was loaded. The web client now performs exact policy-scoped lookups for focused `runId` and `taskId` when the initial sample does not include them.
8. User-facing failure states were too optimistic. The Agents directory, task board, and Agent profile Tasks tab now show explicit load/work errors instead of stale cards or empty-state copy.
9. `GET /api/v1/agent-runs/:id` returned `403` for hidden-channel runs, which could reveal existence. Unauthorized run details now return `404`.
10. Bridge create requests could spoof `callerId` / `callerType` when no persisted trigger message was found. The API now derives the caller from the persisted trigger message, or from the bridge token owner fallback, and ignores caller fields in the bridge body.
11. Bridge updates could attach an `outputMessageId` from a different channel. Existing output messages are now validated against the run channel before the update is accepted.
12. Bridge terminal updates used a conditional active-status update but did not check whether a racing terminal update had already won. The route now re-reads the row and returns `409` when the run was finalized concurrently.
13. Roster and channel identity copy could overclaim or hide identity on constrained layouts. The roster now says `No work in latest sample`, and the channel strip exposes accessible agent profile links, mobile count text, and accurate composer labels.
14. Bridge run listing and detail access needed agent-level scoping, not just channel-level scoping. Bridge tokens now only list runs for their bound agents, and `GET /api/v1/agent-runs/:id` returns `404` for another owner's agent run even when that agent shares the channel.
15. Bridge task `latestRun` evidence needed the same agent-level scoping. The task list now filters both the outer latest-run rows and the correlated latest-run subquery to the bridge token's bound agent ids, so another agent's newer run cannot overwrite the evidence shown to this bridge.
16. Bridge run create/update requests could carry arbitrary `metadata`. The bridge API now ignores caller-supplied metadata on create and patch; metadata remains reserved for trusted internal producers until the product defines a user-visible metadata contract.
17. `outputMessageId` validation is now strict: it must be a UUID, it must exist, it must be in the run channel, and it must be an agent message from the same agent as the run. Missing messages, human messages, other-channel messages, and other-agent messages are rejected.
18. The Agents directory could briefly show empty work states before the work-log request settled, and slow responses from an old workspace slug could overwrite a newer page. The page now keeps work snapshots in a loading state until the run sample returns and uses a request id guard for reloads.
19. The task board could leave stale cards visible when workspace metadata failed to load. It now clears the stale workspace state and renders an explicit workspace-load error instead of showing Quick add or the board against an invalid workspace.
20. The Agent Tasks focused-task lookup now handles same-tab URL changes and isolated lookup failures: it performs an exact policy-scoped `taskId + limit=1` request when needed and preserves the existing task list if that focused lookup fails.

Additional safeguards:

- The API now records the persisted trigger message sender as the run caller, rather than trusting the bridge owner's fallback when the message row exists.
- The scheduled sweeper has a `status, updated_at` index so stale-run cleanup does not become a broad scan.
- The agent Tasks tab no longer attributes another agent's latest run to the current agent; it shows `Run by other agent` instead.
- User-visible redaction now covers Raltic machine keys, bridge/API bearer prefixes, common provider token shapes, and local paths before errors are persisted or rendered.

## Verification

Passed on 2026-06-05:

- `pnpm --filter @raltic/api test --run test/agent-runs.test.ts test/tasks.test.ts` - 19 tests.
- `pnpm --filter @raltic/api test --run` - 134 tests.
- `pnpm --filter @raltic/api lint`.
- `pnpm --filter @raltic/protocol exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/db exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/bridge-core exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/chat-room test --run` — 16 tests.
- `pnpm --filter @raltic/agent test --run` — 100 tests.
- `pnpm --filter @raltic/web lint`.
- `pnpm --filter @raltic/web exec tsc --noEmit -p tsconfig.json`.
- `npx opennextjs-cloudflare build` from `apps/web`.
- `git diff --check`.

Passed on 2026-06-06 for Module 9:

- `pnpm --filter @raltic/web lint`.
- `pnpm --filter @raltic/web exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/api lint`.
- `pnpm --filter @raltic/protocol exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/db exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/api test --run test/tasks.test.ts test/agent-runs.test.ts` - 20 tests.
- `npx opennextjs-cloudflare build` from `apps/web`.
- `git diff --check`.

Module 9 browser smoke with global Playwright against local `pnpm --filter @raltic/web exec next dev -p 3130` and mocked authenticated API data:

- Task board `?taskId=task-focus` issued both the normal workspace query and the precise `taskId + limit=1` query, then rendered and highlighted the focused older task.
- Task-card `Open agent` linked to `/s/deep/agents/agent-1?tab=runs&runId=run-focus`.
- Agent profile opened the `Runs` tab from URL state, highlighted `run-focus`, and linked back to `/s/deep/tasks?taskId=task-focus`.
- Agent profile opened the `Tasks` tab from URL state, highlighted `task-focus`, and exposed `Open task`.
- Error text showed `[local path]` and did not expose the raw `/Users/...` path or token-looking string.
- Desktop task board, desktop agent profile, 390px task board, and 390px agent profile had no horizontal overflow.

Passed on 2026-06-06 for Module 10:

- `pnpm --filter @raltic/web lint`.
- `pnpm --filter @raltic/web exec tsc --noEmit -p tsconfig.json`.
- `npx opennextjs-cloudflare build` from `apps/web`.
- `git diff --check`.

Module 10 browser smoke with global Playwright against the same local dev server and mocked authenticated API data:

- Agents directory called `GET /api/v1/agent-runs?serverId=srv-1&limit=200`.
- An agent with one running and one failed run showed `Work log`, `1 active`, and `1 failed`, and linked to `/s/deep/agents/agent-1?tab=runs&runId=run-active`.
- An agent with no runs showed `No work in latest sample`.
- A deliberate work-log `500` rendered `Work log unavailable`.
- Desktop and 390px agents directory had no horizontal overflow.

Passed on 2026-06-06 for Module 11:

- `pnpm --filter @raltic/web lint`.
- `pnpm --filter @raltic/web exec tsc --noEmit -p tsconfig.json`.
- `npx opennextjs-cloudflare build` from `apps/web`.
- `git diff --check`.

Module 11 browser smoke with global Playwright against the same local dev server and mocked authenticated API data:

- Channel header desktop strip showed agent identities, profile aria labels, and `Builder Agent` linking to `/s/deep/agents/agent-1`.
- The composer audience label showed `2 agents in room` for a multi-agent channel.
- 390px channel header collapsed to a visible `2 agents` link targeting `/s/deep/agents`.
- Desktop and 390px channel views had no horizontal overflow.

Passed on 2026-06-06 for Agent Team hardening:

- `pnpm --filter @raltic/protocol exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/web exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/api lint`.
- `pnpm --filter @raltic/bridge-core exec tsc --noEmit -p tsconfig.json`.
- `pnpm --filter @raltic/api test --run test/agent-runs.test.ts test/tasks.test.ts` - 23 tests.
- `pnpm --filter @raltic/web lint`.
- `pnpm --filter @raltic/api test --run` - 138 tests.
- `pnpm --filter @raltic/agent test --run` - 100 tests.
- `pnpm --filter @raltic/chat-room test --run` - 16 tests.
- `pnpm --filter @raltic/db exec tsc --noEmit -p tsconfig.json`.
- `npx opennextjs-cloudflare build` from `apps/web`.
- `git diff --check`.

The first full API run on 2026-06-06 was invalidated by Cloudflare Vitest while `tsc` was running in parallel (`apps/api/src/index.ts changed, invalidating this Durable Object`). It was rerun by itself and passed all 10 API test files / 138 tests.

Latest hardening browser smoke with global Playwright against the restarted local dev server on `http://localhost:3130` and mocked authenticated API data:

- Task board `?taskId=task-focus` issued the precise `taskId + limit=1` lookup, cleared stale cards on a deliberate task-list failure, and showed `Couldn't load tasks: tasks unavailable`.
- Task-card run evidence linked to `/s/deep/agents/agent-1?tab=runs&runId=run-old`.
- Failure text showed `[redacted token]` and `[local path]`; the rendered page did not expose raw `/Users/...` paths or token-looking strings.
- Agent profile deep-linked to `?tab=runs&runId=run-old`, called `GET /api/v1/agent-runs/run-old`, highlighted the exact older run, and linked back to `/s/deep/tasks?taskId=task-focus`.
- Agent profile Tasks tab deep-linked to `?tab=tasks&taskId=task-focus`, issued `GET /api/v1/tasks?serverId=srv-1&assigneeId=agent-1&taskId=task-focus&limit=1`, and highlighted the focused task.
- Agents roster showed `Work log`, `1 active`, `1 failed`, `No work in latest sample`, and `Work log unavailable`.
- Channel header showed accessible agent profile links, the composer label `2 agents in room`, mobile text `2 agents`, and no desktop or 390px horizontal overflow.

Final browser smoke after the last frontend hardening pass:

- Agents directory waits for the work-log request before rendering `No work in latest sample`, so the empty state is not shown while run evidence is still loading.
- A long `@handle · model` row truncates cleanly at 390px without horizontal overflow.
- Agent Tasks tab URL changes from one focused task to another trigger a precise `GET /api/v1/tasks?serverId=...&assigneeId=...&taskId=...&limit=1` lookup and highlight the new task.

Final Agent Team spot-check on 2026-06-06:

- API/security reviewer checked agent-run routes, task latest-run evidence, redaction, protocol validation, schema/migration, and route tests. Result: no blockers.
- Frontend reviewer checked Agents directory, Agent profile deep links, Task board, API client wiring, loading/empty states, and mobile overflow risk. Result: no P0/P1/P2 blockers.

Browser smoke with global Playwright against local `pnpm dev:web` and mocked authenticated API data:

- Task Quick add filters the agent owner dropdown to `Unassigned` when the selected channel has no agent members.
- Creating a task in a channel containing `agent-1` sends `assigneeId=agent-1` and `assigneeType=agent`.
- Task board shows `Not started`, `Local Bridge`, and sanitized failure text; no raw `/Users/...` path or token-looking string leaks.
- Agent profile shows `Work log`, `Raltic Cloud`, `Run by other agent`, and `Not started`.
- Desktop task board, 390px task board, and 390px agent profile had no horizontal overflow.

Not production-live yet:

- `0022_sharp_carlie_cooper.sql` must be applied to D1 before deploying the API Worker, because the API now reads and writes `agent_runs`.
- After D1 migration, deploy API first, then web, then run authenticated production verification via the `raltic-live-verification` matrix.

## Review Notes

- `trigger_message_id` and `output_message_id` must not have hard foreign keys. ChatRoom persists messages through DO SQLite `pending_writes` and flushes to D1 asynchronously.
- `task_id` can be nullable; Raltic tasks remain chat-message metadata, not the new execution source of truth.
- Bridge agents cannot reliably set `output_message_id` yet because the CLI `raltic message send` command does not return the created message id. Keeping it null is more accurate than fabricating a pointer.
- The bridge run API is intentionally scoped to bridge tokens. Cloud agents update runs through their DO/D1 path, and human-triggered manual runs should wait for a real product surface.
- The first human-visible UI is deliberately on the agent profile. This supports the GTM story of accountable AI-native workflows: users can inspect whether an agent really ran, where it ran, and why it failed.
- Browser verification used a mocked authenticated local workspace for layout, routing, and interaction checks. It validates the visible UI states and API calls, but it does not count as production live verification.
- Module 4 copies Multica's "do not leave work silently stuck" reliability principle, not its queue model. Raltic should not adopt daemon-polling queue mechanics while its bridge and cloud agent paths are event-driven.
- Module 5 is the first workflow-capture improvement. It deliberately avoids playbook creation or task retry controls because those need stronger idempotency semantics and user-facing launch/approval flows.
- Module 6 moves run evidence from agent diagnostics into the task board, which is more GTM-relevant for AI-native teams: business users evaluate whether work is moving, while operators can still jump to the agent profile for deeper run history.
- Local browser verification is intentionally mocked for authenticated data. The valid evidence is the rendered UI, route/API/build checks, and targeted route tests; a full websocket session remains part of the post-deploy `raltic-live-verification` matrix.
- Module 7 deliberately avoids automatic execution on task creation. That would be a product semantics change with duplicate-work risk, especially because bridge agents currently receive channel messages through WebSocket while cloud agents dispatch on mentions/DMs.
- Module 8 keeps the agent page and task board consistent. This matters for sales demos: a buyer can start from a business task board or an agent profile and still see the same execution evidence.
- Module 9 makes the evidence graph navigable. The GTM value is practical demo and buyer trust: a reviewer can move from a task outcome to the exact agent run and back without trusting a generic activity feed.
- Module 10 moves agent work proof up to the roster level. This supports the "AI teammate" GTM story more directly than a hidden diagnostics page: the workspace can see who is active, who failed, and who has no recent work before opening a profile.
- Module 11 keeps the Squad lesson but rejects the Squad object. Raltic's stronger narrative is workflow rooms with visible agent participants; showing those agents in the channel header is enough for the current GTM claim without inventing another routing layer.
