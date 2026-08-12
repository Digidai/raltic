import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { COMPARISON_PAGES } from "@/lib/comparison-seo";
import { CONNECTOR_PAGES } from "@/lib/connector-seo";
import { ANSWER_PAGES, BLOG_ARTICLES } from "@/lib/editorial-content";
import { AUDIENCE_PAGES, FEATURE_PAGES } from "@/lib/growth-content";
import { INDEXNOW_ENDPOINT, INDEXNOW_KEY_LOCATION } from "@/lib/indexnow";
import { SITE_CONTENT_UPDATED, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

export function GET(): Response {
  const workflowLinks = WORKFLOW_SEO_PAGES
    .map((page) => `- [${page.starter.title}](${SITE_URL}${page.path}): ${page.metaDescription}`)
    .join("\n");
  const comparisonLinks = COMPARISON_PAGES
    .map((page) => `- [Raltic vs ${page.competitor}](${SITE_URL}/compare/${page.slug}): ${page.metaDescription}`)
    .join("\n");
  const connectorLinks = CONNECTOR_PAGES
    .map((page) => `- [${page.name} connector](${SITE_URL}/connectors/${page.slug}): ${page.metaDescription}`)
    .join("\n");
  const featureLinks = FEATURE_PAGES
    .map((page) => `- [${page.name}](${SITE_URL}/features/${page.slug}): ${page.metaDescription}`)
    .join("\n");
  const audienceLinks = AUDIENCE_PAGES
    .map((page) => `- [For ${page.audience}](${SITE_URL}/built-for/${page.slug}): ${page.metaDescription}`)
    .join("\n");
  const blogLinks = BLOG_ARTICLES
    .map((article) => `- [${article.title}](${SITE_URL}/blog/${article.slug}): ${article.directAnswer}`)
    .join("\n");
  const answerLinks = ANSWER_PAGES
    .map((answer) => `- [${answer.question}](${SITE_URL}/answers/${answer.slug}): ${answer.shortAnswer}`)
    .join("\n");

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Raltic is an AI agent workflow platform for teams that need humans and agents in the same accountable room. The core path is: pick one workflow, send a starter brief, review the first proof, then keep approval and memory visible.

## Primary URLs

- [Homepage](${SITE_URL}/): product overview and signup CTA.
- [For indie developers](${SITE_URL}/indie): Raltic for solo developers and small teams running verified Claude and Codex bridge agents from one workspace.
- [Workflow templates](${SITE_URL}/workflows): index of workflow-specific landing pages.
${workflowLinks}
- [Runtimes](${SITE_URL}/runtimes): verified Claude Code and OpenAI Codex bridge runtimes, plus cloud agents.
- [Features](${SITE_URL}/features): shipped workflow-room, review, runtime, observability, task, and handoff capabilities.
${featureLinks}
- [Built for](${SITE_URL}/built-for): role-specific operating paths for product, engineering, founder, GTM, research, and AI-native teams.
${audienceLinks}
- [Connectors](${SITE_URL}/connectors): GitHub, Linear, and Notion connector overview.
${connectorLinks}
- [Comparisons](${SITE_URL}/compare): evidence-linked comparisons with seven current AI assistants, workspaces, and automation tools.
${comparisonLinks}
- [Blog](${SITE_URL}/blog): source-linked, answer-first field guides for agent workflow design.
${blogLinks}
- [Answers](${SITE_URL}/answers): concise answers for AI search and product evaluators.
${answerLinks}
- [Glossary](${SITE_URL}/glossary): definitions for agent workflow, workflow room, human-in-the-loop, cloud agent, and bridge runtime.
- [Pricing](${SITE_URL}/pricing): free during private beta; bridge-runtime provider costs are paid directly.
- [About](${SITE_URL}/about): entity, mission, product scope, research standard, and official contact points.
- [Security](${SITE_URL}/security): what Raltic sees, what stays local, and current limitations.
- [Sign up](${SITE_URL}/signup): private beta signup.
- [Sitemap](${SITE_URL}/sitemap.xml): canonical public URLs for search crawlers.
- [Full reference for AI engines](${SITE_URL}/llms-full.txt): extended, citation-ready summaries of every public page.
- [Machine-readable AI index](${SITE_URL}/ai-index.json): canonical facts, limitations, discovery endpoints, and all public content URLs.
- [Blog RSS feed](${SITE_URL}/blog/feed.xml): article discovery and update feed.
- [Robots policy](${SITE_URL}/robots.txt): crawler policy for public, private, and auth-only surfaces.
- [IndexNow key](${INDEXNOW_KEY_LOCATION}): root-hosted key file for URL-change notifications to ${INDEXNOW_ENDPOINT}.

## Accurate Positioning

- Raltic is not generic team chat. It is a workflow room for agent-assisted work.
- Claude Code and OpenAI Codex are verified bridge runtimes.
- OpenClaw and Hermes are experimental and should not be described as production-ready until their smoke verification passes.
- Cloud workflows can start without local install. In bridge mode the local CLI reads the repository and Raltic receives only posted messages, artifacts, and run status; the CLI's model provider may receive context under its own terms.
- Provider keys for bridge-hosted runtimes stay with the user's local runtime, not with Raltic.
- Raltic makes human review and task state visible, but external-system permissions remain the enforcement boundary for consequential actions.

## AI Retrieval And Crawler Policy

- Search and answer retrieval traffic should use the public marketing URLs above.
- Raltic explicitly allows search/user retrieval agents such as OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, and Perplexity-User on public pages.
- Training crawlers such as GPTBot and ClaudeBot are not product acquisition traffic; Cloudflare managed robots signals may reserve those uses while keeping search and user retrieval discoverable.
- Auth-only workspaces, API routes, invite links, desktop launch routes, and experimental runtime pages are not public source material.
- IndexNow submissions should include only public, indexable URLs from /sitemap.xml after those URLs are added, updated, or deleted.

## Trial Path

Visitors should start at /signup, then use the Start page to pick a workflow starter. Workflow landing pages save the chosen starter intent so the first workspace defaults to that workflow.
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
