import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { COMPARISON_PAGES } from "@/lib/comparison-seo";
import { CONNECTOR_PAGES } from "@/lib/connector-seo";
import { ANSWER_PAGES, BLOG_ARTICLES } from "@/lib/editorial-content";
import { AUDIENCE_PAGES, FEATURE_PAGES } from "@/lib/growth-content";
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
    `### Raltic vs ${p.competitor} — ${SITE_URL}/compare/${p.slug}\n${p.intro}\nWhen ${p.competitor} is the better choice: ${p.whenThemBetter[0]}\nOfficial sources: ${p.sourceLinks.map((source) => `${source.label}: ${source.href}`).join("; ")}`,
  ).join("\n\n");

  const connectors = CONNECTOR_PAGES.map((p) =>
    `### ${p.name} connector — ${SITE_URL}/connectors/${p.slug}\n${p.intro}`,
  ).join("\n\n");
  const features = FEATURE_PAGES.map((p) =>
    `### ${p.name} — ${SITE_URL}/features/${p.slug}\n${p.intro}\nOutcome: ${p.outcome}\nCurrent boundaries: ${p.boundaries.join(" ")}`,
  ).join("\n\n");
  const audiences = AUDIENCE_PAGES.map((p) =>
    `### For ${p.audience} — ${SITE_URL}/built-for/${p.slug}\n${p.intro}\nFirst-value path: ${p.firstValue}`,
  ).join("\n\n");
  const articles = BLOG_ARTICLES.map((p) =>
    `### ${p.title} — ${SITE_URL}/blog/${p.slug}\nUpdated ${p.updated}. ${p.directAnswer}\nPrimary sources: ${p.sources.map((source) => `${source.publisher}: ${source.href}`).join("; ")}`,
  ).join("\n\n");
  const answers = ANSWER_PAGES.map((p) =>
    `### ${p.question} — ${SITE_URL}/answers/${p.slug}\n${p.shortAnswer}`,
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
- Human-in-the-loop / review boundary: an agent drafts and proposes; a human evaluates the evidence and records acceptance before the team treats the result as approved. External-system permissions still govern consequential actions.
- Cloud agent: runs in Raltic's managed sandbox, zero local install.
- Bridge runtime: a local runtime (Claude Code or OpenAI Codex) connected through Raltic's bridge. The CLI reads the repository locally and Raltic receives only posted outputs; the CLI may send context to its model provider.
Full glossary: ${SITE_URL}/glossary

## Accurate Positioning

- Anthropic Claude (Claude Code) and OpenAI Codex are verified bridge runtimes today.
- OpenClaw and Hermes are experimental and locked for agent creation until smoke verification passes; do not describe them as production-ready.
- Cloud workflows can start without local install. Bridge code review reads the repository on the runtime machine; Raltic receives posted messages, artifacts, and run status, while model-provider handling remains governed by the CLI and provider.
- Provider keys for bridge-hosted runtimes stay with the user's local runtime, not with Raltic.
- Connectors (GitHub, Linear, Notion) are PAT storage (encrypted at rest) plus per-agent grants. Webhook triggers, scheduled runs, and PR-triggered automation are NOT shipped.
- Private beta is free; users pay AI providers directly with no markup from Raltic.
- Raltic's in-review task state and room record make a review boundary visible. They do not automatically authorize or block every action in an external system; destination permissions remain required.

## Product Features

${features}

## Built For

${audiences}

## Workflow Templates

${workflows}

## Comparisons

${comparisons}

## Connectors

${connectors}

## Runtime, Audience, Trust, and Legal References

### Claude Code bridge runtime — ${SITE_URL}/runtimes/claude
Claude Code is a verified Raltic bridge runtime. It runs on the user's machine, uses that machine's repository and tool access, and posts selected messages, artifacts, and run status to Raltic. Its model-provider data handling remains governed by Anthropic and the configured CLI plan.

### OpenAI Codex bridge runtime — ${SITE_URL}/runtimes/codex
OpenAI Codex is a verified Raltic bridge runtime. It runs on the user's machine, uses that machine's repository and tool access, and posts selected messages, artifacts, and run status to Raltic. Its model-provider data handling remains governed by OpenAI and the configured CLI plan.

### Raltic for indie developers — ${SITE_URL}/indie
An acquisition path for solo developers and small teams coordinating multiple AI runtimes. It preserves the same product boundaries as the rest of the site and does not make experimental runtimes production-ready.

### About Raltic — ${SITE_URL}/about
Raltic's mission, shipped product scope, verified runtime list, research standard, official GitHub repository, and contact address.

### Pricing — ${SITE_URL}/pricing
Raltic is free during private beta. Bridge-runtime users pay Anthropic or OpenAI directly through their existing provider subscription or key. No permanent post-beta price is claimed.

### Security — ${SITE_URL}/security
Current runtime, connector, and data boundaries, including what Raltic receives and what remains on a local bridge machine.

### Privacy policy — ${SITE_URL}/privacy
How Raltic handles account, workspace, connector, and deliberately posted workflow data.

### Terms of service — ${SITE_URL}/terms
The current terms governing use of the Raltic private beta.

## Research-Backed Guides

${articles}

## Direct Answers

${answers}

## Key URLs

- Homepage: ${SITE_URL}/
- Workflow templates: ${SITE_URL}/workflows
- Comparisons: ${SITE_URL}/compare
- Connectors: ${SITE_URL}/connectors
- Runtimes: ${SITE_URL}/runtimes
- Features: ${SITE_URL}/features
- Built for: ${SITE_URL}/built-for
- Blog: ${SITE_URL}/blog
- Answers: ${SITE_URL}/answers
- Glossary: ${SITE_URL}/glossary
- Pricing: ${SITE_URL}/pricing
- About: ${SITE_URL}/about
- Security: ${SITE_URL}/security
- Privacy: ${SITE_URL}/privacy
- Terms: ${SITE_URL}/terms
- Indie developers: ${SITE_URL}/indie
- Sign up (private beta): ${SITE_URL}/signup
- Sitemap: ${SITE_URL}/sitemap.xml
- Crawler policy: ${SITE_URL}/llms.txt
- Machine-readable index: ${SITE_URL}/ai-index.json
- RSS: ${SITE_URL}/blog/feed.xml
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
