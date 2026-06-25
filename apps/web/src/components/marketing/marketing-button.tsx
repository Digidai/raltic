"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/heroui-pro/button";
import { trackCtaClick } from "@/components/marketing/tracking";
import { cn } from "@/lib/utils";

type MarketingButtonVariant =
  | "primary"
  | "secondary"
  | "nav-primary"
  | "desktop-primary"
  | "desktop-secondary"
  // Light-surface (ando-style) variants used on the redesigned homepage:
  // dark rounded-full pill (primary) + white bordered pill (secondary).
  | "light-primary"
  | "light-secondary"
  | "light-nav-primary";

type MarketingButtonProps = {
  href: string;
  children: ReactNode;
  variant?: MarketingButtonVariant;
  className?: string;
  target?: string;
  rel?: string;
  ctaTarget?: string;
};

const variants: Record<MarketingButtonVariant, string> = {
  primary: "h-11 px-6 text-[15px] font-semibold",
  secondary: "h-11 px-5 text-sm font-medium",
  "nav-primary": "h-8 px-3 text-sm font-medium",
  "desktop-primary": "h-11 px-5 text-sm font-semibold",
  "desktop-secondary": "h-11 px-5 text-sm font-semibold",
  "light-primary": "h-11 rounded-full px-6 text-[15px] font-medium",
  "light-secondary": "h-11 rounded-full px-5 text-sm font-medium",
  "light-nav-primary": "h-9 rounded-full px-4 text-sm font-medium",
};

const visualVariants: Record<MarketingButtonVariant, string> = {
  primary:
    "!border-[var(--white)] !bg-[var(--white)] !text-[var(--eclipse)] shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_22%,transparent)] hover:!border-[color-mix(in_srgb,var(--white)_82%,var(--eclipse))] hover:!bg-[color-mix(in_srgb,var(--white)_88%,var(--eclipse))] focus-visible:!ring-accent",
  secondary:
    "!border-[color-mix(in_srgb,var(--white)_22%,transparent)] !bg-transparent !text-[var(--snow)] hover:!border-[color-mix(in_srgb,var(--white)_38%,transparent)] hover:!bg-[color-mix(in_srgb,var(--white)_6%,transparent)] focus-visible:!ring-accent",
  "nav-primary":
    "!border-[var(--white)] !bg-[var(--white)] !text-[var(--eclipse)] hover:!border-[color-mix(in_srgb,var(--white)_82%,var(--eclipse))] hover:!bg-[color-mix(in_srgb,var(--white)_88%,var(--eclipse))] focus-visible:!ring-accent",
  "desktop-primary":
    "!border-[var(--eclipse)] !bg-[var(--eclipse)] !text-[var(--snow)] hover:!border-[color-mix(in_srgb,var(--eclipse)_88%,var(--snow))] hover:!bg-[color-mix(in_srgb,var(--eclipse)_88%,var(--snow))] focus-visible:!ring-accent",
  "desktop-secondary":
    "!border-[color-mix(in_srgb,var(--eclipse)_20%,transparent)] !bg-[var(--white)] !text-[var(--eclipse)] hover:!border-[color-mix(in_srgb,var(--eclipse)_32%,transparent)] hover:!bg-[color-mix(in_srgb,var(--white)_94%,var(--eclipse))] focus-visible:!ring-accent",
  "light-primary":
    "!rounded-full !border-[#18181b] !bg-[#18181b] !text-white shadow-[0_1px_2px_rgba(16,24,40,0.10),0_10px_28px_-14px_rgba(16,24,40,0.55)] hover:!border-black hover:!bg-black focus-visible:!ring-[#2f7bff]",
  "light-secondary":
    "!rounded-full !border-black/[0.12] !bg-white !text-zinc-900 hover:!border-black/25 hover:!bg-[#f6f5f1] focus-visible:!ring-[#2f7bff]",
  "light-nav-primary":
    "!rounded-full !border-[#18181b] !bg-[#18181b] !text-white hover:!border-black hover:!bg-black focus-visible:!ring-[#2f7bff]",
};

const buttonVariants: Record<MarketingButtonVariant, ComponentProps<typeof Button>["variant"]> = {
  primary: "primary",
  secondary: "outline",
  "nav-primary": "primary",
  "desktop-primary": "primary",
  "desktop-secondary": "outline",
  "light-primary": "primary",
  "light-secondary": "outline",
  "light-nav-primary": "primary",
};

export function MarketingButton({
  href,
  children,
  variant = "primary",
  className,
  target,
  rel,
  ctaTarget,
}: MarketingButtonProps) {
  const render = target ? (
    <a href={href} target={target} rel={rel ?? "noreferrer"} />
  ) : (
    <Link href={href} />
  );

  return (
    <Button
      variant={buttonVariants[variant]}
      render={render}
      onClick={() => {
        if (ctaTarget) trackCtaClick(ctaTarget);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 transition-[transform,box-shadow,background-color,border-color,color] duration-150 active:translate-y-px",
        variants[variant],
        visualVariants[variant],
        className,
      )}
    >
      {children}
    </Button>
  );
}
