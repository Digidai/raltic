"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu as MenuIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/heroui-pro/menu";
import { Chip } from "@/components/heroui-pro/chip";
import { MarketingButton } from "@/components/marketing/marketing-button";
import { cn } from "@/lib/utils";
import { RalticLogo } from "./raltic-logo";

/**
 * Marketing site sticky nav.
 *
 * Theme is route-aware so the bar matches the page underneath it:
 *
 *   - Homepage (`/`) is the ando.so-style LIGHT redesign → dark text on
 *     a transparent bar that turns into a white-glass surface on scroll.
 *   - Every other marketing page is still DARK → light text on a
 *     transparent bar that turns into dark glass on scroll.
 *
 * The dropdown surfaces read HeroUI `--overlay` tokens, which flip with
 * the shell theme automatically; hover/border mixes use `--foreground`
 * (not `--snow`) so they stay legible in both themes.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const onLight = usePathname() === "/";

  useEffect(() => {
    let ticking = false;
    let last = false;
    const compute = () => {
      ticking = false;
      const next = window.scrollY > 24;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = onLight
    ? "text-zinc-600 hover:text-zinc-900"
    : "text-[color-mix(in_srgb,var(--snow)_64%,transparent)] hover:text-[var(--snow)]";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? onLight
            ? "border-b border-black/[0.07] bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60"
            : "border-b border-[color-mix(in_srgb,var(--snow)_10%,transparent)] bg-[color-mix(in_srgb,var(--eclipse)_72%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--eclipse)_58%,transparent)]"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-medium tracking-tight",
            onLight ? "text-zinc-900" : "text-[var(--snow)]",
          )}
        >
          <RalticLogo size={32} idSuffix="nav" onDark={!onLight} />
          <span>Raltic</span>
        </Link>

        <nav className={cn("hidden items-center gap-6 text-sm md:flex", onLight ? "text-zinc-600" : "text-[color-mix(in_srgb,var(--snow)_64%,transparent)]")}>
          <Link href="/workflows" className={linkClass}>Workflows</Link>
          <Link href="/runtimes" className={linkClass}>Runtimes</Link>
          <Link href="/connectors" className={linkClass}>Connectors</Link>
          <Link href="/desktop" className={linkClass}>Desktop beta</Link>
          <Link href="/security" className={linkClass}>Security</Link>
          {/* Audience dropdown — surfaces /indie + /teams without
              crowding the top nav. */}
          <ForDropdown onLight={onLight} />
          <Link href="/login" className={linkClass}>Sign in</Link>
          <MarketingButton href="/signup" variant={onLight ? "light-nav-primary" : "nav-primary"}>
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </MarketingButton>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <MobileNavDropdown onLight={onLight} />
          <MarketingButton href="/signup" variant={onLight ? "light-nav-primary" : "nav-primary"}>
            Start
          </MarketingButton>
        </div>
      </div>
    </header>
  );
}

function MobileNavDropdown({ onLight }: { onLight: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Open marketing navigation"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff]",
          onLight
            ? "border border-black/[0.1] bg-white text-zinc-900 hover:bg-black/[0.04]"
            : "border border-[color-mix(in_srgb,var(--snow)_12%,transparent)] bg-[color-mix(in_srgb,var(--snow)_5%,transparent)] text-[var(--snow)] hover:bg-[color-mix(in_srgb,var(--snow)_9%,transparent)]",
        )}
      >
        <MenuIcon className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 !border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] !bg-[var(--overlay)] !text-[var(--overlay-foreground)] !shadow-overlay"
      >
        <MobileNavItem href="/workflows" label="Workflows" />
        <MobileNavItem href="/runtimes" label="Runtimes" />
        <MobileNavItem href="/connectors" label="Connectors" />
        <MobileNavItem href="/desktop" label="Desktop beta" />
        <MobileNavItem href="/security" label="Security" />
        <MobileNavItem href="/indie" label="For indie devs" description="Solo dev / AI tinkerer" />
        <MobileNavItem
          href="/teams"
          label="For teams"
          description="Mid-market eng orgs"
          suffix={(
            <Chip
              size="sm"
              variant="soft"
              color="warning"
              className="!bg-[var(--warning-soft)] !text-[9px] !text-[var(--warning)] uppercase tracking-wider"
            >
              Waitlist
            </Chip>
          )}
        />
        <MobileNavItem href="/login" label="Sign in" />
        <MobileNavItem href="/signup" label="Get started" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNavItem({
  href,
  label,
  description,
  suffix,
}: {
  href: string;
  label: string;
  description?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <DropdownMenuItem
      href={href}
      textValue={label}
      className="!px-3 !py-2.5 !text-[var(--overlay-foreground)] hover:!bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] focus-visible:!bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--overlay-foreground)]">{label}</span>
          {suffix}
        </div>
        {description && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{description}</div>}
      </div>
    </DropdownMenuItem>
  );
}

/**
 * "For" / Audiences dropdown. Click-only — earlier draft combined
 * pointerEnter (open) + click (toggle), which collided: the pointer
 * sweep landing on the trigger fired pointerEnter→open, and the
 * subsequent click toggled it shut again. Easy to misread as broken.
 * Now: click opens, click again or click-outside or Escape closes.
 */
function ForDropdown({ onLight }: { onLight: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-full px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7bff]",
          onLight
            ? "text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-900"
            : "text-[color-mix(in_srgb,var(--snow)_64%,transparent)] hover:bg-[color-mix(in_srgb,var(--snow)_6%,transparent)] hover:text-[var(--snow)]",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        For <ChevronDown className="h-3 w-3 transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56 !border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] !bg-[var(--overlay)] !text-[var(--overlay-foreground)] !shadow-overlay"
      >
        <DropdownMenuItem
          href="/indie"
          className="!px-3 !py-2 !text-[var(--overlay-foreground)] hover:!bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] focus-visible:!bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
        >
          <div>
            <div className="font-medium text-[var(--overlay-foreground)]">Indie devs</div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">Solo dev / AI tinkerer</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          href="/teams"
          className="!px-3 !py-2 !text-[var(--overlay-foreground)] hover:!bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] focus-visible:!bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--overlay-foreground)]">Teams</span>
              <Chip
                size="sm"
                variant="soft"
                color="warning"
                className="!bg-[var(--warning-soft)] !text-[9px] !text-[var(--warning)] uppercase tracking-wider"
              >
                Waitlist
              </Chip>
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">Mid-market eng orgs</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
