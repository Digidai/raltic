import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Route } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { SectionHeader } from "@/components/marketing/section-header";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { WORKFLOW_SEO_PAGES } from "@/lib/workflow-seo";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Agent Workflow Templates",
  description:
    "Explore Raltic workflow rooms for customer risk, launch readiness, research synthesis, and local code review. Start a free beta workflow in minutes.",
  path: "/workflows",
  keywords: [
    "AI agent workflow templates",
    "human in the loop AI workflows",
    "AI workflow rooms",
    "agent workflow platform",
  ],
});

export default function WorkflowsPage(): React.ReactElement {
  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path: "/workflows",
            name: "AI Agent Workflow Templates",
            description:
              "Raltic workflow rooms for customer risk, launch readiness, research synthesis, and local code review.",
            type: "CollectionPage",
            mainEntity: { "@id": `${absoluteUrl("/workflows")}#itemlist` },
          }),
          itemListJsonLd({
            path: "/workflows",
            name: "Raltic workflow templates",
            items: WORKFLOW_SEO_PAGES.map((page) => ({
              name: page.starter.title,
              description: page.metaDescription,
              path: page.path,
            })),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Workflows", path: "/workflows" },
          ]),
        ])}
      />

      <Card
        render={<section className="border-b border-black/[0.07] bg-[#fafaf8] pt-32 pb-20 sm:pt-40" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-5xl px-6 text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <Route className="h-3 w-3 text-[#2563eb]" aria-hidden="true" />
            Workflow templates
          </Chip>
          <h1 className="mx-auto mt-7 max-w-4xl text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            AI agent workflows your team can start today.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-500">
            Raltic is an AI agent workflow platform where humans and agents share one accountable room.
            Start from a concrete business process, review the first proof, and turn the result into reusable team memory.
          </p>
          <div className="mt-8 flex justify-center">
            <MarketingButton href="/signup" ctaTarget="workflows_index_signup">
              Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </MarketingButton>
          </div>
        </CardPanel>
      </Card>

      <Card
        render={<section className="bg-white text-zinc-900" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <SectionHeader
            dark={false}
            eyebrow="Choose by outcome"
            title={<>Turn one repeated process into a workflow room.</>}
            description="Each template maps to Raltic's first-value path: pick the workflow, send the starter brief, review the proof, and keep the approval boundary visible."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {WORKFLOW_SEO_PAGES.map((page) => (
              <Link
                key={page.starter.key}
                href={page.path}
                className="group rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)] transition-colors hover:border-black/[0.12] hover:bg-[#fafaf8]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Chip size="sm" variant="soft" color="default" className="font-mono text-[10px] uppercase tracking-wider">
                      {page.eyebrow}
                    </Chip>
                    <h2 className="mt-4 text-2xl font-medium tracking-tight text-zinc-900 break-words">{page.starter.title}</h2>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-900" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{page.starter.description}</p>
                <div className="mt-5 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                  <WorkflowFact label="Best for" value={page.audience} />
                  <WorkflowFact label="First proof" value={page.proofLabel} />
                </div>
              </Link>
            ))}
          </div>
        </CardPanel>
      </Card>

      <Card
        render={<section className="border-y border-black/[0.07] bg-[#faf9f6]" />}
        className="w-full rounded-none border-0 shadow-none"
      >
        <CardPanel className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeader
            dark
            eyebrow="Why workflow pages matter"
            title={<>A workflow is easier to try than a category.</>}
            description="Search visitors usually arrive with a job to finish. Raltic routes them to the matching starter instead of asking them to learn a new product category first."
          />
          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {[
              "Clear first action after signup: pick, send, prove.",
              "Workflow-specific starter copy carries the user's search intent into the room.",
              "Cloud starts immediately; local code review keeps its explicit runtime gate.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
                <CheckCircle2 className="h-4 w-4 text-[#2563eb]" aria-hidden="true" />
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item}</p>
              </div>
            ))}
          </div>
        </CardPanel>
      </Card>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              Start with a workflow your team already owns.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Sign up, pick a starter, send the first brief, and review the proof before the workflow becomes repeatable.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup" ctaTarget="workflows_footer_signup">
                Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}

function WorkflowFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-black/[0.07] bg-[#f7f6f2] px-3 py-2">
      <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="mt-1 block break-words text-sm font-medium text-zinc-900">{value}</span>
    </div>
  );
}
