"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileText,
  GitPullRequest,
  LineChart,
  ListChecks,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/heroui-pro/button";
import { Chip } from "@/components/heroui-pro/chip";
import { cn } from "@/lib/utils";

type ScenarioKey = "revenue" | "launch" | "engineering";

type WorkflowScenario = {
  key: ScenarioKey;
  label: string;
  shortLabel: string;
  room: string;
  owner: string;
  icon: React.ReactNode;
  brief: string;
  agents: { name: string; runtime: "Claude" | "Codex"; job: string }[];
  approval: string;
  output: string;
  metric: string;
  chips: string[];
};

const SCENARIOS: WorkflowScenario[] = [
  {
    key: "revenue",
    label: "Customer risk",
    shortLabel: "Risk",
    room: "#customer-risk",
    owner: "GTM",
    icon: <LineChart className="h-4 w-4" aria-hidden="true" />,
    brief: "Renewal risk brief for Acme before the next account call.",
    agents: [
      { name: "research", runtime: "Codex", job: "Pull call notes + competitor context" },
      { name: "ops", runtime: "Claude", job: "Turn blockers into owned follow-ups" },
    ],
    approval: "Human approves customer-facing draft.",
    output: "Risk brief, email draft, 3 assigned tasks.",
    metric: "15 min to account plan",
    chips: ["calls", "support", "renewal"],
  },
  {
    key: "launch",
    label: "Launch room",
    shortLabel: "Launch",
    room: "#launch-readiness",
    owner: "Product",
    icon: <ClipboardCheck className="h-4 w-4" aria-hidden="true" />,
    brief: "Ship decision for a feature that needs proof, docs, and support review.",
    agents: [
      { name: "reviewer", runtime: "Claude", job: "Find missing proof + risk" },
      { name: "writer", runtime: "Codex", job: "Draft launch checklist" },
    ],
    approval: "Human blocks public send until docs are ready.",
    output: "Decision log, launch checklist, owner map.",
    metric: "1 room for launch state",
    chips: ["docs", "proof", "support"],
  },
  {
    key: "engineering",
    label: "Code review",
    shortLabel: "Code",
    room: "#code-review",
    owner: "Eng",
    icon: <GitPullRequest className="h-4 w-4" aria-hidden="true" />,
    brief: "Review a PR without uploading repo context into a hosted AI tool.",
    agents: [
      { name: "reviewer", runtime: "Claude", job: "Read local diff via bridge" },
      { name: "tester", runtime: "Codex", job: "Map failing paths to fixes" },
    ],
    approval: "Human accepts only actionable review items.",
    output: "Focused comments, task links, review record.",
    metric: "code stays local",
    chips: ["PR", "tests", "owner"],
  },
];

export function WorkflowPreview(): React.ReactElement {
  const [activeKey, setActiveKey] = useState<ScenarioKey>("revenue");
  const active = useMemo(
    () => SCENARIOS.find((scenario) => scenario.key === activeKey) ?? SCENARIOS[0],
    [activeKey],
  );

  return (
    <div
      data-testid="workflow-preview"
      className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-left shadow-[0_30px_80px_-20px_rgba(34,211,238,0.20)]"
    >
      <div className="flex flex-col gap-3 border-b border-zinc-900 bg-black/35 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">Workflow room</p>
            <p className="truncate font-mono text-[11px] text-zinc-400">{active.room}</p>
          </div>
        </div>
        <div role="group" aria-label="Workflow examples" className="grid w-full grid-cols-3 gap-1 rounded-lg border border-zinc-800 bg-zinc-900/70 p-1 sm:w-auto">
          {SCENARIOS.map((scenario) => {
            const selected = scenario.key === active.key;
            return (
              <Button
                key={scenario.key}
                type="button"
                aria-pressed={selected}
                onPress={() => setActiveKey(scenario.key)}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 min-w-0 justify-center gap-1.5 rounded-md border border-transparent px-2 text-[11px] font-medium shadow-none transition",
                  selected
                    ? "border-cyan-400/30 bg-cyan-400 text-zinc-950"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                )}
              >
                {scenario.icon}
                <span className="hidden truncate sm:inline">{scenario.label}</span>
                <span className="sm:hidden">{scenario.shortLabel}</span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.05fr_1.55fr_0.95fr]">
        <div className="border-b border-zinc-900 p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">01 brief</p>
          <h3 className="mt-3 text-xl font-medium leading-tight text-white">{active.brief}</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {active.chips.map((chip) => (
              <Chip key={chip} size="sm" variant="soft" color="default" className="font-mono text-[10px] uppercase tracking-wider">
                {chip}
              </Chip>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-zinc-800 bg-black/40 p-3">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-zinc-400">owner</span>
              <span className="font-medium text-zinc-200">{active.owner}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-3/4 rounded-full bg-cyan-400" />
            </div>
          </div>
        </div>

        <div className="border-b border-zinc-900 p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">02 agents run</p>
          <div className="mt-4 grid gap-3">
            {active.agents.map((agent) => (
              <div key={agent.name} className="rounded-xl border border-zinc-800 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      agent.runtime === "Claude" ? "bg-cyan-400" : "bg-amber-400",
                    )} />
                    <span className="truncate font-mono text-sm text-white">@{agent.name}</span>
                  </div>
                  <Chip size="sm" variant="soft" color={agent.runtime === "Claude" ? "accent" : "warning"} className="text-[10px]">
                    {agent.runtime}
                  </Chip>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{agent.job}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
            <span>{active.approval}</span>
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">03 memory</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <FileText className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                Decision packet
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{active.output}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ListChecks className="h-4 w-4 text-amber-300" aria-hidden="true" />
                Next actions
              </div>
              <div className="mt-3 space-y-2 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  assigned owner
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  searchable run log
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">outcome</span>
            <span className="text-sm font-medium text-white">{active.metric}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-zinc-900 px-5 py-3 text-[12px] text-zinc-400">
        <span>Brief</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span>agent run</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span>approval</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-zinc-300">team memory</span>
      </div>
    </div>
  );
}

export function WorkflowMiniMap(): React.ReactElement {
  const steps = [
    { label: "Brief", icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
    { label: "Agents", icon: <Code2 className="h-4 w-4" aria-hidden="true" /> },
    { label: "Approval", icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" /> },
    { label: "Memory", icon: <ListChecks className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <div className="grid gap-2 md:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.label} className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-black text-cyan-300">
              {step.icon}
            </span>
            {step.label}
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-zinc-700 md:block" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
