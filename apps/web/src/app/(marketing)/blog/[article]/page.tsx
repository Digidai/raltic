import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, ExternalLink } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ContentRouteMap, ContextLink, EvidenceBoard } from "@/components/marketing/content-visuals";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { getEditorialConnections } from "@/lib/editorial-connections";
import { BLOG_ARTICLES, getBlogArticle } from "@/lib/editorial-content";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ article: string }> };

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ article: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getBlogArticle((await params).article);
  return article ? marketingMetadata({
    title: article.metaTitle,
    description: article.metaDescription,
    path: `/blog/${article.slug}`,
    keywords: article.keywords,
    type: "article",
    publishedTime: article.published,
    modifiedTime: article.updated,
  }) : {};
}

export default async function BlogArticlePage({ params }: Props) {
  const article = getBlogArticle((await params).article);
  if (!article) notFound();
  const path = `/blog/${article.slug}`;
  const connections = getEditorialConnections(article.slug);

  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path, name: article.title, description: article.metaDescription, datePublished: article.published, dateModified: article.updated }),
        articleJsonLd({ path, headline: article.title, description: article.metaDescription, datePublished: article.published, dateModified: article.updated }),
        faqPageJsonLd(article.faqs, path),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: article.title, path }]),
      ])} />
      <article>
        <header className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-16 sm:pt-32">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog", href: "/blog" }, { name: article.title, href: path }]} />
          <div className="mx-auto mt-8 max-w-4xl px-6 text-center">
            <p className="text-xs font-medium uppercase text-amber-700">Raltic field guide</p>
            <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.08] text-zinc-900 sm:text-6xl">{article.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-relaxed text-zinc-600">{article.dek}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-500">
              <span>By Raltic Research</span>
              <span>Published {article.published}</span>
              <span>Updated {article.updated}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" />{article.readTime}</span>
            </div>
          </div>
        </header>

        <ContentRouteMap
          eyebrow="Reading path"
          title="Move from the definition to the operating decision without losing the thread."
          items={article.sections.map((section) => ({ label: section.title, href: `#${section.id}` }))}
          emphasis="attention"
        />

        <div className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[240px_minmax(0,760px)] lg:justify-center">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-medium uppercase text-zinc-500">In this guide</p>
              <nav aria-label="Table of contents" className="mt-4 grid gap-3">
                {article.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="text-sm leading-snug text-zinc-600 hover:text-amber-700">{section.title}</a>)}
              </nav>
            </aside>
            <div className="min-w-0">
              <section className="border-s-2 border-amber-400 bg-amber-50 px-6 py-6">
                <p className="text-xs font-medium uppercase text-amber-800">Direct answer</p>
                <p className="mt-3 text-lg leading-relaxed text-zinc-800">{article.directAnswer}</p>
              </section>
              {article.sections.map((section, index) => {
                const connection = connections[index % Math.max(connections.length, 1)];
                return (
                  <section id={section.id} key={section.id} className="scroll-mt-28 border-b border-zinc-200 py-12">
                    <span className="font-mono text-[11px] text-amber-700">{String(index + 1).padStart(2, "0")}</span>
                    <h2 className="mt-3 text-3xl font-medium leading-tight text-zinc-900">{section.title}</h2>
                    <p className="mt-4 text-lg font-medium leading-relaxed text-zinc-800">{section.answer}</p>
                    {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-zinc-600">{paragraph}</p>)}
                    {section.bullets && <EvidenceBoard title="Working signals" items={section.bullets} emphasis={index % 2 === 0 ? "attention" : "reference"} />}
                    {connection && <ContextLink {...connection} emphasis={index % 2 === 0 ? "attention" : "reference"} />}
                  </section>
                );
              })}
              <section className="py-12">
                <h2 className="text-2xl font-medium text-zinc-900">Primary sources</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">Product and practice claims in this guide are grounded in current first-party or standards sources. Raltic product claims are limited to shipped behavior described on this site.</p>
                <ul className="mt-5 grid gap-3">
                  {article.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 text-sm font-medium text-blue-700 underline underline-offset-4 hover:text-blue-900">{source.publisher}: {source.label}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /></a></li>)}
                </ul>
              </section>
            </div>
          </div>
        </div>

        <section id="faq" className="border-y border-black/[0.07] bg-[#fafaf8] px-6 py-20">
          <div className="mx-auto max-w-4xl"><p className="text-xs font-medium uppercase text-amber-700">FAQ</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Questions about this guide.</h2><MarketingFaqList idPrefix={`blog-${article.slug}`} items={article.faqs} theme="light" /></div>
        </section>
        <section className="bg-white px-6 py-14">
          <div className="mx-auto max-w-5xl"><h2 className="text-xl font-medium text-zinc-900">Related reading</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{article.related.map((link) => <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 text-sm font-medium text-zinc-800 hover:border-amber-300 hover:text-amber-700">{link.label}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>)}</div></div>
        </section>
      </article>
      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Turn the guide into a real room.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Choose one workflow, collect the proof, and keep the decision human-owned.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`blog_${article.slug}_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
