import Link from "next/link";
import type { ReactElement } from "react";
import {
  ArrowRight,
  Check,
  CircleDot,
  Route,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VisualEmphasis = "attention" | "evidence" | "insight" | "reference";

const emphasisClasses: Record<VisualEmphasis, {
  accent: string;
  soft: string;
  border: string;
  line: string;
}> = {
  attention: {
    accent: "text-amber-800",
    soft: "bg-amber-50",
    border: "border-amber-200",
    line: "bg-amber-500",
  },
  reference: {
    accent: "text-blue-800",
    soft: "bg-blue-50",
    border: "border-blue-200",
    line: "bg-blue-600",
  },
  evidence: {
    accent: "text-emerald-700",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
    line: "bg-emerald-600",
  },
  insight: {
    accent: "text-violet-800",
    soft: "bg-violet-50",
    border: "border-violet-200",
    line: "bg-violet-600",
  },
};

export function ContentRouteMap({
  eyebrow,
  title,
  items,
  emphasis = "reference",
}: {
  eyebrow: string;
  title: string;
  items: Array<{ label: string; href: string }>;
  emphasis?: VisualEmphasis;
}): ReactElement {
  const colors = emphasisClasses[emphasis];
  return (
    <figure
      data-content-visual="route-map"
      className={cn("border-y px-6 py-10", colors.border, colors.soft)}
    >
      <div className="mx-auto max-w-6xl">
        <figcaption className="flex items-center gap-2">
          <Route className={cn("h-4 w-4", colors.accent)} aria-hidden="true" />
          <span className={cn("text-xs font-medium uppercase", colors.accent)}>{eyebrow}</span>
        </figcaption>
        <p className="mt-3 max-w-2xl text-xl font-medium leading-snug text-zinc-900">{title}</p>
        <ol className="mt-7 grid gap-0 border-l border-zinc-300 sm:grid-cols-2 sm:border-t sm:border-l-0 lg:grid-cols-4">
          {items.map((item, index) => (
            <li key={item.href} className="relative border-b border-zinc-300 py-4 pl-6 sm:border-r sm:border-b-0 sm:px-5 sm:py-5 last:border-r-0">
              <span
                className={cn(
                  "absolute top-5 -left-[5px] h-2.5 w-2.5 rounded-full ring-4 ring-white sm:-top-[5px] sm:left-5",
                  colors.line,
                )}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] text-zinc-500">{String(index + 1).padStart(2, "0")}</span>
              <a href={item.href} className="mt-1 block text-sm font-medium leading-snug text-zinc-800 hover:underline hover:underline-offset-4">
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </figure>
  );
}

export function EvidenceBoard({
  title,
  items,
  emphasis = "reference",
}: {
  title: string;
  items: string[];
  emphasis?: VisualEmphasis;
}): ReactElement {
  const colors = emphasisClasses[emphasis];
  return (
    <figure
      data-content-visual="evidence-board"
      className={cn("mt-7 border-y py-2", colors.border)}
    >
      <figcaption className="flex items-center gap-2 py-4">
        <CircleDot className={cn("h-4 w-4", colors.accent)} aria-hidden="true" />
        <span className="text-xs font-medium uppercase text-zinc-600">{title}</span>
      </figcaption>
      <ul className="grid border-t border-zinc-200 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={item} className="flex min-h-20 gap-3 border-b border-zinc-200 py-4 pr-4 sm:odd:border-r sm:odd:pr-5 sm:even:pl-5">
            <span className={cn("mt-0.5 font-mono text-[11px]", colors.accent)}>{String(index + 1).padStart(2, "0")}</span>
            <span className="text-sm leading-relaxed text-zinc-700">{item}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function ContextLink({
  href,
  label,
  description,
  emphasis = "reference",
}: {
  href: string;
  label: string;
  description: string;
  emphasis?: VisualEmphasis;
}): ReactElement {
  const colors = emphasisClasses[emphasis];
  return (
    <aside className={cn("my-8 border-s-2 py-1 ps-5", colors.border)}>
      <p className="text-[11px] font-medium uppercase text-zinc-500">Follow the decision</p>
      <Link href={href} className={cn("mt-2 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline", colors.accent)}>
        {label}
        <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </Link>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-600">{description}</p>
    </aside>
  );
}

export function ComparisonFitMap({
  competitor,
  competitorFits,
  ralticFits,
}: {
  competitor: string;
  competitorFits: string[];
  ralticFits: string[];
}): ReactElement {
  return (
    <figure data-content-visual="fit-map" className="border-y border-zinc-200 bg-[#fafaf8] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <figcaption className="flex items-center justify-center gap-2 text-center">
          <Scale className="h-4 w-4 text-blue-700" aria-hidden="true" />
          <span className="text-xs font-medium uppercase text-zinc-600">Decision map</span>
        </figcaption>
        <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-medium text-zinc-900">Choose by the job, not the category label.</h2>
        <div className="mt-10 grid border-y border-zinc-300 md:grid-cols-2">
          <div className="py-7 md:border-r md:border-zinc-300 md:pr-8">
            <p className="text-sm font-medium text-zinc-900">Choose {competitor} when</p>
            <ul className="mt-5 grid gap-4">
              {competitorFits.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-zinc-300 py-7 md:border-t-0 md:pl-8">
            <p className="text-sm font-medium text-zinc-900">Choose Raltic when</p>
            <ul className="mt-5 grid gap-4">
              {ralticFits.slice(0, 3).map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-600">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}
