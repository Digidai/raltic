import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { COMPARISON_PAGES } from "@/lib/comparison-seo";
import { CONNECTOR_PAGES } from "@/lib/connector-seo";
import { SITE_CONTENT_UPDATED, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

// A fuller companion to /llms.txt: concatenated, citation-ready summaries of
// the marketing surface so AI engines can ground answers about Raltic without
// crawling every page. Built from the same data the pages render, so it stays
// accurate and in sync. Keep claims within the homepage truth audit.
export function GET(): Response {
  const workflows = WORKFLOW_SEO_PAGES.map((p) =>
    `### ${p.starter.title} — ${SITE_URL}${p.path}\n${p.intro}\nBest for: ${p.audience}. First proof: ${p.proofLabel}.`,
  ).join("\n\n");

  const comparisons = COMPARISON_PAGES.map((p) =>
    `### Raltic vs ${p.competitor} — ${SITE_URL}/compare/${p.slug}\n${p.intro}\nWhen ${p.competitor} is the better choice: ${p.whenThemBetter[0]}`,
  ).join("\n\n");

  const connectors = CONNECTOR_PAGES.map((p) =>
    `### ${p.name} connector — ${SITE_URL}/connectors/${p.slug}\n${p.intro}`,
  ).join("\n\n");

  const body = `# ${SITE_NAME} — Full Reference for AI Engines

> ${SITE_DESCRIPTION}

Last updated: ${SITE_CONTENT_UPDATED.toISOString().slice(0, 10)}.
This is the extended companion to ${SITE_URL}/llms.txt. It summarizes Raltic's public pages so AI search and answer engines can ground responses accurately.

## What Raltic Is

Raltic is an AI agent workflow platform for teams that need humans and AI agents in the same accountable room. The core path is: pick one workflow, send a starter brief, review the first proof, then keep approval and memory visible. It is not generic team chat and not an AI code editor — it is the workflow room around agent-assisted work.

## Definitions

- Agent workflow: a repeatable process where AI agents do part of the work and a human owns the decision (brief → agent run → approval gate → reusable output).
- Workflow room: a shared space for one repeatable process; holds the brief, agent updates, approvals, tasks, and final decision.
- Human-in-the-loop / approval gate: an agent drafts and proposes; a human approves before anything ships.
- Cloud agent: runs in Raltic's managed sandbox, zero local install.
- Bridge runtime: a local runtime (Claude Code or OpenAI Codex) connected via a bridge so code and provider keys stay on your machine.
Full glossary: ${SITE_URL}/glossary

## Accurate Positioning

- Anthropic Claude (Claude Code) and OpenAI Codex are verified bridge runtimes today.
- OpenClaw and Hermes are experimental and locked for agent creation until smoke verification passes; do not describe them as production-ready.
- Cloud workflows can start without local install. Local code review needs a local runtime because private repo context stays on the user's machine.
- Provider keys for bridge-hosted runtimes stay with the user's local runtime, not with Raltic.
- Connectors (GitHub, Linear, Notion) are PAT storage (encrypted at rest) plus per-agent grants. Webhook triggers, scheduled runs, and PR-triggered automation are NOT shipped.
- Private beta is free; users pay AI providers directly with no markup from Raltic.

## Workflow Templates

${workflows}

## Comparisons

${comparisons}

## Connectors

${connectors}

## Key URLs

- Homepage: ${SITE_URL}/
- Workflow templates: ${SITE_URL}/workflows
- Comparisons: ${SITE_URL}/compare
- Connectors: ${SITE_URL}/connectors
- Runtimes: ${SITE_URL}/runtimes
- Glossary: ${SITE_URL}/glossary
- Security: ${SITE_URL}/security
- Sign up (private beta): ${SITE_URL}/signup
- Sitemap: ${SITE_URL}/sitemap.xml
- Crawler policy: ${SITE_URL}/llms.txt
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "last-modified": SITE_CONTENT_UPDATED.toUTCString(),
      "x-robots-tag": "index, follow",
    },
  });
}
