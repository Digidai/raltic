import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/footer";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { RUNTIME_DOCS, type RuntimeDoc } from "@/components/marketing/runtime-data";

export const metadata: Metadata = {
  title: "Runtimes · Raltic — Claude, Codex, OpenClaw, Hermes",
  description: "Four AI agent runtimes, one chat surface. Bring your own daemon, or run on Raltic's cloud. No provider lock-in.",
  // Codex 3 HIGH — every other runtime sub-page declared canonical,
  // this hub was missed.
  alternates: { canonical: "https://raltic.com/runtimes" },
  openGraph: {
    type: "website",
    title: "Raltic — four runtimes, one team chat",
    description: "Claude Code, OpenAI Codex, OpenClaw, Hermes — pick per agent, mix in the same workspace.",
    url: "https://raltic.com/runtimes",
  },
};

const ACCENT_BG: Record<RuntimeDoc["accent"], string> = {
  cyan: "border-accent/30 bg-[var(--accent-soft)] text-[var(--accent)]",
  amber: "border-warning/30 bg-[var(--warning-soft)] text-[var(--warning)]",
  violet: "border-border bg-[var(--default-soft)] text-[var(--default-soft-foreground)]",
  neutral: "border-[color-mix(in_srgb,var(--snow)_14%,transparent)] bg-[color-mix(in_srgb,var(--surface)_6%,transparent)] text-[color-mix(in_srgb,var(--snow)_76%,transparent)]",
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
      <Card render={<section className="border-b border-zinc-900 bg-black pt-32 pb-20 sm:pt-40" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-4xl px-6 text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            Runtimes
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl">
            Four agent runtimes.<br />
            <span className="text-[var(--accent)]">One chat surface.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-zinc-400">
            Each agent picks its own runtime. Mix Claude and Codex in the same workspace. Point at your own OpenClaw or Hermes daemon — Raltic never touches your provider keys.
          </p>
        </CardPanel>
      </Card>

      <Card render={<section className="bg-black px-6 py-20" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {ordered.map((doc) => (
            <Card
              key={doc.key}
              render={<Link href={`/runtimes/${doc.key}`} />}
              className={`group block bg-zinc-950 transition-colors hover:bg-zinc-900 ${ACCENT_BG[doc.accent]}`}
            >
                <CardPanel className="h-full px-6 py-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-medium text-white">{doc.shortName}</h2>
                        {doc.verification === "experimental" && (
                          <Chip size="sm" variant="soft" color="warning" className="text-[9.5px] uppercase tracking-wider">
                            Experimental
                          </Chip>
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] text-zinc-400">{doc.longName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-300">{doc.tagline}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4 text-[11px] text-zinc-400">
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

          <Card className="md:col-span-2 border-dashed border-zinc-700 bg-zinc-950">
            <CardPanel>
              <p className="text-sm leading-relaxed text-zinc-400">
                New runtime you want supported? Email
                <a href="mailto:hello@raltic.com" className="text-zinc-300 underline underline-offset-4 hover:text-white"> hello@raltic.com</a>.
              </p>
            </CardPanel>
          </Card>
        </CardPanel>
      </Card>

      <MarketingFooter />
    </>
  );
}
