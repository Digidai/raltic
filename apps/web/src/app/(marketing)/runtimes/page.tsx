import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { RUNTIME_DOCS, type RuntimeDoc } from "@/components/marketing/runtime-data";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdGraph,
  marketingMetadata,
  webPageJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = marketingMetadata({
  title: "AI Agent Runtimes: Claude Code, Codex & Cloud Agents",
  description:
    "Verified Claude and Codex bridge runtimes, cloud agents, and experimental OpenClaw/Hermes daemon integrations in one workflow surface — Raltic never touches your provider keys.",
  path: "/runtimes",
  keywords: [
    "Claude Code runtime",
    "OpenAI Codex runtime",
    "bring your own AI agent",
    "AI agent runtimes",
    "local AI agent bridge",
  ],
});

const ACCENT_BG: Record<RuntimeDoc["accent"], string> = {
  cyan: "border-[#d4e4ff] bg-[#eef4ff] text-[#2563eb]",
  amber: "border-[#f5dcb3] bg-[#fdf2e1] text-[#92560f]",
  violet: "border-black/[0.07] bg-[#f7f6f2] text-zinc-600",
  neutral: "border-black/[0.07] bg-[#f7f6f2] text-zinc-600",
};

export default function RuntimesHub() {
  const ordered: RuntimeDoc[] = [
    RUNTIME_DOCS.claude,
    RUNTIME_DOCS.codex,
    RUNTIME_DOCS.openclaw,
    RUNTIME_DOCS.hermes,
  ];
  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path: "/runtimes",
            name: "AI Agent Runtimes for Raltic",
            description:
              "Verified Claude Code and OpenAI Codex bridge runtimes, cloud agents, and experimental OpenClaw/Hermes daemon integrations.",
            type: "CollectionPage",
            mainEntity: { "@id": `${absoluteUrl("/runtimes")}#itemlist` },
          }),
          itemListJsonLd({
            path: "/runtimes",
            name: "Raltic agent runtimes",
            items: ordered.map((doc) => ({
              name: doc.longName,
              description: doc.tagline,
              path: `/runtimes/${doc.key}`,
            })),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Runtimes", path: "/runtimes" },
          ]),
        ])}
      />
      <Card render={<section className="border-b border-black/[0.07] bg-[#fafaf8] pt-32 pb-20 sm:pt-40" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-4xl px-6 text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" aria-hidden="true" />
            Runtimes
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            Verified bridge runtimes.<br />
            <span className="text-[#2563eb]">Experimental daemons.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-zinc-500">
            Claude and Codex are selectable today. OpenClaw and Hermes are visible for evaluation and locked until their smoke verification passes. Raltic never touches your provider keys.
          </p>
        </CardPanel>
      </Card>

      <Card render={<section className="bg-white px-6 py-20" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {ordered.map((doc) => (
            <Card
              key={doc.key}
              render={<Link href={`/runtimes/${doc.key}`} />}
              className={`group block bg-white transition-colors hover:bg-[#fafaf8] ${ACCENT_BG[doc.accent]}`}
            >
                <CardPanel className="h-full px-6 py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-medium text-zinc-900">{doc.shortName}</h2>
                        {doc.verification === "experimental" && (
                          <Chip size="sm" variant="soft" color="warning" className="text-[9.5px] uppercase tracking-wider">
                            Experimental
                          </Chip>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-zinc-600">{doc.longName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-900" />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-600">{doc.tagline}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/[0.07] pt-4 text-[11px] text-zinc-500">
                    <Chip size="sm" variant="soft" color="default">
                      {doc.lifecycle === "external_daemon" ? "External daemon" : "Per-turn spawn"}
                    </Chip>
                    <Chip size="sm" variant="soft" color="default">
                      {doc.models.length} model{doc.models.length === 1 ? "" : "s"}
                    </Chip>
                  </div>
                </CardPanel>
            </Card>
          ))}

          <Card className="md:col-span-2 border-dashed border-black/[0.07] bg-[#fafaf8]">
            <CardPanel>
              <p className="text-sm leading-relaxed text-zinc-500">
                New runtime you want supported? Email
                <a href="mailto:hello@raltic.com" className="text-zinc-600 underline underline-offset-4 hover:text-zinc-900"> hello@raltic.com</a>.
              </p>
            </CardPanel>
          </Card>
        </CardPanel>
      </Card>

      <MarketingFooter />
    </>
  );
}
