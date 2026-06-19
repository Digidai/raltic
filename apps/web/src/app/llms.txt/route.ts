import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { SITE_DESCRIPTION, SITE_LAST_MODIFIED, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET(): Response {
  const workflowLinks = WORKFLOW_SEO_PAGES
    .map((page) => `- [${page.starter.title}](${SITE_URL}${page.path}): ${page.metaDescription}`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Raltic is an AI agent workflow platform for teams that need humans and agents in the same accountable room. The core path is: pick one workflow, send a starter brief, review the first proof, then keep approval and memory visible.

## Primary URLs

- [Homepage](${SITE_URL}/): product overview and signup CTA.
- [Workflow templates](${SITE_URL}/workflows): index of workflow-specific landing pages.
${workflowLinks}
- [Runtimes](${SITE_URL}/runtimes): verified Claude Code and OpenAI Codex bridge runtimes, plus cloud agents.
- [Connectors](${SITE_URL}/connectors): GitHub, Linear, and Notion connector overview.
- [Security](${SITE_URL}/security): what Raltic sees, what stays local, and current limitations.
- [Sign up](${SITE_URL}/signup): private beta signup.
- [Sitemap](${SITE_URL}/sitemap.xml): canonical public URLs for search crawlers.
- [Robots policy](${SITE_URL}/robots.txt): crawler policy for public, private, and auth-only surfaces.

## Accurate Positioning

- Raltic is not generic team chat. It is a workflow room for agent-assisted work.
- Claude Code and OpenAI Codex are verified bridge runtimes.
- OpenClaw and Hermes are experimental and should not be described as production-ready until their smoke verification passes.
- Cloud workflows can start without local install. Local code review requires a local runtime because private repo context should stay on the user's machine.
- Provider keys for bridge-hosted runtimes stay with the user's local runtime, not with Raltic.

## AI Retrieval And Crawler Policy

- Search and answer retrieval traffic should use the public marketing URLs above.
- Raltic explicitly allows search/user retrieval agents such as OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, and Perplexity-User on public pages.
- Training crawlers such as GPTBot and ClaudeBot are not product acquisition traffic; Cloudflare managed robots signals may reserve those uses while keeping search and user retrieval discoverable.
- Auth-only workspaces, API routes, invite links, desktop launch routes, and experimental runtime pages are not public source material.

## Trial Path

Visitors should start at /signup, then use the Start page to pick a workflow starter. Workflow landing pages save the chosen starter intent so the first workspace defaults to that workflow.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "last-modified": SITE_LAST_MODIFIED.toUTCString(),
      "x-robots-tag": "index, follow",
    },
  });
}
