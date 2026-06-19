# Raltic GTM, User Paths, and Functional Test Matrix

Date: 2026-06-14

This document is the review index for Raltic's user-facing path, feature path, and test coverage. It keeps GTM clarity, interaction clarity, local validation, CI/deploy evidence, and authenticated production proof as separate surfaces.

## GTM Spine

Raltic should sell and demonstrate one sharp loop:

1. Pick one business workflow.
2. Open a workflow room with a visible agent participant.
3. Send the starter brief.
4. Review the first proof, task, or blocked run.
5. Repeat only after the human approval boundary is clear.

The short product promise is not "team chat with agents". It is:

> One workflow room where humans can see, approve, and audit what AI agents do.

The Start page already maps this into the interaction copy as `Pick -> Send -> Prove`. Every new feature should either strengthen that loop or stay out of the primary path.

## Primary User Path

| Step | User intent | Product surface | Expected interaction | Existing or new test anchor |
| --- | --- | --- | --- | --- |
| 1 | Understand the product without logging in | Marketing homepage `/` | Hero explains first agent workflow; primary CTA goes to `/signup`; runtime CTA preserves setup intent | `e2e/homepage-cta-nav.spec.ts`, `e2e/marketing-public-access.spec.ts`, `e2e/gtm-first-value-path.spec.ts` |
| 2 | Create or resume account | `/signup`, `/login`, `/verify-email` | Runtime intent is preserved only when appropriate; desktop next path is not polluted | `e2e/auth-password-flows.spec.ts`, `e2e/auth-roundtrip.spec.ts`, `e2e/homepage-cta-nav.spec.ts` |
| 3 | Land in a workspace and know what to do first | `/s/[slug]` | Start page shows outcome picker, `Pick -> Send -> Prove`, and a selected starter action | `e2e/workspace-shell-readonly.spec.ts`, `e2e/gtm-first-value-path.spec.ts` |
| 4 | Start the first workflow room | `/s/[slug]` to `/s/[slug]/channel/[id]?starter=...` | Cloud starter creates or opens a workflow room; local-code starter gates on runtime setup | `e2e/gtm-first-value-path.spec.ts` |
| 5 | Send the first actionable brief | `MessageArea` starter panel and composer | Starter panel explains no agent starts until send; Use brief fills the composer with focus, need, context, and approval boundary | `e2e/gtm-first-value-path.spec.ts`, `e2e/heroui-workspace-shell.spec.ts` |
| 6 | See proof that work is happening | Work queue, Tasks, Agent Work, Agent profile Runs tab | Tasks and agent runs show status, source, runtime mode, errors, and links back to rooms/tasks | `e2e/workspace-shell-readonly.spec.ts`, `e2e/gtm-first-value-path.spec.ts`, `apps/api/test/tasks.test.ts`, `apps/api/test/agent-runs.test.ts` |
| 7 | Invite teammates and manage workspace | Settings members, keys, agents, workspace | Invites, runtime keys, and agent settings stay scoped by policy | `e2e/invite-flow.spec.ts`, `e2e/heroui-agent-dialogs.spec.ts`, `apps/api/test/*`, `packages/auth-core/test/*` |
| 8 | Bring local or cloud runtimes online | Setup wizard, bridge, cloud agent runtime | Cloud starts immediately; bridge-mode workflows require explicit local runtime connection | `e2e/heroui-overlays.spec.ts`, `apps/bridge/test/*`, `packages/bridge-core/test/*`, `packages/agent/test/*` |

## Functional Modules

| Module | User-facing responsibility | Code surface | Required coverage |
| --- | --- | --- | --- |
| Marketing and public routes | Explain the first workflow value and let anonymous visitors reach auth pages | `apps/web/src/app/(marketing)`, `apps/web/src/middleware.ts` | Public route access, CTA targets, footer/nav links, SEO/sitemap, signed-in behavior |
| Auth and onboarding | Create the personal workspace and preserve runtime/desktop intent | `packages/auth-core`, `apps/web/src/app/(auth)`, `apps/api/src/lib/auth.ts` | Password flow, email verification, session token handoff, onboarding hook, route gate |
| Workspace shell | Keep users oriented across Start, Work queue, Workflows, Tasks, Agent Work, and Settings | `apps/web/src/components/workspace-shell.tsx`, `sidebar.tsx` | Desktop/mobile navigation, no body scroll, no horizontal overflow, menu/dialog escape behavior |
| First workflow start | Convert GTM promise into a room, agent, starter brief, and proof path | `apps/web/src/app/s/[slug]/page.tsx`, `workflow-starters.ts`, `message-area.tsx` | Outcome picker, room create/join/open, local-runtime gate, starter draft, tracking event, composer placement |
| Messaging and realtime | Let humans and agents work in the same room | `message-area.tsx`, `tiptap-message-input.tsx`, `packages/chat-room` | Send/edit/delete/reply/pin/reaction, attachments, unread pill, read receipts, WS token, DO alarm sync |
| Work proof | Make agent execution visible and auditable | `apps/api/src/routes/agent-runs.ts`, `tasks.ts`, Agent Work and profile pages | Policy-scoped run/task list/detail, task linking, status rendering, focused deep links, hidden-channel non-leakage |
| Bridge and CLI | Let local runtimes operate through Raltic without leaking local context | `apps/bridge`, `packages/bridge-core`, `packages/cli`, `packages/agent-runtime` | Bridge connect, machine key auth, runtime parsing, CLI commands, scoped task/run access, system prompt behavior |
| Cloud agent and sandbox | Run hosted agents with bounded tools and container isolation | `packages/agent`, `packages/sandbox-*`, `apps/api/src/routes/agent-workspace.ts` | Tool dispatch, workspace read/list/terminal, scheduling, error redaction, sandbox daemon file/bash security |
| Desktop | Connect the local bridge and web shell as a desktop surface | `apps/desktop` | Launch smoke, settings popup, runtime key flow, desktop login handoff |
| Database and policy | Keep D1 schema, migrations, and explicit auth policy aligned | `packages/db`, `packages/auth-core/src/policy.ts` | Migration drift check, policy unit tests, API route policy checks, no bypasses |

## Review Rules

Every feature change should pass the smallest matrix that covers the touched surface:

1. Source review: identify the product path row and code module row above.
2. Functional test: add or update Vitest/API coverage when data, policy, protocol, or runtime behavior changes.
3. Interaction test: add or update Playwright coverage when navigation, copy, layout, dialog, composer, or GTM flow changes.
4. Local verification: run targeted tests first, then broader package tests when shared contracts changed.
5. Live verification: for production-visible changes, use an authenticated browser session. Do not treat unauthenticated curl as proof.
6. Closeout: report changed surfaces, commands, browser matrix, skipped production proof, and remaining risk separately.

## Current High-Priority Gaps

These should be closed before calling Raltic production-ready:

1. Stabilize the remaining known E2E failure cluster before deploy confidence: setup wizard/local bridge state and HeroUI overlay/source guard. The homepage use-case card mismatch is now covered by `e2e/homepage-sections.spec.ts`.
2. Add CLI command tests for `raltic message`, `server info`, and `task` commands. `packages/cli` currently has build coverage but no package test script.
3. Add DB migration and schema drift checks to the normal CI gate, not only ad hoc local runs.
4. Keep OpenClaw/Hermes behind the smoke-test runbook until `docs/SMOKE_TESTS_openclaw_hermes.md` passes.
5. Collect authenticated production proof for the first workflow loop: Start page, starter room, starter brief, task/run evidence, and workspace-agent health.
6. Decide whether desktop is a primary GTM surface or a secondary runtime setup surface. If primary, desktop release QA must be in the same ship gate as web/API.

## Acceptance Standard

A path is shippable only when each relevant row has:

- one named user intent
- one named product surface
- one automated functional or interaction test, or a documented manual-only reason
- one recent verification command or authenticated browser proof
- one explicit owner for any deferred risk

This matrix cannot prove there are no issues. It makes regressions harder to hide and gives every feature change a concrete review target.
