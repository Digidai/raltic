import type { MetadataRoute } from "next";
import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { COMPARISON_PAGES } from "@/lib/comparison-seo";
import { CONNECTOR_PAGES } from "@/lib/connector-seo";
import { AUDIENCE_PAGES, FEATURE_PAGES } from "@/lib/growth-content";
import { ANSWER_PAGES, BLOG_ARTICLES } from "@/lib/editorial-content";
import { BUYER_GUIDES } from "@/lib/buyer-guide-content";
import { SITE_CONTENT_UPDATED, SITE_LAST_MODIFIED, SITE_URL } from "@/lib/seo";

/**
 * Public sitemap — served at /sitemap.xml. Submit this URL in Google
 * Search Console (Search Console → Sitemaps → Add a new sitemap →
 * `https://raltic.com/sitemap.xml`).
 *
 * Only PUBLIC, indexable pages live here. Routes excluded on purpose:
 *   - Workspace routes (`/s/*`) — auth-walled.
 *   - Invite + email-verify + password-reset flows — single-use.
 *   - `/teams` — NOINDEX until P4 billing ships (codex review MED-6).
 *   - `/runtimes/openclaw` + `/runtimes/hermes` — NOINDEX until smoke
 *     verification completes (codex review HIGH-2).
 *
 * When the openclaw/hermes smoke runbook passes, append them here AND
 * flip robots.index → true in their page.tsx metadata.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const publicPages: MetadataRoute.Sitemap = [
    { url: `${base}/`,                lastModified: SITE_CONTENT_UPDATED, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/workflows`,       lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    ...WORKFLOW_SEO_PAGES.map((page) => ({
      url: `${base}${page.path}`,
      lastModified: SITE_LAST_MODIFIED,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    { url: `${base}/runtimes`,        lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/runtimes/claude`, lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/runtimes/codex`,  lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/compare`,         lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.85 },
    ...COMPARISON_PAGES.map((page) => ({
      url: `${base}/compare/${page.slug}`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${base}/best`,            lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.82 },
    ...BUYER_GUIDES.map((guide) => ({
      url: `${base}/best/${guide.slug}`,
      lastModified: new Date(`${guide.updated}T00:00:00.000Z`),
      changeFrequency: "monthly" as const,
      priority: 0.78,
    })),
    { url: `${base}/features`,        lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    ...FEATURE_PAGES.map((page) => ({
      url: `${base}/features/${page.slug}`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.82,
    })),
    { url: `${base}/built-for`,       lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.85 },
    ...AUDIENCE_PAGES.map((page) => ({
      url: `${base}/built-for/${page.slug}`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${base}/blog`,            lastModified: SITE_CONTENT_UPDATED, changeFrequency: "weekly", priority: 0.8 },
    ...BLOG_ARTICLES.map((article) => ({
      url: `${base}/blog/${article.slug}`,
      lastModified: new Date(`${article.updated}T00:00:00.000Z`),
      changeFrequency: "monthly" as const,
      priority: 0.74,
    })),
    { url: `${base}/answers`,         lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.75 },
    ...ANSWER_PAGES.map((answer) => ({
      url: `${base}/answers/${answer.slug}`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/connectors`,      lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    ...CONNECTOR_PAGES.map((page) => ({
      url: `${base}/connectors/${page.slug}`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/glossary`,        lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pricing`,         lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/about`,           lastModified: SITE_CONTENT_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/indie`,           lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/security`,        lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`,         lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`,           lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
  ];

  return publicPages;
}
