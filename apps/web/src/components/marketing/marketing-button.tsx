"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/heroui-pro/button";
import { cn } from "@/lib/utils";

type MarketingButtonVariant =
  | "primary"
  | "secondary"
  | "nav-primary"
  | "desktop-primary"
  | "desktop-secondary";

type MarketingButtonProps = {
  href: string;
  children: ReactNode;
  variant?: MarketingButtonVariant;
  className?: string;
  target?: string;
  rel?: string;
};

const variants: Record<MarketingButtonVariant, string> = {
  primary: "h-11 px-6 text-[15px] font-semibold",
  secondary: "h-11 px-5 text-sm font-medium",
  "nav-primary": "h-8 px-3 text-sm font-medium",
  "desktop-primary": "h-11 px-5 text-sm font-semibold",
  "desktop-secondary": "h-11 px-5 text-sm font-semibold",
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
};

const buttonVariants: Record<MarketingButtonVariant, ComponentProps<typeof Button>["variant"]> = {
  primary: "primary",
  secondary: "outline",
  "nav-primary": "primary",
  "desktop-primary": "primary",
  "desktop-secondary": "outline",
};

export function MarketingButton({
  href,
  children,
  variant = "primary",
  className,
  target,
  rel,
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
