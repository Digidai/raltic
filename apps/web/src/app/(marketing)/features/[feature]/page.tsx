import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { ContentRouteMap } from "@/components/marketing/content-visuals";
import { FEATURE_PAGES, getFeaturePage } from "@/lib/growth-content";
import { SITE_CONTENT_UPDATED, breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ feature: string }> };

export function generateStaticParams() { return FEATURE_PAGES.map((page) => ({ feature: page.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getFeaturePage((await params).feature);
  return page ? marketingMetadata({ title: page.metaTitle, description: page.metaDescription, path: `/features/${page.slug}`, keywords: page.keywords }) : {};
}

export default async function FeatureDetailPage({ params }: Props) {
  const page = getFeaturePage((await params).feature);
  if (!page) notFound();
  const path = `/features/${page.slug}`;
  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path, name: page.metaTitle, description: page.metaDescription, dateModified: SITE_CONTENT_UPDATED }),
        faqPageJsonLd(page.faqs, path),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }, { name: page.name, path }]),
      ])} />
      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features", href: "/features" }, { name: page.name, href: path }]} />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <p className="text-xs font-medium uppercase text-blue-700">{page.eyebrow}</p>
          <h1 className="mt-5 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">{page.h1}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">{page.intro}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`feature_${page.slug}_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton><MarketingButton href="/workflows" variant="secondary" ctaTarget={`feature_${page.slug}_workflows`}>See workflows</MarketingButton></div>
        </div>
      </section>

      <ContentRouteMap eyebrow="Operating path" title="The feature becomes useful when the brief, work, review, and decision stay connected." items={page.steps.map((step, index) => ({ label: step.title, href: `#step-${index + 1}` }))} emphasis="reference" />

      <section className="bg-white px-6 py-20 sm:py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-medium uppercase text-blue-700">Outcome</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">What changes for the team.</h2><p className="mt-5 text-base leading-relaxed text-zinc-600">{page.outcome}</p></div><div className="grid gap-4 sm:grid-cols-2">{page.capabilities.map((item) => <div key={item.title} className="rounded-lg border border-zinc-200 bg-zinc-50 p-5"><h3 className="font-medium text-zinc-900">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{item.body}</p></div>)}</div></div></div></section>

      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20"><div className="mx-auto max-w-5xl"><p className="text-center text-xs font-medium uppercase text-blue-700">Operating path</p><h2 className="mt-4 text-center text-3xl font-medium text-zinc-900 sm:text-4xl">From brief to reviewed outcome.</h2><ol className="mt-10 grid gap-4 md:grid-cols-2">{page.steps.map((step, index) => <li id={`step-${index + 1}`} key={step.title} className="rounded-lg border border-zinc-200 bg-white p-5"><span className="font-mono text-xs text-blue-700">0{index + 1}</span><h3 className="mt-3 font-medium text-zinc-900">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p></li>)}</ol></div></section>

      <section className="bg-white px-6 py-20"><div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><ShieldCheck className="h-6 w-6 text-blue-700" aria-hidden="true" /><h2 className="mt-4 text-3xl font-medium text-zinc-900">Current boundaries.</h2><p className="mt-4 text-sm leading-relaxed text-zinc-600">These statements describe the shipped product without turning workflow visibility into a broader security or automation claim.</p></div><div className="grid gap-4">{page.boundaries.map((boundary) => <div key={boundary} className="flex gap-3 border-b border-zinc-200 pb-4"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" /><p className="text-sm leading-relaxed text-zinc-600">{boundary}</p></div>)}</div></div></section>

      <section id="faq" className="border-t border-black/[0.07] bg-[#fafaf8] px-6 py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-medium uppercase text-blue-700">FAQ</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">{page.name}, answered.</h2><MarketingFaqList idPrefix={`feature-${page.slug}`} items={page.faqs} theme="light" /></div></section>

      <section className="bg-white px-6 py-14"><div className="mx-auto max-w-5xl"><h2 className="text-xl font-medium text-zinc-900">Continue the path</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{page.related.map((link) => <Link key={link.href} href={link.href} className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 text-sm font-medium text-zinc-800 hover:border-blue-300 hover:text-blue-700">{link.label}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Link>)}</div></div></section>

      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Use {page.name.toLowerCase()} in a real workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Start with one bounded process and one human-owned decision.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`feature_${page.slug}_footer_signup`}>Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
