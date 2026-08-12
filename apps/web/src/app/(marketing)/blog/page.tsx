import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { BLOG_ARTICLES } from "@/lib/editorial-content";
import { SITE_CONTENT_UPDATED, absoluteUrl, breadcrumbJsonLd, itemListJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Raltic Blog: AI Agent Workflows & Orchestration",
  description: "Research-backed guides to AI agent workflows, orchestration, human review, observability, runtime choices, and practical team operating patterns.",
  path: "/blog",
  keywords: ["AI agent workflow blog", "agent orchestration guide", "human in the loop AI", "multi agent workflows"],
});

export default function BlogPage() {
  const [featured, ...rest] = BLOG_ARTICLES;
  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path: "/blog", name: "Raltic AI agent workflow guides", description: metadata.description as string, type: "CollectionPage", dateModified: SITE_CONTENT_UPDATED, mainEntity: { "@id": `${absoluteUrl("/blog")}#itemlist` } }),
        itemListJsonLd({ path: "/blog", name: "Raltic guides", items: BLOG_ARTICLES.map((article) => ({ name: article.title, description: article.metaDescription, path: `/blog/${article.slug}` })) }),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
      ])} />
      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }]} /><div className="mx-auto mt-8 max-w-3xl px-6 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700"><BookOpen className="h-5 w-5" aria-hidden="true" /></div><h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">Field guides for accountable agent work.</h1><p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">Research-backed, source-linked guidance for teams designing AI agent workflows that people can inspect, review, and improve.</p></div></section>

      <section className="bg-white px-6 py-20"><div className="mx-auto max-w-6xl"><Link href={`/blog/${featured.slug}`} className="group grid rounded-lg border border-zinc-200 bg-[#faf9f6] lg:grid-cols-[0.8fr_1.2fr]"><div className="flex min-h-56 items-center justify-center border-b border-zinc-200 bg-zinc-900 p-10 text-white lg:border-r lg:border-b-0"><div><p className="text-xs font-medium uppercase text-blue-300">Featured guide</p><p className="mt-4 max-w-sm text-3xl font-medium leading-tight">Build the workflow before adding autonomy.</p></div></div><div className="p-7 sm:p-10"><div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500"><span>{featured.updated}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{featured.readTime}</span></div><h2 className="mt-5 text-3xl font-medium text-zinc-900">{featured.title}</h2><p className="mt-4 text-base leading-relaxed text-zinc-600">{featured.dek}</p><span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700">Read the guide <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></div></Link></div></section>

      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20"><div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-medium uppercase text-amber-700">Latest research</p><h2 className="mt-3 text-3xl font-medium text-zinc-900 sm:text-4xl">Design, control, and evaluation.</h2></div><a href="/blog/feed.xml" className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900">RSS feed</a></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rest.map((article) => <Link key={article.slug} href={`/blog/${article.slug}`} className="group rounded-lg border border-zinc-200 bg-white p-6 transition-colors hover:border-amber-300"><div className="flex items-center justify-between gap-3 text-xs text-zinc-500"><span>{article.updated}</span><span>{article.readTime}</span></div><h3 className="mt-4 text-xl font-medium leading-snug text-zinc-900">{article.title}</h3><p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-600">{article.dek}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">Read article <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link>)}</div></div></section>
      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Apply the research to one real workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Start from a reviewed artifact, not an empty automation canvas.</p><div className="mt-7 flex justify-center"><MarketingButton href="/workflows" ctaTarget="blog_footer_workflows">Browse workflow starters <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
