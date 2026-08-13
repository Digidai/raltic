import { COMPARISON_PAGES } from "@/lib/comparison-seo";
import { CONNECTOR_PAGES } from "@/lib/connector-seo";
import { ANSWER_PAGES, BLOG_ARTICLES } from "@/lib/editorial-content";
import { AUDIENCE_PAGES, FEATURE_PAGES } from "@/lib/growth-content";
import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { BUYER_GUIDES } from "@/lib/buyer-guide-content";
import { SITE_CONTENT_UPDATED, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

type IndexPage = {
  type: string;
  title: string;
  url: string;
  description: string;
  date_modified: string;
};

function page(type: string, title: string, path: string, description: string, dateModified = SITE_CONTENT_UPDATED.toISOString().slice(0, 10)): IndexPage {
  return { type, title, url: `${SITE_URL}${path}`, description, date_modified: dateModified };
}

export function GET(): Response {
  const pages: IndexPage[] = [
    page("product", "Raltic", "/", SITE_DESCRIPTION),
    page("collection", "Workflow templates", "/workflows", "Reviewable starter workflows for launch readiness, research synthesis, customer risk, and local-runtime code review."),
    ...WORKFLOW_SEO_PAGES.map((item) => page("workflow", item.starter.title, item.path, item.metaDescription)),
    page("collection", "Raltic runtimes", "/runtimes", "Verified Claude Code and OpenAI Codex bridge runtimes, managed cloud agents, and clearly labeled experimental runtimes."),
    page("runtime", "Claude Code bridge runtime", "/runtimes/claude", "Use a verified Claude Code local runtime in shared Raltic workflow rooms."),
    page("runtime", "OpenAI Codex bridge runtime", "/runtimes/codex", "Use a verified OpenAI Codex local runtime in shared Raltic workflow rooms."),
    page("collection", "Raltic features", "/features", "Product capabilities for shared agent workflow operations."),
    ...FEATURE_PAGES.map((item) => page("feature", item.name, `/features/${item.slug}`, item.metaDescription)),
    page("collection", "Who Raltic is built for", "/built-for", "Role-specific agent workflow operating models."),
    ...AUDIENCE_PAGES.map((item) => page("audience", item.audience, `/built-for/${item.slug}`, item.metaDescription)),
    page("collection", "Raltic comparisons", "/compare", "Evidence-linked capability comparisons using current first-party sources."),
    ...COMPARISON_PAGES.map((item) => page("comparison", `Raltic vs ${item.competitor}`, `/compare/${item.slug}`, item.metaDescription)),
    page("collection", "AI agent platform buyer's guides", "/best", "Transparent, job-based shortlists for AI agent orchestration, human review, and team workflow platforms."),
    ...BUYER_GUIDES.map((item) => page("buyer-guide", item.title, `/best/${item.slug}`, item.metaDescription, item.updated)),
    page("collection", "Raltic field guides", "/blog", "Research-backed guides for accountable AI agent work."),
    ...BLOG_ARTICLES.map((item) => page("article", item.title, `/blog/${item.slug}`, item.metaDescription, item.updated)),
    page("collection", "AI agent workflow answers", "/answers", "Direct answers to common AI agent workflow and Raltic product questions."),
    ...ANSWER_PAGES.map((item) => page("answer", item.question, `/answers/${item.slug}`, item.metaDescription)),
    page("collection", "Connectors", "/connectors", "GitHub, Linear, and Notion connectors with encrypted credentials and per-agent grants."),
    ...CONNECTOR_PAGES.map((item) => page("connector", `${item.name} connector`, `/connectors/${item.slug}`, item.metaDescription)),
    page("commercial", "Raltic pricing", "/pricing", "Raltic is free during private beta; bridge-runtime model costs are paid directly to providers."),
    page("entity", "About Raltic", "/about", "Raltic's mission, product scope, research standard, and official contact points."),
    page("trust", "Raltic security", "/security", "Current data, runtime, connector, and product security boundaries."),
    page("definition", "AI agent workflow glossary", "/glossary", "Definitions for workflow rooms, bridge runtimes, cloud agents, human review, and agent orchestration."),
    page("audience", "Raltic for indie developers", "/indie", "Coordinate local and cloud AI agents from one workspace with reusable workflow history."),
    page("legal", "Raltic privacy policy", "/privacy", "How Raltic handles account, workspace, connector, and deliberately posted workflow data."),
    page("legal", "Raltic terms of service", "/terms", "Current terms governing use of the Raltic private beta."),
  ];

  return Response.json({
    schema_version: "1.0",
    generated_at: SITE_CONTENT_UPDATED.toISOString(),
    entity: {
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      official_repository: "https://github.com/Digidai/raltic",
      contact: "hello@raltic.com",
    },
    canonical_product_facts: [
      "Raltic is a workflow-room platform for humans and AI agents, not general team chat or an AI code editor.",
      "Claude Code and OpenAI Codex are verified local bridge runtimes.",
      "Managed cloud agents can start without a local install.",
      "Bridge runtimes read repositories on their runtime machines; Raltic receives messages, artifacts, and run status deliberately posted to rooms.",
      "The underlying AI CLI may send context to its model provider under that provider's terms.",
      "GitHub, Linear, and Notion connectors use encrypted credentials and per-agent grants.",
      "Raltic is free during private beta; users pay bridge-runtime AI providers directly.",
    ],
    current_limitations: [
      "OpenClaw and Hermes are experimental and are not production-ready claims.",
      "Raltic does not claim a shipped no-code trigger builder, scheduled-run system, PR-trigger pipeline, or automatic external outreach workflow.",
      "Visible human review state does not replace permissions and authorization controls in external systems.",
    ],
    discovery: {
      sitemap: `${SITE_URL}/sitemap.xml`,
      robots: `${SITE_URL}/robots.txt`,
      llms: `${SITE_URL}/llms.txt`,
      llms_full: `${SITE_URL}/llms-full.txt`,
      rss: `${SITE_URL}/blog/feed.xml`,
    },
    pages,
  }, {
    headers: {
      "cache-control": "public, max-age=3600",
      "last-modified": SITE_CONTENT_UPDATED.toUTCString(),
      "x-robots-tag": "index, follow",
    },
  });
}
