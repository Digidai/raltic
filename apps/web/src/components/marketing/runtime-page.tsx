import { ArrowRight, CheckCircle2, ExternalLink, Terminal } from "lucide-react";

import { MarketingFooter } from "./footer";
import { MarketingButton } from "./marketing-button";
import { SectionHeader } from "./section-header";
import type { RuntimeDoc } from "./runtime-data";
import { MarketingFaqList } from "./faq-list";
import { JsonLdScript } from "./json-ld";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { CONNECT_RUNTIME_SIGNUP_HREF } from "@/lib/onboarding-intent";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdGraph, webPageJsonLd } from "@/lib/seo";

/** Per-accent class lookups — kept inline (vs. dynamic class names) so
 *  Tailwind's purger sees the strings at build time. */
const ACCENT_TEXT: Record<RuntimeDoc["accent"], string> = {
  cyan: "text-[#2563eb]",
  amber: "text-[#d9821f]",
  violet: "text-muted-foreground",
  neutral: "text-muted-foreground",
};
const ACCENT_BG: Record<RuntimeDoc["accent"], string> = {
  cyan: "border-[#d4e4ff] bg-[#eef4ff] text-[#2563eb]",
  amber: "border-[#f3d9ad] bg-[#fdf2e1] text-[#92560f]",
  violet: "border-border bg-[#f7f6f2] text-muted-foreground",
  neutral: "border-border bg-[#f7f6f2] text-muted-foreground",
};
const ACCENT_GLOW: Record<RuntimeDoc["accent"], string> = {
  cyan: "color-mix(in srgb, #2563eb 10%, transparent)",
  amber: "color-mix(in srgb, #d9821f 10%, transparent)",
  violet: "color-mix(in srgb, #18181b 6%, transparent)",
  neutral: "color-mix(in srgb, #2563eb 5%, transparent)",
};

const DARK_SECTION = "border-border bg-surface text-foreground";
const DARK_MUTED = "text-muted-foreground";
const DARK_BODY = "text-muted-foreground";
const DARK_SURFACE = "border-border bg-[#fafaf8]";
const DARK_SURFACE_SOFT = "border-border bg-[#f7f6f2]";
const LIGHT_SECTION = "bg-[#fafaf8] text-foreground";
const LIGHT_SURFACE = "border-border bg-[#fafaf8]";
const LIGHT_MUTED = "text-muted-foreground";
const LIGHT_BODY = "text-foreground";

function runtimeSignupHref(doc: RuntimeDoc): string {
  return doc.verification === "verified" ? CONNECT_RUNTIME_SIGNUP_HREF : "/signup";
}

function runtimeCtaLabel(doc: RuntimeDoc): string {
  return doc.verification === "verified" ? "Connect this runtime" : "Join private beta";
}

/**
 * Shared template for /runtimes/[id]. Renders the per-runtime hero,
 * "what it is", "how Raltic uses it", install command, "best at"
 * bullets, FAQ, and a CTA.
 *
 * Per codex review L9 (thin-content guard): the unique copy comes from
 * RUNTIME_DOCS[key] in runtime-data.ts — this template is pure layout.
 * Each runtime's body content is hand-written, distinct from the others.
 */
export function RuntimePage({ doc }: { doc: RuntimeDoc }) {
  const path = `/runtimes/${doc.key}`;
  // Only verified runtimes are indexable (openclaw/hermes carry
  // robots:noindex until smoke verification). Emit rich structured data
  // for indexable pages only — no point decorating noindex pages.
  const indexable = doc.verification === "verified";
  return (
    <>
      {indexable && (
        <JsonLdScript
          data={jsonLdGraph([
            webPageJsonLd({
              path,
              name: `${doc.longName} runtime for Raltic`,
              description: doc.tagline,
            }),
            faqPageJsonLd(doc.faq, path),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Runtimes", path: "/runtimes" },
              { name: doc.shortName, path },
            ]),
          ])}
        />
      )}
      <Hero doc={doc} />
      <Card render={<section className={DARK_SECTION} />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-medium text-foreground">What it is</h2>
            <p className={`mt-3 ${DARK_MUTED}`}>{doc.whatItIs}</p>
            <a
              href={doc.upstreamHref}
              target="_blank"
              rel="noreferrer"
              className={`mt-4 inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:text-foreground hover:underline ${DARK_BODY}`}
            >
              {doc.upstreamLabel} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div>
            <h2 className="text-2xl font-medium text-foreground">How Raltic uses it</h2>
            <p className={`mt-3 ${DARK_MUTED}`}>{doc.howRalticUses}</p>
            <div className={`mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-1 text-[11px] font-medium ${DARK_SURFACE} ${DARK_MUTED}`}>
              Lifecycle: <span className={DARK_BODY}>{doc.lifecycle === "external_daemon" ? "External daemon (yours)" : "Per-turn CLI spawn"}</span>
            </div>
          </div>
        </CardPanel>
      </Card>

      <InstallStrip doc={doc} />
      <BestAt doc={doc} />
      <Faq doc={doc} />
      <Cta doc={doc} />
      <MarketingFooter />
    </>
  );
}

function Hero({ doc }: { doc: RuntimeDoc }) {
  return (
    <section className={`relative isolate overflow-hidden border-b pt-32 pb-20 sm:pt-40 ${DARK_SECTION}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${ACCENT_GLOW[doc.accent]}, transparent 70%)`,
        }}
      />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${ACCENT_BG[doc.accent]}`}>
          {doc.shortName} runtime
          {doc.verification === "experimental" && (
            <>
              <span className={DARK_MUTED} aria-hidden>·</span>
              <span className="font-semibold uppercase tracking-wider text-[#d9821f]">Experimental</span>
            </>
          )}
        </span>
        <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-6xl">
          <span className={ACCENT_TEXT[doc.accent]}>{doc.shortName}</span>{" "}
          in Raltic
        </h1>
        <p className={`mx-auto mt-5 max-w-2xl text-balance text-lg ${DARK_MUTED}`}>{doc.tagline}</p>
        <p className={`mx-auto mt-6 max-w-2xl text-balance text-sm leading-relaxed ${DARK_MUTED}`}>{doc.hero}</p>
        {doc.verification === "experimental" && (
          <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-[#f3d9ad] bg-[#fdf2e1] px-4 py-3 text-left text-[12px] text-[#92560f]">
            <strong className="text-[#92560f]">Experimental runtime.</strong> Code shipped; CLI shape was implemented from public docs without a local smoke pass. See{" "}
            <code className="raltic-inline-token">docs/SMOKE_TESTS_openclaw_hermes.md</code>{" "}
            for what verification needs to cover. Recommended for evaluation, not production-critical work.
          </div>
        )}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MarketingButton href={runtimeSignupHref(doc)}>
            {runtimeCtaLabel(doc)} <ArrowRight className="h-4 w-4" />
          </MarketingButton>
          <MarketingButton href="/runtimes" variant="secondary">
            See all runtimes
          </MarketingButton>
        </div>
      </div>
    </section>
  );
}

function InstallStrip({ doc }: { doc: RuntimeDoc }) {
  return (
    <Card render={<section className={LIGHT_SECTION} />} className="w-full rounded-none border-0 shadow-none">
      <CardPanel className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          dark={false}
          eyebrow="Install"
          title={<>One line, on your machine.</>}
          description={
            doc.lifecycle === "external_daemon"
              ? "Raltic doesn't bundle this runtime. Install the daemon from its upstream, then point Raltic at it. We never see your provider keys."
              : "Raltic doesn't bundle this CLI. Install it from upstream, then start the Raltic bridge — your provider key stays in the CLI's own auth path."
          }
        />
        <div className="mx-auto mt-10 max-w-3xl">
          <Card className={`rounded-xl ${LIGHT_SURFACE}`}>
            <CardPanel className="flex items-center gap-3 px-4 py-3">
              <Terminal className={`h-4 w-4 shrink-0 ${LIGHT_MUTED}`} aria-hidden />
              <code className="raltic-inline-token flex-1 truncate">{doc.installCmd}</code>
            </CardPanel>
          </Card>
          <p className="mt-4 text-center text-[12px] text-[#52525b]">
            {doc.verification === "experimental" ? (
              <>
                This integration is visible for evaluation, but agent creation is locked until the OpenClaw/Hermes smoke verification passes.
              </>
            ) : (
              <>
                Then sign up and pick <span className={`font-medium ${LIGHT_BODY}`}>{doc.shortName}</span> when creating your first agent.
              </>
            )}
          </p>
        </div>
      </CardPanel>
    </Card>
  );
}

function BestAt({ doc }: { doc: RuntimeDoc }) {
  return (
    <Card render={<section className={DARK_SECTION} />} className="w-full rounded-none border-0 shadow-none">
      <CardPanel className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeader
          eyebrow="Best at"
          title={<>Three things this runtime is best at in Raltic.</>}
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {doc.bestAt.map((point, idx) => (
            <Card key={idx} className={`rounded-xl ${DARK_SURFACE_SOFT}`}>
              <CardPanel>
                <div className={`flex items-center gap-2 ${ACCENT_TEXT[doc.accent]}`}>
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[10.5px] font-medium uppercase tracking-wider">{`#${idx + 1}`}</span>
                </div>
                <p className={`mt-3 text-sm leading-relaxed ${DARK_BODY}`}>{point}</p>
              </CardPanel>
            </Card>
          ))}
        </div>
        <p className={`mx-auto mt-10 max-w-2xl text-center text-[12px] ${DARK_MUTED}`}>
          Available models in Raltic: {doc.models.map((m) => <code key={m} className="raltic-inline-token mx-0.5">{m}</code>)}
        </p>
      </CardPanel>
    </Card>
  );
}

function Faq({ doc }: { doc: RuntimeDoc }) {
  return (
    <Card render={<section className={LIGHT_SECTION} />} className="w-full rounded-none border-0 shadow-none">
      <CardPanel className="mx-auto max-w-3xl px-6 py-24">
        <SectionHeader
          dark={false}
          eyebrow="FAQ"
          title={<>Questions specific to {doc.shortName}.</>}
        />
        <MarketingFaqList idPrefix={doc.key} items={doc.faq} theme="light" />
      </CardPanel>
    </Card>
  );
}

function Cta({ doc }: { doc: RuntimeDoc }) {
  return (
    <Card render={<section className={DARK_SECTION} />} className="w-full rounded-none border-0 shadow-none">
      <CardPanel className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl">
          {doc.verification === "experimental"
            ? `${doc.shortName} is visible for evaluation.`
            : `Bring ${doc.shortName} into a workflow room.`}
        </h2>
        <p className={`mt-4 ${DARK_MUTED}`}>
          {doc.verification === "experimental"
            ? "Agent creation stays locked until the OpenClaw/Hermes smoke verification passes. Your daemon stays yours; we never see your keys."
            : `Free during private beta. ${doc.lifecycle === "external_daemon" ? "Your daemon stays yours." : "Your CLI auth stays yours."} We never see your keys.`}
        </p>
        <div className="mt-7 flex justify-center">
          <MarketingButton href={runtimeSignupHref(doc)}>
            {runtimeCtaLabel(doc)} <ArrowRight className="h-4 w-4" />
          </MarketingButton>
        </div>
      </CardPanel>
    </Card>
  );
}
