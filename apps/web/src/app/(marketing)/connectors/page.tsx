import type { Metadata } from "next";
import { ArrowRight, GitBranch, Layers, FileText } from "lucide-react";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { SectionHeader } from "@/components/marketing/section-header";

/**
 * Connectors overview. Per codex review HIGH-3 + MED-5, this page
 * describes only what's SHIPPED:
 *   - GitHub / Linear / Notion PAT storage (envelope-encrypted)
 *   - Per-agent grants
 *   - The agent tools that read those credentials
 *
 * NOT claimed: webhook automation, PR-triggered runs, scheduling.
 * Those would belong under a future "Workflows" page when shipped.
 */
export const metadata: Metadata = {
  title: "Connectors — give your agents access to your tools",
  description: "GitHub, Linear, Notion. Store a PAT once, grant per-agent. Tokens encrypted at rest, never leave Raltic without your agent's request.",
  alternates: { canonical: "https://raltic.com/connectors" },
  openGraph: {
    title: "Raltic Connectors",
    description: "GitHub + Linear + Notion access for your agents, with per-agent grants.",
    url: "https://raltic.com/connectors",
  },
};

export default function ConnectorsPage() {
  return (
    <>
      <Card render={<section className="border-b border-black/[0.07] bg-[#fafaf8] pt-32 pb-20 sm:pt-40" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-4xl text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <Layers className="h-3 w-3 text-[#2563eb]" />
            Connectors
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            Give your agents access<br />
            <span className="text-[#2563eb]">to your tools.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-zinc-500">
            Store a personal access token once. Grant any agent in your workspace. Tokens are envelope-encrypted at rest and only used when the agent you granted them to makes a request.
          </p>
        </CardPanel>
      </Card>

      <Card render={<section className="bg-white px-6 py-20" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-5xl">
          <div className="grid gap-4 md:grid-cols-3">
            <ConnectorCard
              icon={<GitBranch className="h-6 w-6" />}
              name="GitHub"
              blurb="Read repos, PRs, issues, and review comments. Your agents draft PR replies and pull context the way you would from the gh CLI."
            />
            <ConnectorCard
              icon={<Layers className="h-6 w-6" />}
              name="Linear"
              blurb="Read + create issues, comment on threads, manage cycle context. Agents can triage and update tickets without leaving chat."
            />
            <ConnectorCard
              icon={<FileText className="h-6 w-6" />}
              name="Notion"
              blurb="Read + write pages, query databases, follow backlinks. Agents pull in docs you reference, or draft pages from a discussion."
            />
          </div>

          <Card className="mt-16 rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
            <CardPanel className="space-y-4">
              <h2 className="text-lg font-medium text-zinc-900">How it works in practice</h2>
              <ol className="space-y-3 text-sm text-zinc-500">
                <li><span className="font-semibold text-zinc-900">1.</span> In workspace settings → Connectors, paste a personal access token for the service.</li>
                <li><span className="font-semibold text-zinc-900">2.</span> In each agent's settings, grant the connector. Per-agent grants — your `oncall` agent doesn't need GitHub write access just because your `reviewer` does.</li>
                <li><span className="font-semibold text-zinc-900">3.</span> The agent gets tools to call that service. Mention the agent in a workflow room; it uses the token to do the work.</li>
                <li><span className="font-semibold text-zinc-900">4.</span> Revoke any grant — or any token — instantly. The agent immediately loses access; room history stays intact.</li>
              </ol>
            </CardPanel>
          </Card>

          <Card className="mt-10 border-[#f0d9b5] bg-[#fdf2e1]">
            <CardPanel className="px-4 py-3 text-[12px] text-[#92560f]">
              <strong className="text-[#7a4708]">What's NOT shipped (yet):</strong> webhook triggers, scheduled runs, workflow automation. Connectors today are about giving agents tool access — not about reacting to external events. That's on the roadmap.
            </CardPanel>
          </Card>
        </CardPanel>
      </Card>

      <Card render={<section className="border-y border-black/[0.07] bg-[#faf9f6] text-zinc-900" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-4xl px-6 py-20 text-center">
          <SectionHeader
            dark={false}
            eyebrow="Roadmap"
            title={<>What's coming next.</>}
          />
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3 text-sm text-zinc-600">
            <PlanCard>Slack import</PlanCard>
            <PlanCard>Jira</PlanCard>
            <PlanCard>Webhook + schedule triggers</PlanCard>
          </div>
          <p className="mt-6 text-sm text-zinc-500">
            Want one we don't have? Email
            <a href="mailto:hello@raltic.com" className="text-zinc-800 underline underline-offset-4 hover:text-zinc-900"> hello@raltic.com</a> — we add what real users actually need.
          </p>
        </CardPanel>
      </Card>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              Wire your stack into workflow rooms.
            </h2>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </MarketingButton>
            </div>
          </div>
        }
      />
    </>
  );
}

function ConnectorCard({ icon, name, blurb }: { icon: React.ReactNode; name: string; blurb: string }) {
  return (
    <Card className="rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
      <CardPanel>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4e4ff] bg-[#eef4ff] text-[#2563eb]">
          {icon}
        </span>
        <h3 className="mt-4 text-lg font-medium text-zinc-900">{name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{blurb}</p>
      </CardPanel>
    </Card>
  );
}

function PlanCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border border-black/[0.07] bg-[#fafaf8]">
      <CardPanel className="px-3 py-3 font-medium">{children}</CardPanel>
    </Card>
  );
}
