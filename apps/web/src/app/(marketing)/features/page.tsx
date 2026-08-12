import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Blocks, CheckCircle2 } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { FEATURE_PAGES } from "@/lib/growth-content";
import { SITE_CONTENT_UPDATED, absoluteUrl, breadcrumbJsonLd, itemListJsonLd, jsonLdGraph, marketingMetadata, webPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "Raltic Features: AI Agent Workflow Operations",
  description: "Explore workflow rooms, human review, local and cloud agents, run observability, tasks, and handoffs for accountable AI agent work.",
  path: "/features",
  keywords: ["AI agent workflow platform", "agent orchestration features", "human in the loop AI", "AI workflow workspace"],
});

export default function FeaturesPage() {
  return (
    <>
      <JsonLdScript data={jsonLdGraph([
        webPageJsonLd({ path: "/features", name: "Raltic AI agent workflow features", description: metadata.description as string, type: "CollectionPage", dateModified: SITE_CONTENT_UPDATED, mainEntity: { "@id": `${absoluteUrl("/features")}#itemlist` } }),
        itemListJsonLd({ path: "/features", name: "Raltic features", items: FEATURE_PAGES.map((page) => ({ name: page.name, description: page.metaDescription, path: `/features/${page.slug}` })) }),
        breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Features", path: "/features" }]),
      ])} />

      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Features", href: "/features" }]} />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700"><Blocks className="h-5 w-5" aria-hidden="true" /></div>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] text-zinc-900 sm:text-6xl">The operating layer around agent work.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">Raltic connects the pieces that separate a useful agent demo from a repeatable team workflow: shared context, bounded runtimes, visible execution, human review, tasks, and reusable decisions.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingButton href="/signup?workflow=launch-readiness" ctaTarget="features_signup">Start a workflow <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton>
            <MarketingButton href="/workflows" variant="secondary" ctaTarget="features_workflows">Browse workflows</MarketingButton>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_PAGES.map((page) => (
              <Link key={page.slug} href={`/features/${page.slug}`} className="group rounded-lg border border-black/[0.08] bg-white p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/40">
                <p className="text-xs font-medium uppercase text-blue-700">{page.eyebrow}</p>
                <h2 className="mt-3 text-xl font-medium text-zinc-900">{page.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{page.metaDescription}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700">Explore the feature <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div><p className="text-xs font-medium uppercase text-blue-700">Product boundary</p><h2 className="mt-4 text-3xl font-medium text-zinc-900 sm:text-4xl">Coordination without false autonomy.</h2></div>
          <div className="grid gap-4">
            {["A completed agent run remains separate from a human-approved decision.", "Local repository access and model-provider processing are described as separate data paths.", "Connector credentials are encrypted and granted per agent; access is not assumed.", "Raltic coordinates review, while sensitive external systems retain their own authorization controls."].map((item) => <div key={item} className="flex gap-3 border-b border-zinc-200 pb-4"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" /><p className="text-sm leading-relaxed text-zinc-600">{item}</p></div>)}
          </div>
        </div>
      </section>

      <MarketingFooter lead={<div className="mx-auto max-w-3xl text-center"><h2 className="text-balance text-3xl font-medium text-zinc-900 sm:text-4xl">Prove one workflow before scaling the agent roster.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">Private beta is free. Bring your own provider subscription for bridge runtimes.</p><div className="mt-7 flex justify-center"><MarketingButton href="/signup?workflow=launch-readiness" ctaTarget="features_footer_signup">Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" /></MarketingButton></div></div>} />
    </>
  );
}
