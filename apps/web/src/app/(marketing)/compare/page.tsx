import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Chip } from "@/components/heroui-pro/chip";
import { COMPARISON_PAGES } from "@/lib/comparison-seo";
import {
  SITE_CONTENT_UPDATED,
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: `Raltic Compared: ${COMPARISON_PAGES.length} AI Workflow Alternatives`,
  description:
    `Evidence-linked comparisons of Raltic with ${COMPARISON_PAGES.length} AI assistants, frameworks, workspaces, cloud platforms, and automation tools, including where each product is the better fit.`,
  path: "/compare",
  keywords: [
    "AI workflow platform comparison",
    "ChatGPT Business alternative",
    "Cursor alternative for teams",
    "Slack AI bot alternative",
  ],
});

export default function CompareIndexPage(): React.ReactElement {
  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path: "/compare",
            name: "Raltic compared to AI assistants, workspaces, and automation tools",
            description:
              `Evidence-linked comparisons of Raltic against ${COMPARISON_PAGES.length} AI assistants, frameworks, workspaces, cloud platforms, and automation tools.`,
            type: "CollectionPage",
            dateModified: SITE_CONTENT_UPDATED,
            mainEntity: { "@id": `${absoluteUrl("/compare")}#itemlist` },
          }),
          itemListJsonLd({
            path: "/compare",
            name: "Raltic comparisons",
            items: COMPARISON_PAGES.map((p) => ({
              name: `Raltic vs ${p.competitor}`,
              description: p.metaDescription,
              path: `/compare/${p.slug}`,
            })),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ])}
      />

      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Compare", href: "/compare" }]} />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <Scale className="h-3 w-3 text-[#2563eb]" aria-hidden="true" />
            Comparisons
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            How Raltic compares.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">
            Compare products by operating model: shared context, runtimes, integration depth, run evidence, tasks, and approval boundaries. Every page links to current first-party sources and explains when the other product is the better fit.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMPARISON_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/compare/${p.slug}`}
              className="group rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)] transition-colors hover:border-black/[0.12] hover:bg-[#fafaf8]"
            >
              <Chip size="sm" variant="soft" color="default" className="font-mono text-[10px] uppercase tracking-wider">
                {p.category}
              </Chip>
              <h2 className="mt-4 text-xl font-medium tracking-tight text-zinc-900">Raltic vs {p.competitor}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{p.intro}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#2563eb]">
                Read the comparison <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              The fastest comparison is trying it.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Start one workflow your team already runs and see the difference in minutes. Free during private beta.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup" ctaTarget="compare_index_signup">
                Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}
