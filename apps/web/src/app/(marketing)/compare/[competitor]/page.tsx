import type { Metadata } from "next";
import type React from "react";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ExternalLink, Minus, X, Scale, ThumbsUp } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Chip } from "@/components/heroui-pro/chip";
import { COMPARISON_PAGES, getComparisonPage, type Verdict } from "@/lib/comparison-seo";
import {
  SITE_CONTENT_UPDATED,
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

type Props = { params: Promise<{ competitor: string }> };

export function generateStaticParams(): Array<{ competitor: string }> {
  return COMPARISON_PAGES.map((p) => ({ competitor: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const page = getComparisonPage(competitor);
  if (!page) return {};
  return marketingMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/compare/${page.slug}`,
    keywords: page.keywords,
  });
}

export default async function ComparePage({ params }: Props): Promise<React.ReactElement> {
  const { competitor } = await params;
  const page = getComparisonPage(competitor);
  if (!page) notFound();
  const path = `/compare/${page.slug}`;

  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path,
            name: page.metaTitle,
            description: page.metaDescription,
            dateModified: SITE_CONTENT_UPDATED,
          }),
          faqPageJsonLd(page.faqs, path),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            { name: `vs ${page.competitor}`, path },
          ]),
        ])}
      />

      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Compare", href: "/compare" },
            { name: `vs ${page.competitor}`, href: path },
          ]}
        />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <Scale className="h-3 w-3 text-[#2563eb]" aria-hidden="true" />
            {page.eyebrow}
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            {page.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`compare_${page.slug}_signup`}>
              Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </MarketingButton>
            <MarketingButton href="/compare" variant="secondary" ctaTarget={`compare_${page.slug}_browse`}>
              See all comparisons
            </MarketingButton>
          </div>
        </div>
      </section>

      {/* Verdict table */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-[12px] font-medium uppercase tracking-[0.16em] text-[#2563eb]">
            Side by side
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-medium leading-tight tracking-[-0.01em] text-zinc-900 sm:text-4xl">
            What you need from agent-assisted work.
          </h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/[0.07] text-[11px] uppercase tracking-wider text-zinc-500">
                    <th scope="col" className="px-6 py-4 font-medium">What you actually need</th>
                    <th scope="col" className="px-4 py-4 text-center font-medium">{page.competitor}</th>
                    <th scope="col" className="px-4 py-4 text-center font-medium" style={{ backgroundColor: "#eef4ff", color: "#2563eb" }}>Raltic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] text-zinc-600">
                  {page.rows.map((row) => (
                    <tr key={row.need}>
                      <th scope="row" className="px-6 py-4 text-left font-normal text-zinc-900">{row.need}</th>
                      <td className="px-4 py-4 text-center"><VerdictCell value={row.them} /></td>
                      <td className="px-4 py-4 text-center" style={{ backgroundColor: "rgba(37,99,235,0.05)" }}><VerdictCell value={row.raltic} highlight /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-zinc-500">
            Capability-fit review updated August 13, 2026. &quot;Partial&quot; means the capability exists but is not the product&apos;s primary workflow model. Tell us at <span className="text-zinc-800">hello@raltic.com</span> if a source has changed.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
            {page.sourceLinks.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
              >
                {source.label}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Where they stop + when they're better */}
      <section className="border-y border-black/[0.07] bg-[#faf9f6] px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-3xl">
              Different center of gravity.
            </h2>
            <div className="mt-6 grid gap-3">
              {page.whereTheyStop.map((point) => (
                <div key={point} className="flex gap-3 rounded-xl border border-black/[0.07] bg-white p-4">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-zinc-600">{point}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-3xl">
              When {page.competitor} is the better choice.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Raltic is not for everything. Pick {page.competitor} when:
            </p>
            <div className="mt-4 grid gap-3">
              {page.whenThemBetter.map((point) => (
                <div key={point} className="flex gap-3 rounded-xl border border-[#d4e4ff] bg-[#eef4ff] p-4">
                  <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-zinc-700">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-500">FAQ</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-4xl">
            Raltic vs {page.competitor}, answered.
          </h2>
          <div className="mx-auto max-w-3xl">
            <MarketingFaqList idPrefix={`compare-${page.slug}`} items={page.faqs} theme="light" />
          </div>
        </div>
      </section>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              See the difference in a real workflow room.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Start with one workflow your team already runs. Free during private beta — bring your own Claude or OpenAI subscription.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup?workflow=launch-readiness" ctaTarget={`compare_${page.slug}_footer_signup`}>
                Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}

function VerdictCell({ value, highlight }: { value: Verdict; highlight?: boolean }): React.ReactElement {
  if (value === "yes") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
        style={{ backgroundColor: highlight ? "#dbe9ff" : "#eef4ff" }}
        aria-label="Yes"
      >
        <CheckCircle2 className="h-4 w-4" style={{ color: "#2563eb" }} aria-label="Yes" />
      </span>
    );
  }
  if (value === "partial") {
    return (
      <span className="raltic-marketing-status-chip inline-flex h-6 w-6 items-center justify-center rounded-full" aria-label="Partial">
        <Minus className="h-4 w-4" aria-label="Partial" />
      </span>
    );
  }
  return (
    <span className="raltic-marketing-status-chip inline-flex h-6 w-6 items-center justify-center rounded-full opacity-80" aria-label="No">
      <X className="h-4 w-4" aria-label="No" />
    </span>
  );
}
