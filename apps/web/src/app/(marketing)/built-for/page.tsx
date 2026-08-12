import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { AUDIENCE_PAGES } from "@/lib/growth-content";
import { SITE_CONTENT_UPDATED, absoluteUrl, breadcrumbJsonLd, itemListJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Raltic for Product, Engineering, GTM & Research Teams",
  description: "See how product, engineering, founder, GTM, research, and AI-native teams use shared agent workflows with human-owned decisions.",
  path: "/built-for",
  keywords: ["AI agents for teams", "AI workflow use cases", "agent orchestration teams", "AI native operations"],
});

export default function BuiltForPage() {
  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path: "/built-for", name: "Who Raltic is built for", description: metadata.description as string, type: "CollectionPage", dateModified: SITE_CONTENT_UPDATED, mainEntity: { "@id": `${absoluteUrl("/built-for")}#itemlist` } }),
        itemListJsonLd({ path: "/built-for", name: "Raltic audiences", items: AUDIENCE_PAGES.map((page) => ({ name: page.audience, description: page.metaDescription, path: `/built-for/${page.slug}` })) }),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Built for", path: "/built-for" }]),
      ])} />
      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Built for", href: "/built-for" }]} />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700"><Users className="h-5 w-5" aria-hidden="true" /></div>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">Built for teams that own the outcome.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">Agents can accelerate evidence work. Product judgment, engineering acceptance, customer action, and business decisions still need accountable people. Raltic gives each team a workflow room for both.</p>
          <div className="mt-8 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget="built_for_signup">Start one workflow <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div>
        </div>
      </section>
      <section className="bg-white px-6 py-20 sm:py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{AUDIENCE_PAGES.map((page) => <Link key={page.slug} href={`/built-for/${page.slug}`} className="group rounded-lg border border-black/[0.08] bg-white p-6 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"><p className="text-xs font-medium uppercase text-emerald-700">Built for</p><h2 className="mt-3 text-xl font-medium text-zinc-900">{page.audience}</h2><p className="mt-3 text-sm leading-relaxed text-zinc-600">{page.metaDescription}</p><p className="mt-5 border-t border-zinc-200 pt-4 text-sm leading-relaxed text-zinc-700"><strong className="font-medium">First value:</strong> {page.firstValue}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">See the operating model <ArrowRight className="h-4 w-4" aria-hidden="true" /></span></Link>)}</div></div></section>
      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20"><div className="mx-auto max-w-5xl text-center"><p className="text-xs font-medium uppercase text-emerald-700">One GTM path</p><h2 className="mx-auto mt-4 max-w-3xl text-3xl font-medium text-zinc-900 sm:text-4xl">Enter through a real problem, reach a reviewable result, then expand.</h2><div className="mt-10 grid gap-4 text-left md:grid-cols-3">{[{t:"Choose",b:"Start from a role-specific process with a named owner."},{t:"Prove",b:"Reach one artifact, evidence packet, and human review point."},{t:"Reuse",b:"Keep the room and decision available for the next run."}].map((step, index) => <div key={step.t} className="rounded-lg border border-zinc-200 bg-white p-5"><span className="font-mono text-xs text-emerald-700">0{index + 1}</span><h3 className="mt-3 font-medium text-zinc-900">{step.t}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.b}</p></div>)}</div></div></section>
      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Start with the workflow your team already owns.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">No credit card during private beta. Provider subscriptions remain direct.</p><div className="mt-7 flex justify-center"><MarketingButton href="/workflows" ctaTarget="built_for_footer_workflows">Browse workflow starters <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
