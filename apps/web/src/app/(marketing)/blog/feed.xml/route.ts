import { BLOG_ARTICLES } from "@/lib/editorial-content";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-static";

function xml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

export function GET(): Response {
  const items = BLOG_ARTICLES.map((article) => {
    const url = `${SITE_URL}/blog/${article.slug}`;
    return `<item>
      <title>${xml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${xml(article.metaDescription)}</description>
      <author>hello@raltic.com (${SITE_NAME} Research)</author>
      <pubDate>${new Date(`${article.published}T00:00:00.000Z`).toUTCString()}</pubDate>
    </item>`;
  }).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xml(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>${xml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(`${BLOG_ARTICLES[0].updated}T00:00:00.000Z`).toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=3600", "x-robots-tag": "index, follow" } });
}
