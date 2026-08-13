import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { ContentRouteMap } from "@/components/marketing/content-visuals";
import { AUDIENCE_PAGES, getAudiencePage } from "@/lib/growth-content";
import { SITE_CONTENT_UPDATED, breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ audience: string }> };
export function generateStaticParams() { return AUDIENCE_PAGES.map((page) => ({ audience: page.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const page = getAudiencePage((await params).audience); return page ? marketingMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/built-for/${page.slug}`, keywords: page.keywords }) : {}; }

export default async function AudienceDetailPage({ params }: Props) {
  const page = getAudiencePage((await params).audience); if (!page) notFound(); const path = `/built-for/${page.slug}`;
  return (
    <>
      <JsonLdScript data={jsonLdGraph([webPageJsonLd({ path, name: page.metaTitle, description: page.metaDescription, dateModified: SITE_CONTENT_UPDATED }), faqPageJsonLd(page.faqs, path), breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Built for", path: "/built-for" }, { name: page.audience, path }])])} />
      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32"><Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Built for", href: "/built-for" }, { name: page.audience, href: path }]} /><div className="mx-auto mt-8 max-w-3xl px-6 text-center"><p className="text-xs font-medium uppercase text-emerald-700">Raltic for {page.audience}</p><h1 className="mt-5 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">{page.h1}</h1><p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">{page.intro}</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`audience_${page.slug}_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton><MarketingButton href="/workflows" variant="secondary" ctaTarget={`audience_${page.slug}_workflows`}>Choose a workflow</MarketingButton></div></div></section>

      <ContentRouteMap eyebrow="First-value map" title="Start from a concrete team problem and finish with proof a named owner can review." items={page.useCases.map((useCase, index) => ({ label: useCase.title, href: `#use-case-${index + 1}` }))} emphasis="evidence" />

      <section className="bg-white px-6 py-20"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-medium uppercase text-emerald-700">Why now</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Where agent work breaks down.</h2></div><div className="grid gap-4">{page.pains.map((pain) => <div key={pain} className="flex gap-3 border-b border-zinc-200 pb-4"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" /><p className="text-base leading-relaxed text-zinc-700">{pain}</p></div>)}</div></div></section>

      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20"><div className="mx-auto max-w-6xl"><p className="text-center text-xs font-medium uppercase text-emerald-700">Use cases</p><h2 className="mt-4 text-center text-3xl font-medium text-zinc-900 sm:text-4xl">Workflows with a visible first proof.</h2><div className="mt-10 grid gap-4 md:grid-cols-3">{page.useCases.map((useCase, index) => <article id={`use-case-${index + 1}`} key={useCase.title} className="scroll-mt-28 rounded-lg border border-zinc-200 bg-white p-6"><h3 className="text-lg font-medium text-zinc-900">{useCase.title}</h3><p className="mt-3 text-sm leading-relaxed text-zinc-600">{useCase.body}</p><div className="mt-5 border-t border-zinc-200 pt-4"><p className="text-xs font-medium uppercase text-emerald-700">Reviewable proof</p><p className="mt-2 text-sm leading-relaxed text-zinc-700">{useCase.proof}</p></div></article>)}</div></div></section>

      <section className="bg-white px-6 py-20"><div className="mx-auto max-w-5xl"><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 sm:p-8"><p className="text-xs font-medium uppercase text-emerald-700">First-value path</p><p className="mt-3 text-lg leading-relaxed text-zinc-800">{page.firstValue}</p></div><ol className="mt-10 grid gap-5 md:grid-cols-3">{page.operatingModel.map((step, index) => <li key={step.title}><span className="font-mono text-xs text-emerald-700">0{index + 1}</span><h3 className="mt-3 font-medium text-zinc-900">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p></li>)}</ol></div></section>

      <section id="faq" className="border-y border-black/[0.07] bg-[#fafaf8] px-6 py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-medium uppercase text-emerald-700">FAQ</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Questions from {page.audience.toLowerCase()}.</h2><MarketingFaqList idPrefix={`audience-${page.slug}`} items={page.faqs} theme="light" /></div></section>
      <section className="bg-white px-6 py-14"><div className="mx-auto max-w-5xl"><h2 className="text-xl font-medium text-zinc-900">Continue the path</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{page.related.map((link) => <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 text-sm font-medium text-zinc-800 hover:border-emerald-300 hover:text-emerald-700">{link.label}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>)}</div></div></section>
      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Give {page.audience.toLowerCase()} one accountable agent workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Start with one useful artifact and one human-owned decision.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`audience_${page.slug}_footer_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
