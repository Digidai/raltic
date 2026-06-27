/**
 * Raltic brand primitives — tiny set of building blocks so we don't
 * repeat token-gradient strings in 20 files. Keep it small.
 */

import { cn } from "@/lib/utils";

/** Token-driven brand gradient as a text fill — use for hero words / titles. */
export function GradientText({
  className,
  children,
}: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn(
      "bg-[linear-gradient(90deg,var(--accent),var(--accent-hover),var(--warning))] bg-clip-text text-transparent",
      className,
    )}>
      {children}
    </span>
  );
}

/** Small monogram circle filled with the brand gradient — used as the
 *  workspace icon in the sidebar header so the chrome carries the brand
 *  without resorting to a logo image. Uses Raltic theme tokens so it
 *  follows the installed HeroUI Pro theme instead of a fixed hue pair. */
export function BrandMonogram({
  letter,
  size = "md",
  className,
}: {
  letter: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "size-6 text-[11px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
    xl: "size-14 text-lg",
  };
  return (
    <div
      className={cn(
        // Letter sits on the blue→amber brand gradient, so it must stay
        // dark for legibility on BOTH halves — not tied to
        // --accent-foreground (which is white, for solid accent buttons).
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-[var(--eclipse)] ring-1 ring-accent/20",
        sizes[size],
        className,
      )}
      style={{
        background: [
          "radial-gradient(circle at 28% 22%, color-mix(in srgb, var(--white) 55%, transparent) 0%, transparent 42%)",
          "radial-gradient(circle at 72% 78%, color-mix(in srgb, var(--black) 20%, transparent) 0%, transparent 55%)",
          "linear-gradient(140deg, var(--accent) 0%, var(--warning) 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 color-mix(in srgb, var(--white) 48%, transparent)",
          "inset 0 -2px 4px color-mix(in srgb, var(--black) 18%, transparent)",
          "0 4px 14px -4px color-mix(in srgb, var(--accent) 55%, transparent)",
          "0 2px 6px -2px color-mix(in srgb, var(--warning) 40%, transparent)",
        ].join(", "),
        textShadow: "0 1px 2px color-mix(in srgb, var(--black) 18%, transparent)",
      }}
      aria-hidden
    >
      <span className="relative z-[1]">{letter.charAt(0).toUpperCase()}</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[15%] top-[8%] h-[35%] rounded-full bg-gradient-to-b from-white/55 to-white/0 blur-[1px]"
      />
    </div>
  );
}

/** Section divider that fades through the current accent — used between sidebar
 *  groups to add a hint of structure without a hard line. */
export function BrandHairline({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--accent)_28%,transparent),transparent)]",
        className,
      )}
    />
  );
}
