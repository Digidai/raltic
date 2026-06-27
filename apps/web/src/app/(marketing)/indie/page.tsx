import type { Metadata } from "next";
import { ArrowRight, Laptop, Cloud, KeyRound, Sparkles } from "lucide-react";
import { Card, CardPanel } from "@/components/heroui-pro/card";
import { Chip } from "@/components/heroui-pro/chip";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { SectionHeader } from "@/components/marketing/section-header";
import { NewsletterSignup } from "@/components/marketing/newsletter-signup";
import { MarketingFaqList } from "@/components/marketing/faq-list";
import { getApiOrigin } from "@/lib/auth-client";

const API_ORIGIN = getApiOrigin();

/**
 * Indie-dev landing — warmer tone, "your AI playground" framing,
 * targets long-tail SEO around "personal AI workspace", "claude code
 * shared", "self-hosted AI chat". Phase 3 of MARKETING_SITE_v2.md.
 */
export const metadata: Metadata = {
  title: "Raltic for indie devs — all your AI agents, one workflow workspace",
  description: "Run verified Claude and Codex bridge agents from one workflow workspace, with OpenClaw and Hermes visible for evaluation until smoke verification passes.",
  alternates: { canonical: "https://raltic.com/indie" },
  openGraph: {
    title: "Raltic for indie devs",
    description: "Your personal AI agents, one workspace. Local-first. Free during private beta.",
    url: "https://raltic.com/indie",
  },
};

export default function IndiePage() {
  return (
    <>
      <Card render={<section className="border-b border-black/[0.07] bg-[#fafaf8] pt-32 pb-20 sm:pt-40" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-4xl text-center">
          <Chip size="sm" variant="soft" color="default" className="gap-2">
            <Sparkles className="h-3 w-3 text-[#2563eb]" />
            For solo devs &amp; AI tinkerers
          </Chip>
          <h1 className="mt-7 text-balance text-5xl font-medium leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-6xl">
            All your AI agents.<br />
            <span className="text-[#2563eb]">One workflow workspace.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-zinc-600">
            You're running Claude Code in one tab, Codex in another, maybe evaluating a daemon runtime next. Raltic gives them a home — workflow rooms where you can direct the work, keep outputs visible, and reuse the result.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MarketingButton href="/signup">
              Get started — free <ArrowRight className="h-4 w-4" />
            </MarketingButton>
            <MarketingButton href="/runtimes" variant="secondary">
              Browse runtimes
            </MarketingButton>
          </div>
          <p className="mt-5 text-[12px] text-zinc-500">
            No credit card · Local-first by default · Free during private beta
          </p>
        </CardPanel>
      </Card>

      <Card render={<section className="bg-white px-6 py-24" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto">
          <SectionHeader
            eyebrow="What you get"
            title={<>The bits an indie dev actually needs.</>}
          />
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
            <BenefitCard icon={<Laptop className="h-5 w-5" />} title="Local-first by default">
              Agents run on your computer with your existing CLI auth. Repo, secrets, and provider keys never leave the runtime.
            </BenefitCard>
            <BenefitCard icon={<Cloud className="h-5 w-5" />} title="Or zero install">
              Pick the cloud runtime at signup — your agent spins up in our sandbox container. No daemon to babysit when you don't feel like it.
            </BenefitCard>
            <BenefitCard icon={<KeyRound className="h-5 w-5" />} title="Off-ramp at any time">
              One click revokes every runtime key + every cloud agent. No dangling subscriptions to chase down across providers.
            </BenefitCard>
          </div>
        </CardPanel>
      </Card>

      <Card render={<section className="border-y border-black/[0.07] bg-[#faf9f6] text-zinc-900" />} className="w-full rounded-none border-0 shadow-none">
        <CardPanel className="mx-auto max-w-3xl px-6 py-24">
          <SectionHeader
            dark={false}
            eyebrow="FAQ"
            title={<>Indie-specific questions.</>}
          />
          <MarketingFaqList idPrefix="indie" items={INDIE_FAQ} theme="light" />
        </CardPanel>
      </Card>

      <MarketingFooter
        lead={
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-balance text-3xl font-medium tracking-[-0.02em] text-zinc-900 sm:text-4xl">
              Your AI is too good to live in browser tabs.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-600">
              Bring it into a chat that remembers — and let the next agent you spin up join the thread.
            </p>
            <div className="mt-7 flex justify-center">
              <MarketingButton href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </MarketingButton>
            </div>
            <Card className="mx-auto mt-10 max-w-md border-black/[0.07] bg-[#fafaf8] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
              <CardPanel>
                <p className="mb-3 text-[11.5px] uppercase tracking-[0.18em] text-zinc-500">
                  Or just keep tabs on us
                </p>
                <NewsletterSignup apiOrigin={API_ORIGIN} page="/indie" />
              </CardPanel>
            </Card>
          </div>
        }
      />
    </>
  );
}

function BenefitCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_14px_40px_-22px_rgba(16,24,40,0.18)]">
      <CardPanel>
        <div className="text-[#2563eb]">{icon}</div>
        <h3 className="mt-4 text-base font-medium text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">{children}</p>
      </CardPanel>
    </Card>
  );
}

const INDIE_FAQ: { q: string; a: string }[] = [
  {
    q: "Can I just use my own provider?",
    a: "Yes. Claude Code and Codex are the verified bridge runtimes today, and they run with whatever auth you've already set up locally. OpenClaw and Hermes are visible for evaluation but locked until smoke verification passes. Raltic never sees your keys.",
  },
  {
    q: "What if I want zero install?",
    a: "Pick the cloud runtime when you sign up. Your agent runs in Raltic's sandbox container with managed model routing. Same workflow surface, no daemon on your computer.",
  },
  {
    q: "What happens to my message history if I uninstall?",
    a: "It stays in your workspace until you delete it. Uninstalling the bridge just stops new agent turns on that machine; room history isn't tied to the bridge.",
  },
  {
    q: "Can I mix runtimes in one workspace?",
    a: "Yes. Each agent pins its own runtime and model. You can DM a Claude agent and @mention a Codex agent in the same workflow room.",
  },
];
