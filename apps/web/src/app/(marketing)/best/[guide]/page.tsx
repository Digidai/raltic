import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, ExternalLink, Info, Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { ContentRouteMap, EvidenceBoard } from "@/components/marketing/content-visuals";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { BUYER_GUIDES, getBuyerGuide } from "@/lib/buyer-guide-content";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd, itemListJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ guide: string }> };

export function generateStaticParams() { return BUYER_GUIDES.map((guide) => ({ guide: guide.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getBuyerGuide((await params).guide);
  return guide ? marketingMetadata({ title: guide.metaTitle, description: guide.metaDescription, path: `/best/${guide.slug}`, keywords: guide.keywords, type: "article", publishedTime: guide.published, modifiedTime: guide.updated }) : {};
}

export default async function BuyerGuideDetailPage({ params }: Props) {
  const guide = getBuyerGuide((await params).guide);
  if (!guide) notFound();
  const path = `/best/${guide.slug}`;
  const routeItems = [
    { label: "How we chose", href: "#method" },
    { label: "Quick comparison", href: "#comparison" },
    { label: "Detailed picks", href: "#picks" },
    { label: "Make the decision", href: "#decision" },
  ];

  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path, name: guide.title, description: guide.metaDescription, datePublished: guide.published, dateModified: guide.updated }),
        articleJsonLd({ path, headline: guide.title, description: guide.metaDescription, datePublished: guide.published, dateModified: guide.updated }),
        itemListJsonLd({ path, name: guide.title, items: guide.picks.map((pick) => ({ name: pick.name, description: `${pick.bestFor}. ${pick.summary}`, path: pick.comparisonHref ?? pick.source.href })) }),
        faqPageJsonLd(guide.faqs, path),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Best platforms", path: "/best" }, { name: guide.title, path }]),
      ])} />

      <article>
        <header className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-16 sm:pt-32">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Best platforms", href: "/best" }, { name: guide.title, href: path }]} />
          <div className="mx-auto mt-8 max-w-4xl px-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700"><Scale className="h-5 w-5" aria-hidden="true" /></div>
            <p className="mt-5 text-xs font-medium uppercase text-rose-700">{guide.eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.08] text-zinc-900 sm:text-6xl">{guide.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-relaxed text-zinc-600">{guide.dek}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-500"><span>By Raltic Research</span><span>Updated {guide.updated}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" />{guide.readTime}</span></div>
          </div>
        </header>

        <ContentRouteMap eyebrow="Guide map" title="Start with the method, then choose the product layer that matches the work." items={routeItems} tone="violet" />

        <div className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <section className="border-l-2 border-rose-400 bg-rose-50 px-6 py-6">
              <p className="text-xs font-medium uppercase text-rose-800">Direct answer</p>
              <p className="mt-3 text-lg leading-relaxed text-zinc-800">{guide.directAnswer}</p>
            </section>

            <section id="method" className="scroll-mt-28 py-14">
              <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
                <div><p className="text-xs font-medium uppercase text-rose-700">How we chose</p><h2 className="mt-4 text-3xl font-medium text-zinc-900">The method is part of the answer.</h2><p className="mt-4 text-sm leading-relaxed text-zinc-600">Raltic publishes this guide and appears in it. No company paid for inclusion. We checked current official documentation and matched each product to a specific job instead of assigning a universal score.</p></div>
                <EvidenceBoard title="Selection rules" items={guide.method} tone="violet" />
              </div>
            </section>

            <section id="comparison" className="scroll-mt-28 border-t border-zinc-200 py-14">
              <p className="text-xs font-medium uppercase text-rose-700">Quick comparison</p>
              <h2 className="mt-4 text-3xl font-medium text-zinc-900">What each platform is built to do.</h2>
              <div className="mt-8 overflow-x-auto border-y border-zinc-300">
                <table className="min-w-[860px] w-full text-left text-sm">
                  <thead><tr className="border-b border-zinc-300 text-[11px] uppercase text-zinc-500"><th className="px-4 py-4 font-medium">Platform</th><th className="px-4 py-4 font-medium">Product type</th><th className="px-4 py-4 font-medium">Best for</th><th className="px-4 py-4 font-medium">Lift</th><th className="px-4 py-4 font-medium">Review model</th></tr></thead>
                  <tbody className="divide-y divide-zinc-200">
                    {guide.picks.map((pick) => <tr key={pick.name}><th scope="row" className="px-4 py-5 font-medium text-zinc-900">{pick.name}</th><td className="px-4 py-5 text-zinc-600">{pick.category}</td><td className="max-w-64 px-4 py-5 text-zinc-600">{pick.bestFor}</td><td className="px-4 py-5 text-zinc-600">{pick.implementation}</td><td className="max-w-64 px-4 py-5 text-zinc-600">{pick.reviewModel}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="picks" className="scroll-mt-28 border-t border-zinc-200 pt-14">
              <p className="text-xs font-medium uppercase text-rose-700">Detailed picks</p>
              <h2 className="mt-4 text-3xl font-medium text-zinc-900">Choose the native operating model.</h2>
              <div className="mt-8">
                {guide.picks.map((pick, index) => (
                  <section key={pick.name} id={`pick-${index + 1}`} className="scroll-mt-28 border-t border-zinc-200 py-10 first:border-t-0">
                    <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
                      <div><span className="font-mono text-xs text-rose-700">{String(index + 1).padStart(2, "0")}</span><p className="mt-3 text-sm font-medium text-zinc-900">Best for</p><p className="mt-2 text-sm leading-relaxed text-zinc-600">{pick.bestFor}</p></div>
                      <div>
                        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-medium uppercase text-zinc-500">{pick.category}</p><h3 className="mt-2 text-3xl font-medium text-zinc-900">{pick.name}</h3></div>{pick.comparisonHref && <Link href={pick.comparisonHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 underline underline-offset-4">Full comparison <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>}</div>
                        <p className="mt-5 text-base leading-8 text-zinc-600">{pick.summary}</p>
                        <EvidenceBoard title="Where it fits" items={pick.strengths} tone={index % 2 === 0 ? "blue" : "emerald"} />
                        <div className="mt-6 flex gap-3 border-l-2 border-amber-300 bg-amber-50 px-4 py-3"><Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" /><p className="text-sm leading-relaxed text-zinc-700"><span className="font-medium text-zinc-900">Watch for: </span>{pick.watchFor}</p></div>
                        {pick.source.href.startsWith("/") ? <Link href={pick.source.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 underline underline-offset-4">{pick.source.label}<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link> : <a href={pick.source.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 underline underline-offset-4">Official source: {pick.source.label}<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section id="decision" className="scroll-mt-28 border-t border-zinc-200 py-14">
              <p className="text-xs font-medium uppercase text-rose-700">Decision path</p>
              <h2 className="mt-4 text-3xl font-medium text-zinc-900">Turn the shortlist into a real test.</h2>
              <ol className="mt-8 grid border-y border-zinc-300 md:grid-cols-2">
                {guide.decisionSteps.map((step, index) => <li key={step.title} className="border-b border-zinc-300 p-6 md:odd:border-r"><span className="font-mono text-xs text-rose-700">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-3 text-lg font-medium text-zinc-900">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p></li>)}
              </ol>
            </section>
          </div>
        </div>

        <section id="faq" className="border-y border-black/[0.07] bg-[#fafaf8] px-6 py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-medium uppercase text-rose-700">FAQ</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Questions buyers should ask.</h2><MarketingFaqList idPrefix={`best-${guide.slug}`} items={guide.faqs} theme="light" /></div></section>
        <section className="bg-white px-6 py-14"><div className="mx-auto max-w-5xl"><h2 className="text-xl font-medium text-zinc-900">Continue the evaluation</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{guide.related.map((link) => <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 text-sm font-medium text-zinc-800 hover:border-rose-300 hover:text-rose-700">{link.label}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>)}</div></div></section>
      </article>

      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Test the shortlist with one reviewable workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Use the same brief, evidence, failure case, and review standard for every product.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`best_${guide.slug}_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
