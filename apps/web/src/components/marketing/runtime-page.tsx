import { ArrowRight, CheckCircle2, ExternalLink, Terminal } from "lucide-react";

import { MarketingFooter } from "./footer";
import { MarketingButton } from "./marketing-button";
import { SectionHeader } from "./section-header";
import type { RuntimeDoc } from "./runtime-data";
import { MarketingFaqList } from "./faq-list";
import { Card, CardPanel } from "@/components/heroui-pro/card";

/** Per-accent class lookups — kept inline (vs. dynamic class names) so
 *  Tailwind's purger sees the strings at build time. */
const ACCENT_TEXT: Record<RuntimeDoc["accent"], string> = {
  cyan: "text-[var(--accent)]",
  amber: "text-[var(--warning)]",
  violet: "text-[var(--default-soft-foreground)]",
  neutral: "text-[color-mix(in_srgb,var(--snow)_88%,var(--accent)_12%)]",
};
const ACCENT_BG: Record<RuntimeDoc["accent"], string> = {
  cyan: "border-accent/30 bg-[var(--accent-soft)] text-[var(--accent)]",
  amber: "border-warning/30 bg-[var(--warning-soft)] text-[var(--warning)]",
  violet: "border-border bg-[var(--default-soft)] text-[var(--default-soft-foreground)]",
  neutral: "border-[color-mix(in_srgb,var(--snow)_14%,transparent)] bg-[color-mix(in_srgb,var(--surface)_7%,transparent)] text-[color-mix(in_srgb,var(--snow)_78%,transparent)]",
};
const ACCENT_GLOW: Record<RuntimeDoc["accent"], string> = {
  cyan: "color-mix(in srgb, var(--accent) 16%, transparent)",
  amber: "color-mix(in srgb, var(--warning) 16%, transparent)",
  violet: "color-mix(in srgb, var(--default) 12%, transparent)",
  neutral: "color-mix(in srgb, var(--accent) 7%, transparent)",
};

const DARK_SECTION = "border-[color-mix(in_srgb,var(--white)_10%,transparent)] bg-[var(--eclipse)] text-[var(--snow)]";
const DARK_MUTED = "text-[color-mix(in_srgb,var(--snow)_68%,transparent)]";
const DARK_BODY = "text-[color-mix(in_srgb,var(--snow)_78%,transparent)]";
const DARK_SURFACE = "border-[color-mix(in_srgb,var(--white)_10%,transparent)] bg-[color-mix(in_srgb,var(--eclipse)_94%,var(--accent)_6%)]";
const DARK_SURFACE_SOFT = "border-[color-mix(in_srgb,var(--white)_10%,transparent)] bg-[color-mix(in_srgb,var(--white)_5%,transparent)]";
const LIGHT_SECTION = "bg-[var(--white)] text-[var(--eclipse)]";
const LIGHT_SURFACE = "border-border bg-[var(--surface-secondary)]";
const LIGHT_MUTED = "text-[color-mix(in_srgb,var(--eclipse)_64%,var(--white)_36%)]";
const LIGHT_BODY = "text-[var(--eclipse)]";

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
  return (
    <>
      <Hero doc={doc} />
      <Card render={<section className={DARK_SECTION} />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-medium text-[var(--snow)]">What it is</h2>
            <p className={`mt-3 ${DARK_MUTED}`}>{doc.whatItIs}</p>
            <a
              href={doc.upstreamHref}
              target="_blank"
              rel="noreferrer"
              className={`mt-4 inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:text-[var(--snow)] hover:underline ${DARK_BODY}`}
            >
              {doc.upstreamLabel} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div>
            <h2 className="text-2xl font-medium text-[var(--snow)]">How Raltic uses it</h2>
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
              <span className="font-semibold uppercase tracking-wider text-[var(--warning)]">Experimental</span>
            </>
          )}
        </span>
        <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-[var(--snow)] sm:text-6xl">
          <span className={ACCENT_TEXT[doc.accent]}>{doc.shortName}</span>{" "}
          in Raltic
        </h1>
        <p className={`mx-auto mt-5 max-w-2xl text-balance text-lg ${DARK_MUTED}`}>{doc.tagline}</p>
        <p className={`mx-auto mt-6 max-w-2xl text-balance text-sm leading-relaxed ${DARK_MUTED}`}>{doc.hero}</p>
        {doc.verification === "experimental" && (
          <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-warning/30 bg-[var(--warning-soft)] px-4 py-3 text-left text-[12px] text-[var(--warning)]">
            <strong className="text-[var(--warning)]">Experimental runtime.</strong> Code shipped; CLI shape was implemented from public docs without a local smoke pass. See{" "}
            <code className="raltic-inline-token">docs/SMOKE_TESTS_openclaw_hermes.md</code>{" "}
            for what verification needs to cover. Recommended for evaluation, not production-critical work.
          </div>
        )}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <MarketingButton href="/signup">
            Start free <ArrowRight className="h-4 w-4" />
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
          <p className={`mt-4 text-center text-[12px] ${LIGHT_MUTED}`}>
            Then sign up and pick <span className={`font-medium ${LIGHT_BODY}`}>{doc.shortName}</span> when creating your first agent.
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
        <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-[var(--snow)] sm:text-4xl">
          Bring {doc.shortName} into a workflow room.
        </h2>
        <p className={`mt-4 ${DARK_MUTED}`}>
          Free during private beta. {doc.lifecycle === "external_daemon" ? "Your daemon stays yours." : "Your CLI auth stays yours."} We never see your keys.
        </p>
        <div className="mt-7 flex justify-center">
          <MarketingButton href="/signup">
            Start free <ArrowRight className="h-4 w-4" />
          </MarketingButton>
        </div>
      </CardPanel>
    </Card>
  );
}
