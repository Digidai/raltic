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
import { cn } from "@/lib/utils";

// ───────────────────────────────────────────────────────────────────────────
// Light "ando-style" workflow mockup shown in the marketing hero.
//
// Visual language follows ando.so: warm-white surface, hairline black/8%
// borders, soft shadow, generous radius, sky-blue (#2563eb) as the single
// accent, monochrome black-opacity text. The component keeps every e2e
// hook intact (data-testid, tab button names + aria-pressed, the metric /
// brief copy), so this is a re-skin, not a content change.
// ───────────────────────────────────────────────────────────────────────────

const ACCENT = "#2563eb";

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
      className="relative overflow-hidden rounded-[24px] border border-black/[0.08] bg-white text-left shadow-[0_2px_4px_rgba(16,24,40,0.04),0_24px_60px_-28px_rgba(16,24,40,0.28)]"
    >
      <div className="flex flex-col gap-3 border-b border-black/[0.07] bg-[#fafaf8] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
            style={{ color: ACCENT, borderColor: "#d4e4ff", backgroundColor: "#eef4ff" }}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-900">Workflow room</p>
            <p className="truncate font-mono text-[11px] text-zinc-500">{active.room}</p>
          </div>
        </div>
        <div role="group" aria-label="Workflow examples" className="grid w-full grid-cols-3 gap-1 rounded-full border border-black/[0.06] bg-zinc-100 p-1 sm:w-auto">
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
                  "h-8 min-w-0 justify-center gap-1.5 rounded-full border border-transparent px-3 text-[11px] font-medium shadow-none transition",
                  selected
                    ? "bg-white text-zinc-900 shadow-[0_1px_2px_rgba(16,24,40,0.10)]"
                    : "text-zinc-600 hover:text-zinc-900",
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
        <div className="border-b border-black/[0.07] p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">01 brief</p>
          <h3 className="mt-3 text-xl font-medium leading-snug text-zinc-900">{active.brief}</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {active.chips.map((chip) => (
              <span key={chip} className="rounded-full border border-black/[0.08] bg-[#fafaf8] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {chip}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-black/[0.07] bg-[#fafaf8] p-3">
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-zinc-500">owner</span>
              <span className="font-medium text-zinc-800">{active.owner}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: ACCENT }} />
            </div>
          </div>
        </div>

        <div className="border-b border-black/[0.07] p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">02 agents run</p>
          <div className="mt-4 grid gap-3">
            {active.agents.map((agent) => (
              <div key={agent.name} className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: agent.runtime === "Claude" ? ACCENT : "#d9821f" }}
                    />
                    <span className="truncate font-mono text-sm text-zinc-900">@{agent.name}</span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={
                      agent.runtime === "Claude"
                        ? { color: ACCENT, backgroundColor: "#eef4ff" }
                        : { color: "#92560f", backgroundColor: "#fdf2e1" }
                    }
                  >
                    {agent.runtime}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{agent.job}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-50 p-3 text-sm text-emerald-800">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{active.approval}</span>
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">03 memory</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <FileText className="h-4 w-4" style={{ color: ACCENT }} aria-hidden="true" />
                Decision packet
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{active.output}</p>
            </div>
            <div className="rounded-2xl border border-black/[0.07] bg-[#fafaf8] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                <ListChecks className="h-4 w-4 text-[#d9821f]" aria-hidden="true" />
                Next actions
              </div>
              <div className="mt-3 space-y-2 text-xs text-zinc-500">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: ACCENT }} aria-hidden="true" />
                  assigned owner
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" style={{ color: ACCENT }} aria-hidden="true" />
                  searchable run log
                </span>
              </div>
            </div>
          </div>
          <div
            className="mt-5 flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ borderColor: "#d4e4ff", backgroundColor: "#eef4ff" }}
          >
            <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: ACCENT }}>outcome</span>
            <span className="text-sm font-medium text-zinc-900">{active.metric}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-black/[0.07] bg-[#fafaf8] px-5 py-3 text-[12px] text-zinc-500">
        <span>Brief</span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        <span>agent run</span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        <span>approval</span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
        <span className="text-zinc-800">team memory</span>
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
        <div key={step.label} className="relative rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border"
              style={{ color: ACCENT, borderColor: "#d4e4ff", backgroundColor: "#eef4ff" }}
            >
              {step.icon}
            </span>
            {step.label}
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-zinc-300 md:block" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}
