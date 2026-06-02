import type { ReactNode } from "react";
import { Card, CardPanel } from "@/components/heroui-pro/card";

/**
 * Section header shared across marketing pages. Pared-down version
 * of the one inlined in apps/web/src/app/page.tsx — same visual
 * rhythm so secondary pages match the primary landing.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  dark = true,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  dark?: boolean;
}) {
  return (
    <Card
      render={<section />}
      className="w-full rounded-none border-0 bg-transparent shadow-none"
    >
      <CardPanel className="mx-auto max-w-3xl text-center">
        {eyebrow && (
          <p className={`text-[10.5px] font-medium uppercase tracking-[0.18em] ${dark ? "text-[var(--accent)]" : "text-[color-mix(in_srgb,var(--accent)_58%,var(--eclipse))]"}`}>
            {eyebrow}
          </p>
        )}
        <h2 className={`mt-4 text-balance text-4xl font-medium leading-[1.1] tracking-[-0.02em] sm:text-5xl ${dark ? "text-[var(--snow)]" : "text-foreground"}`}>
          {title}
        </h2>
        {description && (
          <p className={`mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed sm:text-lg ${dark ? "text-[color-mix(in_srgb,var(--snow)_68%,transparent)]" : "text-muted-foreground"}`}>
            {description}
          </p>
        )}
      </CardPanel>
    </Card>
  );
}
