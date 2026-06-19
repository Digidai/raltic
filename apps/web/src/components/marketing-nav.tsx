"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
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
 * Hero is now true BLACK (Spectrum-style). Text is light regardless of
 * scroll; only the background and border treatment change:
 *
 *   - top:      transparent (the hero shows through clean)
 *   - scrolled: dark glass with backdrop-blur + bottom hairline, since
 *               the marketing page alternates dark/light bands and a
 *               heavy glass surface gives the bar discrete presence
 *               regardless of which band is under it
 *
 * If we ever bring the cream-hero treatment back, this needs to flip:
 * dark-text-on-light glass instead of the current light-text-on-dark-
 * glass. Don't make that change blind — pick by what's under it.
 */
export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[color-mix(in_srgb,var(--snow)_10%,transparent)] bg-[color-mix(in_srgb,var(--eclipse)_72%,transparent)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--eclipse)_58%,transparent)]"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-medium tracking-tight text-[var(--snow)]"
        >
          <RalticLogo size={32} idSuffix="nav" onDark />
          <span>Raltic</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[color-mix(in_srgb,var(--snow)_64%,transparent)] md:flex">
          <Link href="/workflows" className="hover:text-[var(--snow)]">Workflows</Link>
          <Link href="/runtimes" className="hover:text-[var(--snow)]">Runtimes</Link>
          <Link href="/connectors" className="hover:text-[var(--snow)]">Connectors</Link>
          <Link href="/desktop" className="hover:text-[var(--snow)]">Desktop beta</Link>
          <Link href="/security" className="hover:text-[var(--snow)]">Security</Link>
          {/* Audience dropdown — surfaces /indie + /teams without
              crowding the top nav. */}
          <ForDropdown />
          <Link href="/login" className="hover:text-[var(--snow)]">Sign in</Link>
          <MarketingButton href="/signup" variant="nav-primary">
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </MarketingButton>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <MobileNavDropdown />
          <MarketingButton href="/signup" variant="nav-primary">
            Start
          </MarketingButton>
        </div>
      </div>
    </header>
  );
}

function MobileNavDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Open marketing navigation"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[color-mix(in_srgb,var(--snow)_12%,transparent)] bg-[color-mix(in_srgb,var(--snow)_5%,transparent)] text-[var(--snow)] transition-colors hover:bg-[color-mix(in_srgb,var(--snow)_9%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <MenuIcon className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 !border-[color-mix(in_srgb,var(--snow)_10%,transparent)] !bg-[var(--overlay)] !text-[var(--overlay-foreground)] !shadow-overlay"
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
      className="!px-3 !py-2.5 !text-[var(--overlay-foreground)] hover:!bg-[color-mix(in_srgb,var(--snow)_6%,transparent)] focus-visible:!bg-[color-mix(in_srgb,var(--snow)_8%,transparent)]"
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
function ForDropdown() {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[color-mix(in_srgb,var(--snow)_64%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--snow)_6%,transparent)] hover:text-[var(--snow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        For <ChevronDown className="h-3 w-3 transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-56 !border-[color-mix(in_srgb,var(--snow)_10%,transparent)] !bg-[var(--overlay)] !text-[var(--overlay-foreground)] !shadow-overlay"
      >
        <DropdownMenuItem
          href="/indie"
          className="!px-3 !py-2 !text-[var(--overlay-foreground)] hover:!bg-[color-mix(in_srgb,var(--snow)_6%,transparent)] focus-visible:!bg-[color-mix(in_srgb,var(--snow)_8%,transparent)]"
        >
          <div>
            <div className="font-medium text-[var(--overlay-foreground)]">Indie devs</div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">Solo dev / AI tinkerer</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          href="/teams"
          className="!px-3 !py-2 !text-[var(--overlay-foreground)] hover:!bg-[color-mix(in_srgb,var(--snow)_6%,transparent)] focus-visible:!bg-[color-mix(in_srgb,var(--snow)_8%,transparent)]"
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
