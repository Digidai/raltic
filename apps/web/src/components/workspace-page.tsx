"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardPanel } from "@/components/heroui-pro/card";

type WorkspacePageTone =
  | "accent"
  | "warning"
  | "success"
  | "default"
  // Back-compat aliases for older page call sites. They intentionally map
  // to token-driven HeroUI surfaces instead of raw Tailwind color families.
  | "cyan"
  | "amber"
  | "emerald"
  | "violet";

const toneClass: Record<WorkspacePageTone, string> = {
  accent: "bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] ring-1 ring-accent/15",
  warning: "bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)] ring-1 ring-warning/15",
  success: "bg-[var(--success-soft)] text-[var(--success-soft-foreground)] ring-1 ring-success/15",
  default: "bg-[var(--default-soft)] text-[var(--default-soft-foreground)] ring-1 ring-border/60",
  cyan: "bg-[var(--accent-soft)] text-[var(--accent-soft-foreground)] ring-1 ring-accent/15",
  amber: "bg-[var(--warning-soft)] text-[var(--warning-soft-foreground)] ring-1 ring-warning/15",
  emerald: "bg-[var(--success-soft)] text-[var(--success-soft-foreground)] ring-1 ring-success/15",
  violet: "bg-[var(--default-soft)] text-[var(--default-soft-foreground)] ring-1 ring-border/60",
};

export function WorkspacePage({
  title,
  description,
  icon,
  tone = "default",
  actions,
  toolbar,
  children,
  contentClassName,
}: {
  title: string;
  description?: ReactNode;
  icon: ReactNode;
  tone?: WorkspacePageTone;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border/70 bg-background/85 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClass[tone])}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {toolbar && (
          <div className="mx-auto mt-3 w-full max-w-5xl">
            {toolbar}
          </div>
        )}
      </header>

      <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className={cn("mx-auto w-full max-w-5xl", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function WorkspaceEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="mx-auto w-full max-w-xl border-dashed border-border/70 bg-surface/70 text-center !shadow-none">
      <CardPanel className="p-8">
        <div className="mx-auto flex h-8 w-8 items-center justify-center text-muted-foreground/60" aria-hidden="true">
          {icon}
        </div>
        <p className="mt-3 text-sm font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardPanel>
    </Card>
  );
}
