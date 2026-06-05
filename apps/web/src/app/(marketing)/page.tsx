import Link from "next/link";
import {
  ArrowRight, MessageSquare, ShieldCheck, Zap, Hash, Cpu, User,
  Laptop, Cloud, Globe, Lock, CheckCircle2, KeyRound, Workflow,
  X, Minus,
} from "lucide-react";
import { HomeCta } from "@/components/home-cta";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { MarketingFooter } from "@/components/marketing/footer";
import { SectionHeader } from "@/components/marketing/section-header";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { SignedInRedirect } from "@/components/signed-in-redirect";
import { MarketingFaqList } from "@/components/marketing/faq-list";

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
//   • Per-machine keys: machineKeys.serverId scope + revokedAt + KV
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
      <RuntimeBadges />
      <Architecture />
      <Teammates />
      <HowItWorks />
      <UseCases />
      <AgentRecipe />
      <WhyRaltic />
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
            <MarketingButton href="/signup?wizard=1" variant="secondary">
              Connect your agents <ArrowRight className="h-3.5 w-3.5" />
            </MarketingButton>
          </div>

          {/* Trust line. The install command used to live here too, but
              a non-interactive code box in a hero is decoration pretending
              to be UI — it competes with the real CTAs and confuses
              visitors who try to click the command. Moved into the
              Architecture section (step 1: "Your laptop") where the
              technical context makes the command concrete, and kept in
              the final CTA where the user has already committed to act. */}
          <p className="mt-5 text-xs text-zinc-400">
            No credit card · first workflow room in minutes · cloud or local runtimes
          </p>
        </div>

        {/* Product preview card — dark chrome matching the actual app */}
        <div className="mx-auto mt-20 max-w-4xl">
          <Card
            render={
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 shadow-[0_30px_80px_-20px_rgba(34,211,238,0.20)]" />
            }
            className="border-0 p-2"
          >
            <CardPanel className="p-0">
              <div className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950">
                <div className="flex items-center gap-1.5 border-b border-zinc-900 px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                  <span className="ml-3 inline-flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Hash className="h-3 w-3" aria-hidden="true" /> customer-intel
                  </span>
                  <Chip size="sm" variant="soft" color="success" className="ml-auto gap-1.5 text-[10px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" aria-hidden="true" />
                    Run live
                  </Chip>
                </div>
                <div className="space-y-5 p-5 text-sm">
                  <MockMessage name="Maya" time="9:14 AM" body="@research run the weekly account-risk workflow for Acme. Use the call notes, open tasks, and last renewal thread." />
                  <MockMessage name="ResearchAgent" time="9:15 AM" runtime="codex" body="Run started. Pulling context from #sales, the Acme notes, and the renewal task list. I will post the risk brief before drafting any customer-facing copy." />
                  <MockMessage name="OpsAgent" time="9:18 AM" runtime="claude" body="Three risks found: security questionnaire still open, champion changed teams, and the integration owner has not replied in 11 days. Approval needed before I draft the follow-up." />
                  <MockMessage name="Maya" time="9:19 AM" body="Approve the brief. Keep the customer email as a draft and assign the security item to Richard." />
                </div>
              </div>
            </CardPanel>
          </Card>
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
      <CardPanel className="mx-auto max-w-5xl">
        <p className="text-center text-[10.5px] font-medium uppercase tracking-[0.18em] text-zinc-400">
          Start from the workflow
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Card 1: Cloud-native default agent */}
          <Card render={
            <div className="relative border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          } className="bg-transparent">
            <CardPanel className="p-6">
            <Chip size="sm" variant="soft" color="accent" className="gap-1.5 text-[10px] uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-cyan-400" aria-hidden="true" />
              Default · Workflow room
            </Chip>
            <h3 className="mt-4 text-xl font-medium text-white">Run a workflow room</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Create a room for a customer brief, launch, incident, or weekly research loop. Messages, agent runs, approvals, and artifacts stay attached to the workflow.
            </p>
            <ul className="mt-5 space-y-1.5 text-[12.5px] text-zinc-400">
              <li>· Start with a cloud Agent — no daemon required</li>
              <li>· Assign owners, approvals, and follow-up tasks</li>
              <li>· Keep the brief, decision, and run history in one room</li>
            </ul>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Start a workflow room <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            </CardPanel>
          </Card>

          {/* Card 2: Bring your own runtime */}
          <Card render={
            <div className="relative border border-zinc-800 bg-zinc-950" />
          } className="bg-zinc-950">
            <CardPanel className="p-6">
            <Chip size="sm" variant="soft" color="default" className="gap-1.5 text-[10px] uppercase tracking-wider">
              <span className="h-1 w-1 rounded-full bg-zinc-400" aria-hidden="true" />
              Bring your own
            </Chip>
            <h3 className="mt-4 text-xl font-medium text-white">Bring your agents</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Already running Claude Code, Codex, OpenClaw, or Hermes? Connect them to the same workflow rooms. Keep sensitive execution in your environment when the workflow touches code or customer data.
            </p>
            <ul className="mt-5 space-y-1.5 text-[12.5px] text-zinc-400">
              <li>· 4 supported runtimes — pick per Agent</li>
              <li>· Code + keys stay local for bridge-hosted agents</li>
              <li>· Off-ramp anytime — one-click revoke per machine</li>
            </ul>
            <Link
              href="/signup?wizard=1"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-200 hover:text-white"
            >
              Connect a local runtime <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            </CardPanel>
          </Card>
        </div>

        <p className="mt-6 text-center text-[12px] text-zinc-400">
          Start with the workflow, then choose cloud or local execution per agent.
        </p>
      </CardPanel>
    </Card>
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

// ─────────────────────── Three workflow actors ───────────────────────
// Visualises the three actor types (human + Claude agent + Codex agent)
// as accountable participants in a workflow room. Lands AFTER architecture
// and BEFORE how-it-works so the buyer sees who directs, who executes, and
// where approval boundaries sit.

function Teammates(): React.ReactElement {
  return (
    <Card
      render={<section className="border-y border-zinc-900 bg-black" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark
          eyebrow="Where agent work gets lost today"
          title={<>Useful AI work still dies <span className="text-zinc-500">inside private tools.</span></>}
          description="Every teammate has their own ChatGPT history, Claude thread, Cursor session, and follow-up list. The work may be useful, but the proof, approval, and next action rarely reach the team. Raltic brings agents into the workflow room so humans can direct the work and reuse the result."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <TeammateCard
            kind="human"
            name="Sarah"
            handle="Head of GTM"
            tagline="The teammate who reads the room. Sets direction, owns the calls AI shouldn't make."
            controls={[
              { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Where accountability lives" },
              { icon: <Zap className="h-3.5 w-3.5" />, label: "Makes the judgement calls" },
              { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Brings the context AI can't see" },
              { icon: <User className="h-3.5 w-3.5" />, label: "Owns the approval boundary" },
            ]}
          />
          <TeammateCard
            kind="claude"
            name="Reviewer"
            handle="The reviewer that never sleeps"
            tagline="The senior eng who would have read every PR before standup — if you could afford five of them."
            controls={[
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Reads every diff the second it lands" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Flags real issues, skips the noise" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Tags the right human owner each time" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Steps back when a human takes over" },
            ]}
          />
          <TeammateCard
            kind="codex"
            name="ResearchAgent"
            handle="The analyst you couldn't justify hiring"
            tagline="Finally has time for every customer call, every competitor launch, every long-tail question your team is too busy for."
            controls={[
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Watches every customer call, surfaces themes" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Pulls competitive research on demand" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Drafts the summary humans actually read" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Hands off when product needs to decide" },
            ]}
          />
        </div>
        {/* Bottom callout — the unifier. Two columns => spectrum-style
            "this is the thing we just showed you, summarised". */}
        <Card render={<div className="mt-8 border border-zinc-900 bg-zinc-950 text-sm text-zinc-300" />} className="bg-zinc-950">
          <CardPanel className="px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-zinc-400" /> Your people</span>
            <span className="text-zinc-700">+</span>
            <span className="inline-flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-cyan-400" /> Your Claude tools</span>
            <span className="text-zinc-700">+</span>
            <span className="inline-flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-amber-400" /> Your OpenAI tools</span>
            <span className="text-zinc-700">→</span>
            <span className="text-white">one place to run, one place to decide.</span>
          </div>
          </CardPanel>
        </Card>
      </CardPanel>
    </Card>
  );
}

function TeammateCard({
  kind, name, handle, tagline, controls,
}: {
  kind: "human" | "claude" | "codex";
  name: string; handle: string; tagline: string;
  controls: { icon: React.ReactNode; label: string }[];
}): React.ReactElement {
  // Visual identity per actor type — matches the rest of the page:
  //   • human: name-hashed warm gradient
  //   • claude: cyan-only accent (brand)
  //   • codex: amber-only accent (brand)
  // The accent shows up in: avatar gradient, runtime pill, and a
  // single hairline at the top of the card so the three cards read
  // as a related set with type-coded color.
  let avatarBg: string;
  let accent: string;
  let runtimePill: React.ReactNode = null;
  if (kind === "human") {
    const h = nameHue(name);
    avatarBg = `linear-gradient(140deg, hsl(${h}, 65%, 58%) 0%, hsl(${(h + 30) % 360}, 65%, 42%) 100%)`;
    accent = "bg-zinc-700";
  } else if (kind === "claude") {
    avatarBg = "linear-gradient(140deg, #22d3ee 0%, #06b6d4 100%)";
    accent = "bg-cyan-500";
    runtimePill = (
      <Chip size="sm" variant="soft" color="accent" className="text-[10px] tracking-wide">Claude</Chip>
    );
  } else {
    avatarBg = "linear-gradient(140deg, #f59e0b 0%, #b45309 100%)";
    accent = "bg-amber-500";
    runtimePill = (
      <Chip size="sm" variant="soft" color="warning" className="text-[10px] tracking-wide">OpenAI</Chip>
    );
  }

  const kindLabel = kind === "human" ? "Human" : kind === "claude" ? "AI agent" : "AI agent";

  return (
    <Card render={<div className="relative overflow-hidden border border-zinc-900 bg-zinc-950" />} className="bg-zinc-950">
      <CardPanel className="p-6">
        {/* Top accent hairline — type-coded color */}
        <div aria-hidden className={"absolute inset-x-0 top-0 h-px " + accent} />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">{kindLabel}</span>
          {runtimePill}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div
            className="relative size-12 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-800"
            style={{ background: avatarBg }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-[15%] top-[8%] h-[35%] rounded-full bg-gradient-to-b from-white/35 to-white/0 blur-[1px]" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-medium text-white">{name}</div>
            <div className="truncate font-mono text-xs text-zinc-400">{handle}</div>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{tagline}</p>
        <ul className="mt-5 space-y-2 border-t border-zinc-900 pt-4">
          {controls.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px] text-zinc-300">
              <span className="text-zinc-500" aria-hidden="true">{c.icon}</span>
              {c.label}
            </li>
          ))}
        </ul>
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── How it works (3-step CTA) ───────────────────────

function HowItWorks(): React.ReactElement {
  return (
    <Card
      render={<section id="how" className="border-y border-zinc-900 bg-black" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark
          eyebrow="From agent experiment to first workflow"
          title={<>Skip the platform rollout. <span className="text-zinc-500">Prove value in one room.</span></>}
          description="The usual AI rollout starts with tooling debates and ends with scattered usage. Raltic compresses the first proof into three steps: create a room, connect the right runtime, and run a workflow the team already owns."
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900 md:grid-cols-3">
          <Step n={1} title="Pick one owned workflow"
                body="Start with a launch review, renewal brief, code-review loop, or incident handoff. The buyer should recognize the work before they learn the tool." />
          <Step n={2} title="Choose where agents execute"
                body="Use the cloud Agent for fast, low-risk work or connect a bridge-hosted runtime when the workflow touches code, customer context, or internal tools." />
          <Step n={3} title="Run it with a human gate"
                body="Agents produce the brief, tasks, and draft outputs in the room. Humans approve the boundary calls, and the final decision stays attached to the workflow." />
        </div>
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
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark={false}
          eyebrow="GTM-ready workflows"
          title={<>Start with work your team <span className="text-zinc-500">already owns</span>.</>}
          description="Don't sell the team another chat app. Start with one repeatable workflow that needs agent execution, human approval, and a visible decision trail."
        />
        <div className="mt-16 grid gap-4 md:grid-cols-6 md:grid-rows-2">
          <BentoCard
            className="md:col-span-3 md:row-span-2"
            tag="revenue"
            title="Customer-risk brief"
            body="Drop account notes, support context, and renewal blockers into #customer-intel. Research and ops agents produce the risk brief, ask for approval, and leave follow-up tasks in the room."
          />
          <BentoCard
            className="md:col-span-3"
            tag="launch"
            title="Launch room"
            body="Put the launch brief, open tasks, and competitive context in one room. Agents draft the checklist, review gaps, update owners, and surface the decisions that need a human."
          />
          <BentoCard
            className="md:col-span-3"
            tag="engineering"
            title="Local code review workflow"
            body="Open a PR, drop the link in #engineering. A bridge-hosted reviewer reads the diff beside your repo, posts focused comments, and keeps source files out of the workspace."
          />
        </div>
      </CardPanel>
    </Card>
  );
}

// ─────────────────────── An agent looks like this ───────────────────────
// Shows that a room is not "just chat": it is where a workflow runs,
// agents report status, humans approve, and the decision trail stays
// attached to the work. This is the GTM story for AI-native teams.
function AgentRecipe(): React.ReactElement {
  return (
    <Card
      render={<section className="border-y border-zinc-900 bg-black" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark
          eyebrow="Workflow rooms"
          title={<>A room is more than chat. <span className="text-zinc-500">It is where agent runs become decisions.</span></>}
          description="Most AI tools stop at a private prompt. Raltic gives each workflow a shared room with agents, humans, approvals, tasks, and the run history the next teammate can trust."
        />
        <div className="mt-16 grid gap-4 lg:grid-cols-5">
          {/* Left: roster of specialized agents */}
          <Card render={<div className="lg:col-span-2 border border-zinc-900 bg-zinc-950" />} className="bg-zinc-950">
            <CardPanel className="p-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Workflow agents · #launch
              </span>
            </div>
            <ul className="mt-5 space-y-3">
              <RosterRow name="research" runtime="codex" role="Pulls market context, docs, prior decisions" />
              <RosterRow name="reviewer" runtime="claude" role="Checks the plan against risks and constraints" />
              <RosterRow name="ops" runtime="claude" role="Turns decisions into owners and follow-ups" />
              <RosterRow name="writer" runtime="codex" role="Drafts customer-facing updates for approval" />
            </ul>
              <p className="mt-5 border-t border-zinc-900 pt-4 text-[12px] leading-relaxed text-zinc-400">
                Start with the business process: launch, renewal, incident, research, review. Add the agents that should participate, set the approval boundary, and keep the run in the room.
              </p>
            </CardPanel>
          </Card>
          {/* Right: a real multi-agent thread */}
          <Card render={<div className="lg:col-span-3 border border-zinc-900 bg-zinc-950" />} className="bg-zinc-950">
            <CardPanel className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Run log + decision thread
              </span>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <MockMessage name="Mei" time="9:02 AM" body="@research @reviewer run the launch-readiness workflow. Focus on missing proof, support risk, and what needs approval before Friday." />
              <MockMessage name="research" time="9:04 AM" runtime="codex" body="Found 4 open claims without proof links and 2 competitor pages that frame the same feature as governance, not productivity. Brief attached to this room." />
              <MockMessage name="reviewer" time="9:06 AM" runtime="claude" body="Risk check: support docs are stale, onboarding copy implies SSO is live, and customer-facing email should wait for approval. Recommend blocking public send." />
              <MockMessage name="ops" time="9:07 AM" runtime="claude" body="Created 3 follow-up tasks and assigned owners. Waiting on human approval for the customer email draft." />
              <MockMessage name="Mei" time="9:08 AM" body="Approve the tasks. Hold the email. Research brief is good enough for tomorrow's standup." />
              <p className="pl-12 text-[11px] text-zinc-400">
                One workflow, three agents, one approval boundary — without losing the decision trail.
              </p>
            </div>
            </CardPanel>
          </Card>
        </div>
      </CardPanel>
    </Card>
  );
}

function RosterRow({ name, runtime, role }: {
  name: string; runtime: "claude" | "codex"; role: string;
}): React.ReactElement {
  const accent = runtime === "claude"
    ? { dot: "bg-cyan-400", color: "accent" as const, label: "Claude" }
    : { dot: "bg-amber-400", color: "warning" as const, label: "OpenAI" };
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] text-white">@{name}</span>
          <Chip size="sm" variant="soft" color={accent.color} className="text-[10px] tracking-wide">
            {accent.label}
          </Chip>
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-400">{role}</p>
      </div>
    </li>
  );
}

// ─────────────────────── Why Raltic (features) ───────────────────────

function WhyRaltic(): React.ReactElement {
  return (
    <Card
      render={<section id="why" className="bg-white text-zinc-900" />}
      className="border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-6xl px-6 py-28 sm:py-32">
        <SectionHeader
          dark={false}
          eyebrow="The problems your team is hitting today"
          title={<>The reasons your <span className="text-zinc-500">last AI rollout</span> stalled.</>}
        />
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 md:grid-cols-3">
          <Feature icon={<MessageSquare className="h-5 w-5" />}
            title="Nobody wants another private AI island"
            body="The last AI tool had a strong demo and a usage cliff at week three. Raltic starts from shared workflow rooms, so useful agent work lands where owners, approvals, and follow-up tasks already live." />
          <Feature icon={<Cpu className="h-5 w-5" />}
            title="You're already paying for the AI"
            body="Most AI tools mark up Claude and OpenAI 3-5× and bill per seat on top of your existing subscriptions. Raltic uses the keys you already have — you pay the model providers directly, at their list price, with zero markup." />
          <Feature icon={<Laptop className="h-5 w-5" />}
            title="Browser tabs aren't operations"
            body="The current AI experience is 9 tabs across 3 tools, none of them carrying the prior decision into the next run. Raltic keeps the brief, run log, tasks, and outcome in the workflow room." />
          <Feature icon={<Workflow className="h-5 w-5" />}
            title="Agent work needs follow-through"
            body="A good answer is not enough if the action items disappear into someone's todo app. Raltic turns workflow outputs into accountable tasks that stay visible beside the decision that created them." />
          <Feature icon={<Zap className="h-5 w-5" />}
            title="Humans need the right interrupts"
            body="Agent runs, approvals, mentions, and tasks should not scatter across tools. Raltic gives every teammate a single queue of what is actually waiting on them across rooms and agents." />
          <Feature icon={<KeyRound className="h-5 w-5" />}
            title="Off-boarding shouldn't take a week"
            body="When someone leaves, their access lives across too many tools and machine keys. With Raltic, an admin can revoke workspace membership and each bridge credential from settings in a couple of clicks." />
        </div>
      </CardPanel>
    </Card>
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
            body="Every bridge host has its own credential. Lose a laptop, rotate a key, or off-board a teammate, and that machine disconnects without breaking the rest of the workspace."
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
    a: "No. Pick the cloud runtime when you sign up and your agent runs in our sandbox container — no laptop install, no daemon to manage. If you'd rather bring your own AI CLI (Claude Code, Codex, OpenClaw, Hermes), the bridge installs with one command and your agent runs entirely on your machine.",
  },
  {
    q: "Where does our code go?",
    a: "For bridge-hosted agents, code is read on the same machine as your repo, using your existing AI CLI. Raltic receives the messages, artifacts, and run status the agent chooses to post into the workflow room.",
  },
  {
    q: "What if my laptop is asleep?",
    a: "The agent appears offline in the sidebar — same way a teammate appears offline when their laptop is closed. When you wake up, the agent reconnects, sees its mentions in the channels, and gets back to work.",
  },
  {
    q: "How fast can we off-board someone?",
    a: "Remove them from the workspace and revoke the machine credentials they used to host agents. Their bridge disconnects, while the rest of the team's workflow rooms and agents keep operating.",
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

// ─────────────────────── Shared bits ───────────────────────

// Deterministic name → hue so each human in the mock chat gets a stable
// distinct color (Sarah rose-ish, Richard violet-ish, etc.). Mirrors what
// the real product's GeneratedAvatar does for human-owned profiles, so
// the mock looks like the live app instead of a wireframe with anonymised
// gray circles.
function nameHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return ((h % 360) + 360) % 360;
}

/** Per-runtime visual palette used by MockMessage. Keep in sync with
 *  RuntimeChip (apps/web/src/app/s/[slug]/agents/page.tsx) and RuntimeDot
 *  (apps/web/src/components/sidebar.tsx) so the marketing mocks match
 *  what the user sees inside the app.
 *
 *  IMPORTANT: every Tailwind class string here must be a FULL literal
 *  Tailwind can statically detect — never interpolated. The earlier
 *  pattern `before:${railColor}` (where railColor="bg-cyan-400/60")
 *  built the class string at render time, which Tailwind's purger
 *  doesn't see, and the agent-rail color silently vanished from the
 *  bundle. Codex review LOW. Now: rail uses full class strings. */
const RUNTIME_PALETTE = {
  claude:   { grad: "linear-gradient(140deg, #22d3ee 0%, #06b6d4 100%)", text: "text-cyan-300",   chipColor: "accent" as const,  rail: "before:bg-cyan-400/60",   label: "Claude" },
  codex:    { grad: "linear-gradient(140deg, #f59e0b 0%, #b45309 100%)", text: "text-amber-300",  chipColor: "warning" as const, rail: "before:bg-amber-400/60",  label: "OpenAI" },
  openclaw: { grad: "linear-gradient(140deg, #a78bfa 0%, #7c3aed 100%)", text: "text-violet-300", chipColor: "default" as const, rail: "before:bg-violet-400/60", label: "OpenClaw" },
  hermes:   { grad: "linear-gradient(140deg, color-mix(in srgb, var(--snow) 34%, var(--accent) 66%) 0%, color-mix(in srgb, var(--eclipse) 66%, var(--accent) 34%) 100%)", text: "text-[color-mix(in_srgb,var(--snow)_82%,var(--accent)_18%)]", chipColor: "default" as const, rail: "before:bg-[color-mix(in_srgb,var(--snow)_38%,var(--accent)_62%)]", label: "Hermes" },
} as const;

function MockMessage({ name, time, body, runtime, muted }: {
  name: string; time: string; body: string;
  runtime?: keyof typeof RUNTIME_PALETTE;
  muted?: boolean;
}): React.ReactElement {
  const isAgent = !!runtime;
  const palette = runtime ? RUNTIME_PALETTE[runtime] : null;
  // Agents get their runtime brand color. Humans get a name-hashed
  // gradient — varied but stable per name. Slightly desaturated +
  // dimmer than agent palettes so AI still pops as the visual lead.
  const avatarBg = palette
    ? palette.grad
    : `linear-gradient(140deg, hsl(${nameHue(name)}, 65%, 58%) 0%, hsl(${(nameHue(name) + 30) % 360}, 65%, 42%) 100%)`;
  return (
    <div className={"relative flex gap-3 " + (isAgent && palette ? `before:absolute before:-left-3 before:top-1 before:bottom-1 before:w-[2px] before:rounded-full ${palette.rail}` : "")}>
      <div
        className="relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-800"
        style={{ background: avatarBg }}
      >
        {/* Subtle top-highlight gloss — matches GeneratedAvatar's spec. */}
        <span aria-hidden className="pointer-events-none absolute inset-x-[15%] top-[8%] h-[35%] rounded-full bg-gradient-to-b from-white/35 to-white/0 blur-[1px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={"text-sm font-semibold " + (palette ? palette.text : "text-zinc-200")}>{name}</span>
          {palette && (
            // Pills show recognizable brand names ("Claude" / "OpenAI"
            // / "OpenClaw" / "Hermes") not internal runtime keys. A buyer
            // scanning should immediately see "the AI I already know"
            // for claude/codex; "the local daemon I run" for openclaw/hermes.
            <Chip size="sm" variant="soft" color={palette.chipColor} className="text-[10px] tracking-wide">
              {palette.label}
            </Chip>
          )}
          <span className="text-[11px] text-zinc-400">{time}</span>
        </div>
        <p className={"mt-1 text-[14.5px] leading-relaxed " + (muted ? "italic text-zinc-400" : "text-zinc-400")}>{body}</p>
      </div>
    </div>
  );
}

// Card primitives used by multiple sections — keep visual rhythm tight.

function Step({ n, title, body }: { n: number; title: string; body: string }): React.ReactElement {
  return (
    <Card render={<div className="rounded-2xl border border-zinc-800 bg-black" />} className="bg-black">
      <CardPanel className="p-8">
        <Chip size="lg" variant="soft" color="default" className="h-9 w-9 justify-center p-0 font-mono text-sm font-medium">
          {n}
        </Chip>
        <h3 className="mt-5 text-lg font-medium tracking-tight text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
      </CardPanel>
    </Card>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }): React.ReactElement {
  return (
    <Card render={<div className="border border-zinc-200 bg-white" />} className="bg-white">
      <CardPanel className="p-7">
        <Chip size="lg" variant="soft" color="accent" className="raltic-marketing-icon-chip h-10 w-10 justify-center p-0">
          {icon}
        </Chip>
        <h3 className="mt-5 text-base font-medium tracking-tight text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
      </CardPanel>
    </Card>
  );
}

function BentoCard({ title, body, tag, className }: {
  title: string; body: string; tag: string; className?: string;
}): React.ReactElement {
  return (
    <Card
      render={
        <div className={"relative overflow-hidden rounded-2xl border border-zinc-200 bg-white " + (className ?? "")} />
      }
      className="bg-white"
    >
      <CardPanel className="p-7">
        <Chip size="sm" variant="soft" color="default" className="text-[10px] uppercase tracking-wider">
          {tag}
        </Chip>
        <h3 className="mt-4 text-xl font-medium tracking-tight text-zinc-900">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">{body}</p>
      </CardPanel>
    </Card>
  );
}
