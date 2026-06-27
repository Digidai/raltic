import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Chip } from "@/components/heroui-pro/chip";
import {
  SITE_CONTENT_UPDATED,
  absoluteUrl,
  breadcrumbJsonLd,
  definedTermSetJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Agent Workflow Glossary",
  description:
    "Plain-language definitions for the terms behind Raltic — workflow room, human-in-the-loop, agent workflow, bridge runtime, cloud agent, and approval gate.",
  path: "/glossary",
  keywords: [
    "what is an agent workflow",
    "human in the loop AI definition",
    "AI workflow room",
    "AI bridge runtime",
  ],
});

// id is the in-page anchor + DefinedTerm @id fragment.
const TERMS: Array<{ id: string; term: string; definition: string }> = [
  {
    id: "agent-workflow",
    term: "Agent workflow",
    definition:
      "A repeatable business process where one or more AI agents do part of the work and a human owns the decision. Unlike a one-off chat, an agent workflow has a clear input (the brief), an agent run, a human approval boundary, and an output that becomes reusable team memory.",
  },
  {
    id: "workflow-room",
    term: "Workflow room",
    definition:
      "Raltic's unit of work: a shared space for a single repeatable process where the brief, agent updates, approvals, tasks, artifacts, and final decision all stay together. It looks familiar like a channel, but it is organized around getting work done, not just messages passing by.",
  },
  {
    id: "human-in-the-loop",
    term: "Human-in-the-loop (HITL)",
    definition:
      "A design where an AI agent can draft and propose work, but a human reviews and approves before it ships — to a customer, a repository, or a teammate. Raltic keeps this approval boundary visible inside every workflow room instead of hiding it behind an automated action.",
  },
  {
    id: "approval-gate",
    term: "Approval gate",
    definition:
      "The explicit checkpoint where a human accepts, edits, or blocks an agent's output before it has any external effect. In Raltic the gate is part of the workflow, so agents can move fast while a person stays accountable for what actually goes out.",
  },
  {
    id: "cloud-agent",
    term: "Cloud agent",
    definition:
      "An agent that runs in Raltic's managed sandbox with zero local install, so a workflow can start immediately. Cloud agents suit low-risk workflows where speed matters and there is no need to keep private code or keys on a local machine.",
  },
  {
    id: "bridge-runtime",
    term: "Bridge runtime",
    definition:
      "A local AI runtime — such as Claude Code or OpenAI Codex — connected to Raltic through a lightweight bridge so the agent executes on your own machine. Source code and provider keys stay local; only the messages, artifacts, and run status the agent chooses to share cross into the workflow room.",
  },
];

export default function GlossaryPage(): React.ReactElement {
  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path: "/glossary",
            name: "AI Agent Workflow Glossary",
            description:
              "Plain-language definitions for workflow room, human-in-the-loop, agent workflow, bridge runtime, cloud agent, and approval gate.",
            dateModified: SITE_CONTENT_UPDATED,
            mainEntity: { "@id": `${absoluteUrl("/glossary")}#glossary` },
          }),
          definedTermSetJsonLd({
            path: "/glossary",
            name: "Raltic AI agent workflow glossary",
            description: "Key terms behind Raltic's agent workflow platform.",
            terms: TERMS,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Glossary", path: "/glossary" },
          ]),
        ])}
      />

      <section className="border-b border-black/[0.07] bg-[#fafaf8] pt-28 pb-20 sm:pt-32">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Glossary", href: "/glossary" }]} />
        <div className="mx-auto mt-8 max-w-3xl px-6 text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <BookOpen className="h-3 w-3 text-[#2563eb]" aria-hidden="true" />
            Glossary
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            AI agent workflow glossary.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-600">
            Plain-language definitions for the terms behind Raltic — so you can tell an agent workflow from a chat, and a cloud agent from a bridge runtime.
          </p>
        </div>
      </section>

      <section className="bg-white px-6 py-20 sm:py-24">
        <dl className="mx-auto grid max-w-3xl gap-4">
          {TERMS.map((t) => (
            <div key={t.id} id={t.id} className="scroll-mt-24 rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
              <dt className="text-lg font-medium text-zinc-900">{t.term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-600">{t.definition}</dd>
            </div>
          ))}
        </dl>
        <div className="mx-auto mt-10 max-w-3xl text-center text-sm text-zinc-500">
          See the terms in action on the{" "}
          <Link href="/workflows" className="font-medium text-[#2563eb] underline-offset-4 hover:underline">workflow templates</Link>{" "}
          or the{" "}
          <Link href="/runtimes" className="font-medium text-[#2563eb] underline-offset-4 hover:underline">runtimes overview</Link>.
        </div>
      </section>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              Put the vocabulary to work.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
              Start one workflow room and watch the brief, the agent run, and the approval gate come together. Free during private beta.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup" ctaTarget="glossary_footer_signup">
                Start free beta <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}
