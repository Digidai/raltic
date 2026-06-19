import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { WorkflowIntentSaver } from "@/components/marketing/workflow-intent-saver";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { WORKFLOW_SEO_PAGES, getWorkflowSeoPage, type WorkflowSeoPage } from "@/lib/workflow-seo";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

type WorkflowPageProps = {
  params: Promise<{ workflow: string }>;
};

export function generateStaticParams(): Array<{ workflow: string }> {
  return WORKFLOW_SEO_PAGES.map((page) => ({ workflow: page.starter.key }));
}

export async function generateMetadata({ params }: WorkflowPageProps): Promise<Metadata> {
  const { workflow } = await params;
  const page = getWorkflowSeoPage(workflow);
  if (!page) return {};

  return marketingMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: page.path,
    keywords: page.keywords,
  });
}

export default async function WorkflowDetailPage({ params }: WorkflowPageProps): Promise<React.ReactElement> {
  const { workflow } = await params;
  const page = getWorkflowSeoPage(workflow);
  if (!page) notFound();

  return (
    <>
      <WorkflowIntentSaver starterKey={page.starter.key} />
      <JsonLdScript data={workflowJsonLd(page)} />

      <Card
        render={<section className="border-b border-zinc-900 bg-black pt-32 pb-20 sm:pt-40" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-5xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/workflows" className="text-xs font-medium text-zinc-400 underline underline-offset-4 hover:text-white">
              Workflows
            </Link>
            <Chip size="sm" variant="soft" color="default" className="mx-auto mt-5 gap-2">
              <Sparkles className="h-3 w-3 text-cyan-400" aria-hidden="true" />
              {page.eyebrow}
            </Chip>
            <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl">
              {page.h1}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-400">
              {page.intro}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MarketingButton href="/signup" ctaTarget={`workflow_${page.starter.key}_signup`}>
                Start this workflow free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
              <MarketingButton href="/workflows" variant="secondary" ctaTarget={`workflow_${page.starter.key}_browse`}>
                Browse workflows
              </MarketingButton>
            </div>
            <p className="mt-5 text-xs text-zinc-400">
              No credit card · cloud runtime to start · local runtime only when the workflow needs it
            </p>
          </div>

          <div className="mt-14 grid gap-3 md:grid-cols-3">
            <HeroFact label="Best for" value={page.audience} />
            <HeroFact label="First proof" value={page.proofLabel} />
            <HeroFact label="Approval gate" value={page.starter.gate} />
          </div>
        </CardPanel>
      </Card>

      <Card
        render={<section className="bg-white text-zinc-900" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                Search intent answered
              </p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-4xl">
                {page.searchIntent}
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-zinc-600">
                The workflow starts with one room, one starter brief, one visible agent participant, and one review gate. It is designed for trial users to see useful proof before they add more agents or connect private local runtimes.
              </p>
            </div>
            <div className="grid gap-3">
              {page.steps.map((step) => (
                <div key={step.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                  <Chip size="sm" variant="soft" color="default" className="font-mono text-[10px] uppercase tracking-wider">
                    {step.label}
                  </Chip>
                  <h3 className="mt-3 text-lg font-medium tracking-tight text-zinc-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </CardPanel>
      </Card>

      <Card
        render={<section className="border-y border-zinc-900 bg-black" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-cyan-300">
                Proof path
              </p>
              <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-white sm:text-4xl">
                What the first trial should prove.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Raltic does not ask new users to build an automation before they see value. The first trial should produce a visible artifact, a human approval point, and a room the team can return to.
              </p>
            </div>
            <div className="grid gap-3">
              {page.proofPoints.map((point) => (
                <div key={point} className="flex gap-3 rounded-lg border border-zinc-900 bg-zinc-950 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
                  <p className="text-sm leading-relaxed text-zinc-300">{point}</p>
                </div>
              ))}
              <div className="flex gap-3 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-zinc-300">
                  Approval boundary: {page.starter.gate}
                </p>
              </div>
            </div>
          </div>
        </CardPanel>
      </Card>

      <Card
        render={<section id="faq" className="bg-white text-zinc-900" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-500">FAQ</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.01em] text-zinc-900 sm:text-4xl">
            Questions before starting this workflow.
          </h2>
          <MarketingFaqList
            idPrefix={`workflow-${page.starter.key}`}
            items={page.faqs}
            theme="light"
          />
        </CardPanel>
      </Card>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-[var(--snow)] sm:text-4xl">
              Try {page.starter.title.toLowerCase()} in a real workflow room.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[color-mix(in_srgb,var(--snow)_66%,transparent)]">
              The starter will be selected when you enter your workspace, so the first trial begins from this exact workflow intent.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup" ctaTarget={`workflow_${page.starter.key}_footer_signup`}>
                Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-4 text-center">
      <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="mt-2 block text-sm font-medium leading-relaxed text-zinc-200">{value}</span>
    </div>
  );
}

function workflowJsonLd(page: WorkflowSeoPage): Record<string, unknown> {
  return jsonLdGraph([
    webPageJsonLd({
      path: page.path,
      name: page.metaTitle,
      description: page.metaDescription,
      primaryEntity: {
        "@type": "HowTo",
        name: page.h1,
        description: page.intro,
        step: page.steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.body,
        })),
      },
    }),
    faqPageJsonLd(page.faqs, page.path),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Workflows", path: "/workflows" },
      { name: page.starter.title, path: page.path },
    ]),
  ]);
}
