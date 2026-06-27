import type { Metadata } from "next";
import type React from "react";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, GitBranch, Layers, FileText, Sparkles } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import {
  CONNECTOR_NOT_SHIPPED,
  CONNECTOR_PAGES,
  CONNECTOR_SETUP_STEPS,
  getConnectorPage,
} from "@/lib/connector-seo";
import {
  SITE_CONTENT_UPDATED,
  absoluteUrl,
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

type Props = { params: Promise<{ connector: string }> };

const ICONS = {
  github: GitBranch,
  linear: Layers,
  notion: FileText,
} as const;

export function generateStaticParams(): Array<{ connector: string }> {
  return CONNECTOR_PAGES.map((p) => ({ connector: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { connector } = await params;
  const page = getConnectorPage(connector);
  if (!page) return {};
  return marketingMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/connectors/${page.slug}`,
    keywords: page.keywords,
  });
}

export default async function ConnectorDetailPage({ params }: Props): Promise<React.ReactElement> {
  const { connector } = await params;
  const page = getConnectorPage(connector);
  if (!page) notFound();
  const path = `/connectors/${page.slug}`;
  const Icon = ICONS[page.icon];

  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path,
            name: page.metaTitle,
            description: page.metaDescription,
            dateModified: SITE_CONTENT_UPDATED,
            mainEntity: {
              "@type": "HowTo",
              "@id": `${absoluteUrl(path)}#howto`,
              name: `How to connect ${page.name} to a Raltic agent`,
              description: `Grant a Raltic agent scoped ${page.name} access with a per-agent token.`,
              inLanguage: "en-US",
              mainEntityOfPage: { "@id": `${absoluteUrl(path)}#webpage` },
              step: CONNECTOR_SETUP_STEPS.map((step, i) => ({
                "@type": "HowToStep",
                "@id": `${absoluteUrl(path)}#step-${i + 1}`,
                url: `${absoluteUrl(path)}#step-${i + 1}`,
                position: i + 1,
                name: step.title,
                text: step.text,
              })),
            },
          }),
          faqPageJsonLd(page.faqs, path),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Connectors", path: "/connectors" },
            { name: page.name, path },
          ]),
        ])}
      />

      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Connectors", href: "/connectors" },
            { name: page.name, href: path },
          ]}
        />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4e4ff] bg-[#eef4ff] text-[#2563eb]">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            {page.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">
            {page.intro}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingButton href="/signup" ctaTarget={`connector_${page.slug}_signup`}>
              Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </MarketingButton>
            <MarketingButton href="/connectors" variant="secondary" ctaTarget={`connector_${page.slug}_browse`}>
              All connectors
            </MarketingButton>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-[#2563eb]">What agents can do</p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-4xl">
                {page.name} access, scoped per agent.
              </h2>
              <div className="mt-6 grid gap-3">
                {page.capabilities.map((cap) => (
                  <div key={cap} className="flex gap-3 rounded-xl border border-black/[0.07] bg-[#fafaf8] p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden="true" />
                    <p className="text-sm leading-relaxed text-zinc-600">{cap}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3 rounded-xl border border-[#d4e4ff] bg-[#eef4ff] p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-zinc-700"><span className="font-medium text-zinc-900">Good first workflow:</span> {page.goodFirstWorkflow}</p>
              </div>
            </div>
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-500">Setup</p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-4xl">
                How to connect {page.name}.
              </h2>
              <ol className="mt-6 grid gap-3">
                {CONNECTOR_SETUP_STEPS.map((step, i) => (
                  <li id={`step-${i + 1}`} key={i} className="flex gap-3 rounded-xl border border-black/[0.07] bg-white p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[12px] font-semibold text-[#2563eb]">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Card className="mt-4 border-[#f0d9b5] bg-[#fdf2e1]">
                <CardPanel className="px-4 py-3 text-[12px] text-[#92560f]">
                  <strong className="text-[#7a4708]">What&apos;s not shipped yet:</strong> {CONNECTOR_NOT_SHIPPED}
                </CardPanel>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-t border-black/[0.07] bg-[#faf9f6] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-500">FAQ</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-4xl">
            {page.name} connector questions.
          </h2>
          <div className="mx-auto max-w-3xl">
            <MarketingFaqList idPrefix={`connector-${page.slug}`} items={page.faqs} theme="light" />
          </div>
        </div>
      </section>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              Wire {page.name} into a workflow room.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Free during private beta. Store a token once, grant the agents that need it, and keep the work accountable.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup" ctaTarget={`connector_${page.slug}_footer_signup`}>
                Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}
