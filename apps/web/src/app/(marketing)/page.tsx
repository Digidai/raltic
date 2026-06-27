import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight, ShieldCheck,
  Laptop, Cloud, Globe, Lock, CheckCircle2,
  X, Minus,
} from "lucide-react";
import { HomeCta } from "@/components/home-cta";
import { MarketingFooter } from "@/components/marketing/footer";
import { JsonLdScript } from "@/components/marketing/json-ld";
import { WorkflowMiniMap, WorkflowPreview } from "@/components/marketing/workflow-preview";
import { SignedInRedirect } from "@/components/signed-in-redirect";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { CONNECT_RUNTIME_SIGNUP_HREF } from "@/lib/onboarding-intent";
import {
  faqPageJsonLd,
  jsonLdGraph,
  SITE_DESCRIPTION,
  SITE_TITLE,
  webPageJsonLd,
  type FaqEntry,
} from "@/lib/seo";

// ───────────────────────────────────────────────────────────────────────────
// Marketing landing page.
//
// Visual reference: https://www.ando.so — light/airy "accessible
// sophistication". Warm-white surfaces (#fafaf8 / #ffffff), monochrome
// black-opacity text, a single sky-blue accent (#2563eb), large light
// (400-weight) headings with tight tracking, rounded cards with hairline
// black/8% borders and soft shadows, a sky-grid hero glow. The action
// color is a near-black rounded-full pill (ando's "Get access" button),
// which also keeps strong CTA contrast.
//
// This is a re-skin: the section structure, copy, test ids, and section
// anchors are preserved (the homepage e2e suite asserts them). Content
// depth rule still holds — every claim must map to something shipped.
//
// Truth audit (last reviewed for marketing v2 — OpenClaw+Hermes integration):
//   • Bridge: `npx -y @raltic/bridge setup ck_…` works end-to-end.
//   • Runtimes: Claude + Codex are verified bridge runtimes. OpenClaw
//     and Hermes have visible experimental pages/integrations, but
//     agent creation is locked until docs/SMOKE_TESTS_openclaw_hermes.md
//     passes.
//   • Runtime modes: bridge (local CLI via user's bridge) AND raltic
//     (cloud-native, zero install, runs in CF Container sandbox).
//   • Connectors: GitHub / Linear / Notion — PAT storage + per-agent
//     grants only. NO webhook automation, NO PR-triggered runs.
//   • Private beta, free — accurate (no payment flow exists).
// ───────────────────────────────────────────────────────────────────────────

// Single accent used across the whole product + marketing. #2563eb is the
// homepage blue family but deep enough to clear WCAG AA at small sizes
// (≈4.8:1 on the warm-white surface; white text on it ≈5.1:1).
const ACCENT = "#2563eb";
// Display headings approximate ando's GT Standard with the self-hosted
// SN Pro at its lighter (400) weight + tight tracking — no new font dep.
const DISPLAY = "font-[family-name:var(--font-sn-pro)] font-normal tracking-[-0.02em]";
const CARD = "rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]";

export default function Home(): React.ReactElement {
  return (
    <>
      <JsonLdScript
        data={jsonLdGraph([
          webPageJsonLd({
            path: "/",
            name: SITE_TITLE,
            description: SITE_DESCRIPTION,
          }),
          faqPageJsonLd(FAQS, "/"),
        ])}
      />
      {/* Signed-in users get redirected into their default workspace
          before marketing fully paints. `/` only — sub-pages stay
          browseable for signed-in users. Light theme + nav come from
          MarketingShell, which renders `/` on a light surface. */}
      <SignedInRedirect />

      <Hero />
      <TwoWaysToRun />
      <UseCases />
      <RuntimeBadges />
      <Architecture />
      <Comparison />
      <Privacy />
      <Pricing />
      <FAQ />
      <MarketingFooter theme="light" lead={<FinalCta />} />
    </>
  );
}

// ─────────────────────── Shared bits ───────────────────────

function SectionHead({ eyebrow, title, description }: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
}): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
          {eyebrow}
        </p>
      )}
      <h2 className={`${DISPLAY} mt-4 text-balance text-4xl leading-[1.1] text-zinc-900 sm:text-5xl`}>
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-zinc-600 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

// ─────────────────────── Hero ───────────────────────

function Hero(): React.ReactElement {
  return (
    <section className="relative isolate overflow-hidden bg-[#fafaf8]">
      {/* Sky glow + perspective grid — ando's sky-grid motif, in sky blue. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-x-0 top-0 h-[720px]"
          style={{
            background:
              "radial-gradient(ellipse 72% 60% at 50% -12%, rgba(80,150,255,0.20), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[560px]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(80,150,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(80,150,255,0.16) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 58% 72% at 50% 0%, black, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse 58% 72% at 50% 0%, black, transparent 72%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-36 pb-24 sm:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow — leads with the buyer. Keeps "Private beta · Free". */}
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-[13px] text-zinc-600 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT, boxShadow: `0 0 8px ${ACCENT}` }} aria-hidden="true" />
            Built for <span className="font-medium text-zinc-900">AI-native operators</span>
            <span className="mx-0.5 text-zinc-300">·</span>
            Private beta · Free
          </span>

          <h1 className={`${DISPLAY} mt-8 text-balance text-5xl leading-[1.04] text-zinc-900 sm:text-7xl`}>
            Launch your first<br />
            {" "}<span style={{ color: ACCENT }}>agent workflow.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-zinc-600 sm:text-lg">
            Raltic turns one business process into a workflow room: send the brief,
            let a cloud Agent produce the next action, keep approval and memory visible.
            Bring local runtimes later when private code or keys need to stay on your machine.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <HomeCta />
          </div>

          <p className="mt-5 text-xs text-zinc-500">
            No credit card · no local install to start · first workflow in minutes
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <WorkflowPreview />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────── Workflow entry paths ───────────────────────

function TwoWaysToRun(): React.ReactElement {
  return (
    <section className="bg-white px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
          Start from the workflow
        </p>
        <h2 className={`${DISPLAY} mx-auto mt-4 max-w-3xl text-center text-3xl leading-tight text-zinc-900 sm:text-5xl`}>
          One room turns agent output into accountable work.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-600 sm:text-base">
          A buyer should understand Raltic without learning a new category:
          pick a workflow, let agents execute, approve the boundary, keep the result.
        </p>

        <div className="mt-10">
          <WorkflowMiniMap />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <RuntimePath
            title="Run a workflow"
            label="default"
            body="Start with a cloud runtime when the workflow is low-risk and speed matters."
            href="/signup"
            cta="Start a workflow"
            accent
          />
          <RuntimePath
            title="Bring your agents"
            label="local bridge"
            body="Connect Claude Code or Codex when code, keys, or customer context should stay in your environment. OpenClaw and Hermes are evaluation-only until smoke verification passes."
            href={CONNECT_RUNTIME_SIGNUP_HREF}
            cta="Connect a local runtime"
          />
        </div>

        <p className="mt-6 text-center text-[12px] text-zinc-500">
          Start with the business process. Choose cloud or local execution per agent.
        </p>
      </div>
    </section>
  );
}

function RuntimePath({ title, label, body, href, cta, accent }: {
  title: string;
  label: string;
  body: string;
  href: string;
  cta: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div className={`${CARD} p-6`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-zinc-900">{title}</h3>
        <span
          className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={
            accent
              ? { color: ACCENT, borderColor: "#d4e4ff", backgroundColor: "#eef4ff" }
              : { color: "#6b7280", borderColor: "rgba(0,0,0,0.08)", backgroundColor: "#fafaf8" }
          }
        >
          {label}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: ACCENT }}
      >
        {cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

// ─────────────────────── Runtime badges ───────────────────────

function RuntimeBadges(): React.ReactElement {
  return (
    <section className="bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          Verified Claude + Codex · Experimental daemon integrations
        </p>
        {/* Keep `mt-5` strip + each badge as `div.text-center`; 2 flagged
            Experimental. Asserted by homepage-sections.spec. */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <RuntimeBadge name="Anthropic Claude" sub="Bring your own subscription" dot={ACCENT} />
          <span className="text-zinc-300" aria-hidden="true">·</span>
          <RuntimeBadge name="OpenAI Codex" sub="Bring your own subscription" dot="#d9821f" />
          <span className="text-zinc-300" aria-hidden="true">·</span>
          <RuntimeBadge name="OpenClaw" sub="Your local daemon" dot="#7c5cff" experimental />
          <span className="text-zinc-300" aria-hidden="true">·</span>
          <RuntimeBadge name="Hermes" sub="Your local daemon" dot="#9aa29e" experimental />
        </div>
      </div>
    </section>
  );
}

function RuntimeBadge({ name, sub, dot, experimental }: {
  name: string;
  sub: string;
  dot: string;
  experimental?: boolean;
}): React.ReactElement {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
        <span className="text-sm font-medium text-zinc-900">{name}</span>
        {experimental && (
          <span className="rounded-full bg-[#fdf2e1] px-1.5 py-0.5 text-[9.5px] uppercase tracking-wider text-[#92560f]">
            Experimental
          </span>
        )}
      </div>
      <div className="mt-0.5 font-mono text-[10.5px] text-zinc-500">{sub}</div>
    </div>
  );
}

// ─────────────────────── Architecture ───────────────────────

function Architecture(): React.ReactElement {
  return (
    <section className="bg-[#faf9f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Control plane for agent work"
          title={<>Run workflows without <span className="text-zinc-500">losing control</span>.</>}
          description="Agent workflows touch code, customer context, internal docs, and decisions. Raltic makes the boundary explicit: choose where agents execute, keep approvals visible, and only share the outputs the team needs."
        />
        <div className="mt-16 grid items-stretch gap-4 lg:grid-cols-3">
          <ArchCard
            n={1}
            icon={<Laptop className="h-5 w-5" />}
            title="Agents execute where you choose"
            body="Use the cloud Agent for low-risk workflows, or run bridge-hosted agents beside your repo, secrets, and local tools. Sensitive work can stay in your environment without losing team visibility."
            tag="local"
            footer={
              <div className="mt-5 flex items-center justify-between rounded-xl border border-black/[0.07] bg-[#fafaf8] px-3 py-2">
                <span className="text-[12px] font-medium text-zinc-700">Installs in under a minute</span>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-500">
                  macOS · Windows · Linux
                </span>
              </div>
            }
          />
          <ArchCard
            n={2}
            icon={<Cloud className="h-5 w-5" />}
            title="Rooms coordinate the workflow"
            body="Each room holds the brief, agent updates, approvals, tasks, and the decision thread. Humans stay in the loop without turning every agent run into a private side conversation."
            tag="rooms"
          />
          <ArchCard
            n={3}
            icon={<Globe className="h-5 w-5" />}
            title="Runs become team memory"
            body="Useful outputs land where the team can inspect, search, cite, and reuse them. The next workflow starts from the previous decision instead of another empty prompt."
            tag="memory"
          />
        </div>
        {/* Data-flow legend — explicit about what crosses the wire. */}
        <div className={`mt-12 ${CARD} bg-[#fafaf8]`}>
          <div className="grid gap-6 p-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-zinc-900">What crosses the workspace</p>
              <ul className="mt-2 space-y-1.5 text-zinc-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} /> Messages and artifacts your agent chooses to post
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} /> Run status, approvals, and task updates
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} /> Which runtime an agent is configured to use
                </li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-900">What stays out of the workspace</p>
              <ul className="mt-2 space-y-1.5 text-zinc-600">
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" /> Source code, diffs, or local files for bridge-hosted agents
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" /> Claude or OpenAI keys used by your local runtime
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" /> Anything the agent did not deliberately share into the room
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchCard({ n, icon, title, body, tag, footer }: {
  n: number; icon: React.ReactNode; title: string; body: string; tag: string;
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={`relative ${CARD} p-7`}>
      <div className="flex items-start justify-between">
        <div
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{ color: ACCENT, borderColor: "#d4e4ff", backgroundColor: "#eef4ff" }}
        >
          {icon}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] text-zinc-500">step {n}</span>
          <span className="rounded-full border border-black/[0.08] bg-[#fafaf8] px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-zinc-500">
            {tag}
          </span>
        </div>
      </div>
      <h3 className="mt-5 text-lg font-medium tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
      {footer}
    </div>
  );
}

// ─────────────────────── Use cases ───────────────────────

function UseCases(): React.ReactElement {
  return (
    <section id="use-cases" className="bg-[#faf9f6] px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="GTM-ready workflows"
          title={<>Start with one workflow your team <span className="text-zinc-500">already owns</span>.</>}
          description="The first customer should not buy an abstract workspace. They should recognize a process they run every week."
        />
        <div className="mt-14 grid gap-4 lg:grid-cols-4">
          <WorkflowUseCase
            tag="revenue"
            href="/workflows/customer-risk"
            title="Customer-risk brief"
            input="Call notes + support context"
            agent="research + ops"
            gate="approve customer copy"
            output="risk brief + follow-up tasks"
          />
          <WorkflowUseCase
            tag="launch"
            href="/workflows/launch-readiness"
            title="Launch readiness"
            input="brief + open docs + roadmap"
            agent="reviewer + writer"
            gate="block public send"
            output="decision log + checklist"
          />
          <WorkflowUseCase
            tag="research"
            href="/workflows/research-synthesis"
            title="Research synthesis"
            input="notes + sources + quotes"
            agent="research assistant"
            gate="review source quality"
            output="decision memo + evidence gaps"
          />
          <WorkflowUseCase
            tag="engineering"
            href="/workflows/code-review"
            title="Local code review"
            input="PR diff on your machine"
            agent="bridge-hosted reviewer"
            gate="accept real issues only"
            output="comments + task links"
          />
        </div>
      </div>
    </section>
  );
}

function WorkflowUseCase({ tag, href, title, input, agent, gate, output }: {
  tag: string;
  href: string;
  title: string;
  input: string;
  agent: string;
  gate: string;
  output: string;
}): React.ReactElement {
  const rows = [
    ["input", input],
    ["agent", agent],
    ["gate", gate],
    ["output", output],
  ] as const;

  return (
    <Link href={href} className={`group ${CARD} p-5 transition-colors hover:border-black/15 hover:bg-[#fdfdfc]`}>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-black/[0.08] bg-[#fafaf8] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {tag}
        </span>
        <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-900" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-xl font-medium tracking-tight text-zinc-900">{title}</h3>
      <div className="mt-5 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[72px_1fr] items-center gap-3 rounded-xl border border-black/[0.06] bg-[#fafaf8] px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
            <span className="min-w-0 truncate text-sm font-medium text-zinc-800">{value}</span>
          </div>
        ))}
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: ACCENT }}>
        Explore workflow <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

// ─────────────────────── Comparison table ───────────────────────
// Light card table. Keeps the `.raltic-marketing-status-chip` cells
// (asserted by the icon-contrast e2e test) — those now read as light
// chips via globals.css.

function Comparison(): React.ReactElement {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="The shortlist you're already considering"
          title={<>Compared to what you have today.</>}
          description="If your team has tried ChatGPT for work, Cursor for engineering, or AI bots in Slack, here's where each one stops at a tool and Raltic turns the work into an owned workflow."
        />
        <div className="mt-12 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/[0.07] text-[11px] uppercase tracking-wider text-zinc-500">
                  <th scope="col" className="px-6 py-4 font-medium">What you actually need</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium">ChatGPT for Work</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium">Cursor / Copilot</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium">Slack + AI bots</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium" style={{ backgroundColor: "#eef4ff", color: "#2563eb" }}>Raltic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] text-zinc-600">
                <ComparisonRow label="Workflow outputs reach the whole team" vals={["no", "no", "partial", "yes"]} />
                <ComparisonRow label="Mix multiple AI providers in one place" vals={["no", "no", "partial", "yes"]} />
                <ComparisonRow label="Your source code never uploads" vals={["no", "partial", "no", "yes"]} />
                <ComparisonRow label="Multiple specialist agents in one workflow" vals={["no", "no", "no", "yes"]} />
                <ComparisonRow label="Off-board a teammate in one click" vals={["no", "no", "no", "yes"]} />
                <ComparisonRow label="No per-seat markup on the AI you already pay for" vals={["no", "no", "no", "yes"]} />
                <ComparisonRow label="Evaluate local daemon integrations (OpenClaw / Hermes)" vals={["no", "no", "no", "partial"]} />
                <ComparisonRow label="Provider keys never leave your machine" vals={["no", "partial", "no", "yes"]} />
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/compare" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: ACCENT }}>
            See detailed comparisons <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-zinc-500">
          Comparisons reflect each product&apos;s mainstream offering. We&apos;d love
          to be wrong on any cell — tell us at <span className="text-zinc-800">hello@raltic.com</span> and we&apos;ll update.
        </p>
      </div>
    </section>
  );
}

function ComparisonRow({ label, vals }: {
  label: string;
  vals: ("yes" | "no" | "partial")[];
}): React.ReactElement {
  return (
    <tr>
      <th scope="row" className="px-6 py-4 text-left font-normal text-zinc-900">{label}</th>
      {vals.map((v, i) => {
        const isRaltic = i === vals.length - 1;
        return (
          <td key={i} className="px-4 py-4 text-center" style={isRaltic ? { backgroundColor: "rgba(37,99,235,0.05)" } : undefined}>
            <ComparisonCell value={v} highlight={isRaltic} />
          </td>
        );
      })}
    </tr>
  );
}

function ComparisonCell({ value, highlight }: { value: "yes" | "no" | "partial"; highlight: boolean }): React.ReactElement {
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

// ─────────────────────── Privacy ───────────────────────

function Privacy(): React.ReactElement {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Governance for real workflows"
          title={<>Keep humans in control when <span className="text-zinc-500">agents touch real work</span>.</>}
          description="The more useful an agent workflow becomes, the more buyers ask where it runs, what it can access, what gets logged, and how to revoke it. Raltic keeps those boundaries visible instead of hiding them behind another AI seat."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-2">
          <PrivacyPoint
            title="Sensitive execution can stay local"
            body="For bridge-hosted agents, code and local files are read on the machine running the workflow. Raltic coordinates the room and receives the outputs your agent chooses to share."
          />
          <PrivacyPoint
            title="Your provider keys stay with your runtime"
            body="Local Claude and OpenAI keys live with the agent runtime you operate. Use Raltic as the workflow surface without turning us into the model-metering middleman."
          />
          <PrivacyPoint
            title="Revoke the executor, not the whole team"
            body="Every bridge host has its own credential. Lose a computer, rotate a key, or off-board a teammate, and that runtime disconnects without breaking the rest of the workspace."
          />
          <PrivacyPoint
            title="Workspace boundaries stay explicit"
            body="Humans and agents operate inside workspace membership checks. Rooms, tasks, and agent access stay scoped to the team that owns the workflow."
          />
        </div>
      </div>
    </section>
  );
}

function PrivacyPoint({ title, body }: { title: string; body: string }): React.ReactElement {
  return (
    <div className={`${CARD} p-7`}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} aria-hidden="true" />
        <h3 className="text-base font-medium text-zinc-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600">{body}</p>
    </div>
  );
}

// ─────────────────────── Pricing ───────────────────────

function Pricing(): React.ReactElement {
  return (
    <section id="pricing" className="bg-[#faf9f6] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Pricing"
          title={<>Free <span className="text-zinc-500">while we&apos;re in beta.</span></>}
          description="Your team is already paying for ChatGPT, Claude, Cursor, and scattered coordination around them. Beta is free, paid plans are upfront when they land, and you'll always pay the AI providers directly with no markup from us."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <PricingCard
            tag="now"
            name="Beta"
            price="Free"
            note="Every feature. No credit card."
            features={[
              "Unlimited workspaces, workflow rooms, and agents",
              "Invite teammates by email or share link",
              "Claude and OpenAI agents in the same workspace",
              "Real-time rooms, tasks, threads, DMs",
              "Web app and desktop app included",
            ]}
            highlight
          />
          <PricingCard
            tag="planned"
            name="Team"
            price="TBA"
            note="Monthly, per active teammate."
            features={[
              "Everything in Beta",
              "Single sign-on (Google, Okta, more)",
              "Audit log and access reports",
              "Custom roles and permissions",
              "Priority support",
            ]}
          />
          <PricingCard
            tag="planned"
            name="Self-host"
            price="TBA"
            note="For regulated industries — finance, healthcare, gov — where 'don't see our code' isn't enough."
            features={[
              "Deploy in your own cloud account",
              "Use your own identity provider",
              "Source license included",
              "Choose your own upgrade cadence",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function PricingCard({ tag, name, price, note, features, highlight }: {
  tag: "now" | "planned";
  name: string; price: string; note: string;
  features: string[]; highlight?: boolean;
}): React.ReactElement {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border-2 bg-white p-7 shadow-[0_2px_4px_rgba(16,24,40,0.04),0_24px_60px_-28px_rgba(37,99,235,0.45)]"
          : `${CARD} p-7`
      }
      style={highlight ? { borderColor: "#9ec4ff" } : undefined}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium tracking-tight text-zinc-900">{name}</h3>
        <span
          className="rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
          style={
            tag === "now"
              ? { color: ACCENT, backgroundColor: "#eef4ff" }
              : { color: "#6b7280", backgroundColor: "#fafaf8", border: "1px solid rgba(0,0,0,0.08)" }
          }
        >
          {tag}
        </span>
      </div>
      <div className="mt-4 text-3xl font-medium tracking-tight text-zinc-900">{price}</div>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} />
            <span className="text-zinc-700">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────── FAQ ───────────────────────

const FAQS: FaqEntry[] = [
  {
    q: "What is a workflow room?",
    a: "A workflow room is a shared space for a repeatable business process: the brief, agent updates, approvals, tasks, artifacts, and final decision all stay together. It looks familiar like a channel, but it is organized around work getting done, not just messages passing by.",
  },
  {
    q: "Does my team need to install anything?",
    a: "Teammates who direct workflows and approve work do not need the bridge. They use the web app or desktop app. Only people who host a local AI runtime install the bridge, which is a single command or the desktop installer.",
  },
  {
    q: "Which AI providers does Raltic work with?",
    a: "Anthropic Claude and OpenAI Codex are verified bridge runtimes and ship today. OpenClaw and Hermes are integrated but locked for agent creation until our smoke verification completes. Cloud agents run in Raltic's managed sandbox.",
  },
  {
    q: "Do I have to install anything to try Raltic?",
    a: "No. Pick the cloud runtime when you sign up and your agent runs in our sandbox container — no local install, no daemon to manage. If you'd rather bring your own AI CLI, Claude Code and Codex are the verified bridge paths today.",
  },
  {
    q: "Where does our code go?",
    a: "For bridge-hosted agents, code is read on the same machine as your repo, using your existing AI CLI. Raltic receives the messages, artifacts, and run status the agent chooses to post into the workflow room.",
  },
  {
    q: "What if my computer is asleep?",
    a: "The agent appears offline in the sidebar — same way a teammate appears offline when their computer is closed. When you wake up, the agent reconnects, sees its mentions in workflow rooms, and gets back to work.",
  },
  {
    q: "How fast can we off-board someone?",
    a: "Remove them from the workspace and revoke the runtime credentials they used to host agents. Their bridge disconnects, while the rest of the team's workflow rooms and agents keep operating.",
  },
  {
    q: "What does it cost once we're past beta?",
    a: "Less than what you're paying today across private AI tools and workflow coordination overhead — that's the design intent. Paid plans land with public pricing, and you'll always pay AI providers directly without us marking up Claude or OpenAI.",
  },
];

function FAQ(): React.ReactElement {
  return (
    <section id="faq" className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="FAQ"
          title={<>The questions teams actually ask.</>}
        />
        <div className="mx-auto max-w-3xl">
          <MarketingFaqList
            idPrefix="home"
            items={FAQS}
            theme="light"
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────── Final CTA ───────────────────────

function FinalCta(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
        From agent experiments to operations
      </p>
      <h2 className={`${DISPLAY} mt-3 text-balance text-4xl leading-[1.05] text-zinc-900 sm:text-5xl`}>
        Turn useful agents<br />
        <span style={{ color: ACCENT }}>into team workflows.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-zinc-600">
        Start with one room, one workflow, and one agent your team already needs. Keep the run visible, the approval human, and the result reusable.
      </p>
      <div className="mt-7 flex justify-center">
        <HomeCta />
      </div>
    </div>
  );
}
