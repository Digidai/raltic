import Link from "next/link";
import {
  ArrowRight, ShieldCheck,
  Laptop, Cloud, Globe, Lock, CheckCircle2,
  X, Minus,
} from "lucide-react";
import { HomeCta } from "@/components/home-cta";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { SectionHeader } from "@/components/marketing/section-header";
import { WorkflowMiniMap, WorkflowPreview } from "@/components/marketing/workflow-preview";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { SignedInRedirect } from "@/components/signed-in-redirect";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { CONNECT_RUNTIME_SIGNUP_HREF } from "@/lib/onboarding-intent";

// ───────────────────────────────────────────────────────────────────────────
// Marketing landing page.
//
// Visual reference: https://photon.codes/spectrum — restrained palette,
// black/white alternating bands, code-as-design-element, monospace metrics.
//
// Content depth: every claim on this page must correspond to something
// actually shipped in the product. If a section advertises a feature that
// doesn't exist yet, kill the section, not the build.
//
// Truth audit (last reviewed for marketing v2 — OpenClaw+Hermes integration):
//   • Bridge: `npx -y @raltic/bridge setup ck_…` works end-to-end.
//   • Runtimes: 4 ship — Claude, Codex (verified), OpenClaw, Hermes
//     (code shipped, smoke verification pending per
//     docs/SMOKE_TESTS_openclaw_hermes.md — marked "Experimental" on
//     this page until verified).
//   • Runtime modes: bridge (local CLI via user's bridge) AND raltic
//     (cloud-native, zero install, runs in CF Container sandbox).
//   • Runtime keys: machineKeys.serverId scope + revokedAt + KV
//     denylist for sy_bridge_ JWTs — all real.
//   • Local execution: agents spawn as child_process on the bridge
//     host; messages go bridge → API → DO → fanout. Files stay local.
//   • Real-time: Durable Objects with WS fan-out per channel; latency
//     sub-second on the staging deploy.
//   • Threads / reactions / tasks / DMs: all live.
//   • Connectors: GitHub / Linear / Notion — PAT storage + per-agent
//     grants only. NO webhook automation, NO PR-triggered runs, NO
//     scheduling (kept off the page per codex review HIGH-3).
//   • Private beta, free — accurate (no payment flow exists).
// ───────────────────────────────────────────────────────────────────────────

export default function Home(): React.ReactElement {
  return (
    <>
      {/* Signed-in users get redirected into their default workspace
          before marketing fully paints (small `/me` round-trip flash).
          `/` only — sub-pages stay browseable for signed-in users.
          Layout (`(marketing)/layout.tsx`) provides nav + tracking +
          dark theme via MarketingShell. */}
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
      <MarketingFooter lead={<FinalCta />} />
    </>
  );
}

// ─────────────────────── Hero ───────────────────────

function Hero(): React.ReactElement {
  return (
    <Card
      render={
        <section className="relative isolate overflow-hidden border-b border-zinc-900 bg-black" />
      }
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="relative pt-32 pb-24 sm:pt-40 sm:pb-32">
        {/* Single restrained cyan radial behind the headline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.10), transparent 70%)",
          }}
        />
        {/* Faint structural grid — purely architectural like Spectrum's dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            {/* Eyebrow pill — leads with the buyer, not the mechanism.
                This page is for AI-native teams turning agent experiments
                into repeatable operations, not for generic "chat with AI". */}
            <Chip size="sm" variant="soft" color="default" className="gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" aria-hidden="true" />
              Built for <span className="text-white">AI-native teams</span>
              <span className="mx-1 text-zinc-400">·</span>
              Private beta · Free
            </Chip>

          <h1 className="mt-8 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-7xl">
            Build your business<br />
            {" "}<span className="text-cyan-400">with agent workflows.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-zinc-400 sm:text-lg">
            Raltic gives AI-native teams workflow rooms where humans set direction,
            agents run the work, approvals stay visible, and decisions become team memory.
            <span className="text-zinc-200"> Start with a cloud Agent</span>, or{" "}
            <span className="text-zinc-200">bring Claude Code, Codex, OpenClaw, or Hermes</span> from your own environment.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {/* Primary CTA — defaults to cloud-native onboarding (zero
                local install). Secondary CTA below routes to /signup
                with the bridge wizard pre-opened for users who want
                to bring their own daemon. Per marketing v2 plan +
                codex review HIGH-1. */}
            <HomeCta />
            <MarketingButton href={CONNECT_RUNTIME_SIGNUP_HREF} variant="secondary">
              Connect a local runtime <ArrowRight className="h-3.5 w-3.5" />
            </MarketingButton>
          </div>

          {/* Trust line. The install command used to live here too, but
              a non-interactive code box in a hero is decoration pretending
              to be UI — it competes with the real CTAs and confuses
              visitors who try to click the command. Moved into the
              Architecture section where the
              technical context makes the command concrete, and kept in
              the final CTA where the user has already committed to act. */}
          <p className="mt-5 text-xs text-zinc-400">
            No credit card · first workflow room in minutes · cloud or local runtimes
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <WorkflowPreview />
        </div>
      </div>
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── Workflow entry paths ───────────────────────
// GTM framing: sell a workflow outcome first, then show the runtime
// choice. The buyer should not have to decide whether Raltic is "chat"
// or "agent infra"; they should see a room where a workflow can start
// today, then pick cloud or local execution based on risk.

function TwoWaysToRun(): React.ReactElement {
  return (
    <Card
      render={<section className="border-b border-zinc-900 bg-black px-6 py-20 sm:py-24" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl">
        <p className="text-center text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Start from the workflow
        </p>
        <h2 className="mx-auto mt-5 max-w-3xl text-center text-3xl font-medium leading-tight tracking-[-0.01em] text-white sm:text-5xl">
          One room turns agent output into accountable work.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-400 sm:text-base">
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
            accent="accent"
          />
          <RuntimePath
            title="Bring your agents"
            label="local bridge"
            body="Connect Claude Code, Codex, OpenClaw, or Hermes when code, keys, or customer context should stay in your environment."
            href={CONNECT_RUNTIME_SIGNUP_HREF}
            cta="Connect a local runtime"
            accent="default"
          />
        </div>

        <p className="mt-6 text-center text-[12px] text-zinc-400">
          Start with the business process. Choose cloud or local execution per agent.
        </p>
      </CardPanel>
    </Card>
  );
}

function RuntimePath({ title, label, body, href, cta, accent }: {
  title: string;
  label: string;
  body: string;
  href: string;
  cta: string;
  accent: "accent" | "default";
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        <Chip size="sm" variant="soft" color={accent} className="font-mono text-[10px] uppercase tracking-wider">
          {label}
        </Chip>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 hover:text-cyan-200">
        {cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

// ─────────────────────── Runtime badges ───────────────────────
// Sits between the hero and the deeper sections. Single-line strip
// that names the actual AI providers Raltic speaks to. Two reasons:
//   1) These are the most-asked questions during sales/eval ("does
//      it use Claude or GPT?"). Surfacing both upfront kills the
//      "is this just an OpenAI wrapper?" objection.
//   2) This is a real feature we just shipped (CodexRuntime in
//      packages/agent-runtime). It was invisible on the prior homepage.

function RuntimeBadges(): React.ReactElement {
  return (
    <Card
      render={<section className="border-b border-zinc-900 bg-black px-6 py-12" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-5xl text-center">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Four runtimes · Bring your own daemon, or run on our cloud
        </p>
        {/* Four-runtime strip. Claude + Codex are verified (the original
            two). OpenClaw + Hermes ship the code but are flagged
            "experimental" until docs/SMOKE_TESTS_openclaw_hermes.md
            completes — per codex review HIGH-2. Don't remove the
            experimental tag without updating that runbook. */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <RuntimeBadge name="Anthropic Claude" sub="Bring your own subscription" dot="cyan" />
          <span className="text-zinc-800" aria-hidden="true">·</span>
          <RuntimeBadge name="OpenAI Codex" sub="Bring your own subscription" dot="amber" />
          <span className="text-zinc-800" aria-hidden="true">·</span>
          <RuntimeBadge name="OpenClaw" sub="Your local daemon" dot="violet" experimental />
          <span className="text-zinc-800" aria-hidden="true">·</span>
          <RuntimeBadge name="Hermes" sub="Your local daemon" dot="neutral" experimental />
        </div>
      </CardPanel>
    </Card>
  );
}

function RuntimeBadge({ name, sub, dot, experimental }: {
  name: string;
  sub: string;
  dot: "cyan" | "amber" | "violet" | "neutral";
  experimental?: boolean;
}): React.ReactElement {
  const dotClass = {
    cyan:    "bg-[var(--accent)]",
    amber:   "bg-[var(--warning)]",
    violet:  "bg-[var(--default-soft-foreground)]",
    neutral: "bg-[color-mix(in_srgb,var(--snow)_62%,var(--eclipse)_38%)]",
  }[dot];
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        <span className="text-sm font-medium text-white">{name}</span>
        {experimental && (
          <Chip size="sm" variant="soft" color="warning" className="text-[9.5px] uppercase tracking-wider">
            Experimental
          </Chip>
        )}
      </div>
      <div className="mt-0.5 font-mono text-[10.5px] text-zinc-400">{sub}</div>
    </div>
  );
}

// ─────────────────────── Architecture ───────────────────────
// The 3-step bridge model, drawn as a horizontal flow. This is the
// hardest concept to communicate (people assume cloud-hosted agents).
// Showing the actual data flow upfront makes the privacy story
// concrete instead of a vague promise.

function Architecture(): React.ReactElement {
  return (
    <Card
      render={<section className="bg-white text-zinc-900" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark={false}
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
              <div className="mt-5 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
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
        {/* Data flow legend underneath — explicit what crosses the wire */}
        <Card render={<div className="mt-12 border border-zinc-200 bg-zinc-50" />} className="bg-zinc-50">
          <CardPanel className="grid gap-6 p-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-zinc-900">What crosses the workspace</p>
              <ul className="mt-2 space-y-1.5 text-zinc-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" /> Messages and artifacts your agent chooses to post
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" /> Run status, approvals, and task updates
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" /> Which runtime an agent is configured to use
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
          </CardPanel>
        </Card>
      </CardPanel>
    </Card>
  );
}

function ArchCard({ n, icon, title, body, tag, footer }: {
  n: number; icon: React.ReactNode; title: string; body: string; tag: string;
  footer?: React.ReactNode;
}): React.ReactElement {
  return (
    <Card render={<div className="relative border border-zinc-200 bg-white" />} className="bg-white">
      <CardPanel className="p-7">
        <div className="flex items-start justify-between">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700">
            {icon}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] text-zinc-600">step {n}</span>
            <Chip size="sm" variant="soft" color="default" className="font-mono text-[9.5px] uppercase tracking-wider">
              {tag}
            </Chip>
          </div>
        </div>
        <h3 className="mt-5 text-lg font-medium tracking-tight text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
        {footer}
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── Use cases ───────────────────────

function UseCases(): React.ReactElement {
  return (
    <Card
      render={<section id="use-cases" className="bg-white text-zinc-900" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <SectionHeader
          dark={false}
          eyebrow="GTM-ready workflows"
          title={<>Start with one workflow your team <span className="text-zinc-500">already owns</span>.</>}
          description="The first customer should not buy an abstract workspace. They should recognize a process they run every week."
        />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <WorkflowUseCase
            tag="revenue"
            title="Customer-risk brief"
            input="Call notes + support context"
            agent="research + ops"
            gate="approve customer copy"
            output="risk brief + follow-up tasks"
          />
          <WorkflowUseCase
            tag="launch"
            title="Launch readiness"
            input="brief + open docs + roadmap"
            agent="reviewer + writer"
            gate="block public send"
            output="decision log + checklist"
          />
          <WorkflowUseCase
            tag="engineering"
            title="Local code review"
            input="PR diff on your machine"
            agent="bridge-hosted reviewer"
            gate="accept real issues only"
            output="comments + task links"
          />
        </div>
      </CardPanel>
    </Card>
  );
}

function WorkflowUseCase({ tag, title, input, agent, gate, output }: {
  tag: string;
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(24,24,27,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <Chip size="sm" variant="soft" color="default" className="font-mono text-[10px] uppercase tracking-wider">
          {tag}
        </Chip>
        <span className="h-2 w-2 rounded-full bg-cyan-500" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-xl font-medium tracking-tight text-zinc-900">{title}</h3>
      <div className="mt-5 space-y-2">
        {rows.map(([label, value], index) => (
          <div key={label} className="grid grid-cols-[72px_1fr] items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
            <span className="min-w-0 truncate text-sm font-medium text-zinc-800">{value}</span>
            {index < rows.length - 1 && (
              <span className="col-span-2 ml-[34px] h-3 w-px bg-zinc-300" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────── Comparison table ───────────────────────
// GTM staple: side-by-side scan vs the products buyers ALREADY have in
// their stack. Six rows chosen for "you'll feel this every week" pain
// points rather than feature parity — saves the buyer from running the
// comparison themselves with whatever incomplete mental model they have.

function Comparison(): React.ReactElement {
  return (
    <Card
      render={<section className="border-y border-zinc-900 bg-black" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark
          eyebrow="The shortlist you're already considering"
          title={<>Compared to what you have today.</>}
          description="If your team has tried ChatGPT for work, Cursor for engineering, or AI bots in Slack, here's where each one stops at a tool and Raltic turns the work into an owned workflow."
        />
        <Card render={<div className="mt-12 border border-zinc-900 bg-zinc-950" />} className="bg-zinc-950">
          <CardPanel className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-900 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th scope="col" className="px-6 py-4 font-medium">What you actually need</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium">ChatGPT for Work</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium">Cursor / Copilot</th>
                  <th scope="col" className="px-4 py-4 text-center font-medium">Slack + AI bots</th>
                  <th scope="col" className="bg-zinc-900/50 px-4 py-4 text-center font-medium text-cyan-300">Raltic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                <ComparisonRow
                  label="Workflow outputs reach the whole team"
                  vals={["no", "no", "partial", "yes"]}
                />
                <ComparisonRow
                  label="Mix multiple AI providers in one place"
                  vals={["no", "no", "partial", "yes"]}
                />
                <ComparisonRow
                  label="Your source code never uploads"
                  vals={["no", "partial", "no", "yes"]}
                />
                <ComparisonRow
                  label="Multiple specialist agents in one workflow"
                  vals={["no", "no", "no", "yes"]}
                />
                <ComparisonRow
                  label="Off-board a teammate in one click"
                  vals={["no", "no", "no", "yes"]}
                />
                <ComparisonRow
                  label="No per-seat markup on the AI you already pay for"
                  vals={["no", "no", "no", "yes"]}
                />
                {/* The two rows below are the OpenClaw + Hermes
                    differentiator — neither competitor supports
                    pointing a workflow at a daemon you run yourself,
                    keeping provider keys entirely in your hands. */}
                <ComparisonRow
                  label="Run workflows with your own AI daemon (OpenClaw / Hermes)"
                  vals={["no", "no", "no", "yes"]}
                />
                <ComparisonRow
                  label="Provider keys never leave your machine"
                  vals={["no", "partial", "no", "yes"]}
                />
              </tbody>
            </table>
          </div>
        </CardPanel>
        </Card>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-zinc-400">
          Comparisons reflect each product's mainstream offering. We'd love
          to be wrong on any cell — tell us at <span className="text-zinc-300">hello@raltic.com</span> and we'll update.
        </p>
      </CardPanel>
    </Card>
  );
}

function ComparisonRow({ label, vals }: {
  label: string;
  vals: ("yes" | "no" | "partial")[];
}): React.ReactElement {
  return (
    <tr>
      <th scope="row" className="px-6 py-4 text-left font-normal text-white">{label}</th>
      {vals.map((v, i) => {
        const isRaltic = i === vals.length - 1;
        return (
          <td key={i} className={"px-4 py-4 text-center " + (isRaltic ? "bg-zinc-900/50" : "")}>
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
      <Chip size="sm" variant="soft" color="accent" className="h-6 w-6 justify-center p-0" aria-label="Yes">
        <CheckCircle2 className={"h-4 w-4 " + (highlight ? "text-cyan-300" : "text-cyan-400")} aria-label="Yes" />
      </Chip>
    );
  }
  if (value === "partial") {
    return (
      <Chip size="sm" variant="soft" color="default" className="raltic-marketing-status-chip h-6 w-6 justify-center p-0" aria-label="Partial">
        <Minus className="h-4 w-4" aria-label="Partial" />
      </Chip>
    );
  }
  return (
    <Chip size="sm" variant="soft" color="default" className="raltic-marketing-status-chip h-6 w-6 justify-center p-0 opacity-80" aria-label="No">
      <X className="h-4 w-4" aria-label="No" />
    </Chip>
  );
}

// ─────────────────────── Privacy ───────────────────────

function Privacy(): React.ReactElement {
  return (
    <Card
      render={<section className="border-y border-zinc-900 bg-black" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark
          eyebrow="Governance for real workflows"
          title={<>Keep humans in control when <span className="text-zinc-500">agents touch real work</span>.</>}
          description="The more useful an agent workflow becomes, the more buyers ask where it runs, what it can access, what gets logged, and how to revoke it. Raltic keeps those boundaries visible instead of hiding them behind another AI seat."
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900 md:grid-cols-2">
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
      </CardPanel>
    </Card>
  );
}

function PrivacyPoint({ title, body }: { title: string; body: string }): React.ReactElement {
  return (
    <Card render={<div className="bg-black" />} className="bg-black">
      <CardPanel className="p-7">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" aria-hidden="true" />
          <h3 className="text-base font-medium text-white">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">{body}</p>
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── Pricing ───────────────────────
// Transparent — free during beta, no payment flow exists. When we add
// paid tiers, this section gets rewritten with real numbers; for now
// it answers the "is this going to be expensive later?" question
// without committing to numbers we don't have.

function Pricing(): React.ReactElement {
  return (
    <Card
      render={<section id="pricing" className="bg-white text-zinc-900" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark={false}
          eyebrow="Pricing"
          title={<>Free <span className="text-zinc-500">while we're in beta.</span></>}
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
      </CardPanel>
    </Card>
  );
}

function PricingCard({ tag, name, price, note, features, highlight }: {
  tag: "now" | "planned";
  name: string; price: string; note: string;
  features: string[]; highlight?: boolean;
}): React.ReactElement {
  return (
    <Card
      render={<div className={"rounded-2xl border " + (highlight ? "border-zinc-900 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-900")} />}
      className={highlight ? "bg-zinc-950 text-white" : "bg-white text-zinc-900"}
    >
      <CardPanel className="p-7">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium tracking-tight">{name}</h3>
          <Chip
            size="sm"
            variant="soft"
            color={tag === "now" ? "accent" : "default"}
            className="font-mono text-[10px] uppercase tracking-wider"
          >
            {tag}
          </Chip>
        </div>
        <div className="mt-4 text-3xl font-medium tracking-tight">{price}</div>
        <p className={"mt-1 text-xs " + (highlight ? "text-zinc-400" : "text-zinc-600")}>{note}</p>
        <ul className="mt-6 space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <CheckCircle2 className={"mt-0.5 h-3.5 w-3.5 shrink-0 " + (highlight ? "text-cyan-400" : "text-cyan-600")} />
              <span className={highlight ? "text-zinc-300" : "text-zinc-700"}>{f}</span>
            </li>
          ))}
        </ul>
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── FAQ ───────────────────────

const FAQS: { q: string; a: string }[] = [
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
    a: "Four runtimes: Anthropic Claude and OpenAI Codex are verified and ship today. OpenClaw and Hermes are integrated but marked experimental until our smoke verification completes — they let you point at any local daemon you already run, with no provider key held by Raltic. Each agent picks its own runtime and model; you can mix them in the same workspace.",
  },
  {
    q: "Do I have to install anything to try Raltic?",
    a: "No. Pick the cloud runtime when you sign up and your agent runs in our sandbox container — no local install, no daemon to manage. If you'd rather bring your own AI CLI (Claude Code, Codex, OpenClaw, Hermes), the bridge installs with one command and your agent runs entirely on your computer.",
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
    <Card
      render={<section id="faq" className="border-y border-zinc-900 bg-black" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark
          eyebrow="FAQ"
          title={<>The questions teams actually ask.</>}
        />
        <MarketingFaqList
          idPrefix="home"
          items={FAQS}
          theme="dark"
        />
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── Final CTA ───────────────────────

function FinalCta(): React.ReactElement {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-[color-mix(in_srgb,var(--accent)_72%,var(--snow)_28%)]">
        From agent experiments to operations
      </p>
      <h2 className="mt-3 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-[var(--snow)] sm:text-5xl">
        Turn useful agents<br />
        <span className="text-[color-mix(in_srgb,var(--accent)_78%,var(--snow)_22%)]">into team workflows.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-[color-mix(in_srgb,var(--snow)_66%,transparent)]">
        Start with one room, one workflow, and one agent your team already needs. Keep the run visible, the approval human, and the result reusable.
      </p>
      <div className="mt-7 flex justify-center">
        <HomeCta />
      </div>
      {/* No install command here. It used to repeat the one in the
          Architecture section, which gave the misleading sense that
          it's actionable from the page. The CTA already routes to
          signup → onboarding wizard, which is where the real ck_ key
          and the real command live. */}
    </div>
  );
}
