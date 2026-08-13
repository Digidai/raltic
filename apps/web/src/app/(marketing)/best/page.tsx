import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ListChecks, Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { BUYER_GUIDES } from "@/lib/buyer-guide-content";
import { SITE_CONTENT_UPDATED, absoluteUrl, breadcrumbJsonLd, itemListJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Best AI Agent Platforms for 2026: Buyer's Guides",
  description: "Evidence-linked 2026 buyer's guides to AI agent orchestration, human-in-the-loop review, and team workflow platforms, organized by the job each product handles best.",
  path: "/best",
  keywords: ["best AI agent platforms 2026", "AI agent software comparison", "AI orchestration buyer guide", "human in the loop platforms"],
});

const PRINCIPLES = [
  "No fabricated star ratings or hidden aggregate score",
  "Every external capability links to official documentation",
  "Each product is recommended for a named job",
  "Raltic's authorship and product interest are disclosed",
];

export default function BuyerGuideIndexPage() {
  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path: "/best", name: "Raltic AI agent platform buyer's guides", description: metadata.description as string, type: "CollectionPage", dateModified: SITE_CONTENT_UPDATED, mainEntity: { "@id": `${absoluteUrl("/best")}#itemlist` } }),
        itemListJsonLd({ path: "/best", name: "AI agent platform buyer's guides", items: BUYER_GUIDES.map((guide) => ({ name: guide.title, description: guide.metaDescription, path: `/best/${guide.slug}` })) }),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Best platforms", path: "/best" }]),
      ])} />

      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Best platforms", href: "/best" }]} />
        <div className="mx-auto mt-8 max-w-4xl px-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">The best AI agent platforms, matched to the job.</h1>
          <p className="mx-auto mt-6 max-w-3xl text-balance text-lg leading-relaxed text-zinc-600">Frameworks, automation builders, cloud control planes, work suites, and workflow rooms should not share one mystery score. These guides separate the layers and show where each product is the better fit.</p>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-3">
            {BUYER_GUIDES.map((guide, index) => (
              <Link key={guide.slug} href={`/best/${guide.slug}`} className="group flex min-h-80 flex-col rounded-lg border border-zinc-200 bg-white p-7 transition-colors hover:border-rose-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-xs text-rose-700">0{index + 1}</span>
                  <span className="text-xs text-zinc-500">{guide.readTime}</span>
                </div>
                <h2 className="mt-7 text-2xl font-medium leading-snug text-zinc-900">{guide.title}</h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">{guide.dek}</p>
                <div className="mt-auto pt-7">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-700">Open the guide <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-[#faf9f6] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-rose-700"><ListChecks className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-medium uppercase">Editorial method</span></div>
            <h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Useful shortlists need visible rules.</h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-600">Raltic is a product covered by these guides, so the conflict is stated rather than hidden. The guide links to current first-party sources and says when another product is the better choice.</p>
          </div>
          <ul className="border-t border-zinc-300">
            {PRINCIPLES.map((principle) => (
              <li key={principle} className="flex gap-3 border-b border-zinc-300 py-5 text-sm leading-relaxed text-zinc-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />{principle}</li>
            ))}
          </ul>
        </div>
      </section>

      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Use the shortlist on one real workflow.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">A normal run, a failure, and a reviewer correction reveal more than a demo.</p><div className="mt-7 flex justify-center"><MarketingButton href="/blog/how-to-evaluate-ai-agent-platforms" ctaTarget="best_index_evaluation">Open the evaluation guide <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
