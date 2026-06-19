import type { MetadataRoute } from "next";
import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import { SITE_LAST_MODIFIED, SITE_URL } from "@/lib/seo";

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
    { url: `${base}/`,                lastModified: SITE_LAST_MODIFIED, changeFrequency: "weekly",  priority: 1.0 },
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
    { url: `${base}/indie`,           lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/connectors`,      lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/security`,        lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacy`,         lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/terms`,           lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/signup`,          lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/login`,           lastModified: SITE_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/forgot-password`, lastModified: SITE_LAST_MODIFIED, changeFrequency: "yearly",  priority: 0.3 },
  ];

  return publicPages;
}
