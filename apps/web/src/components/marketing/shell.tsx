"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingTracking } from "@/components/marketing/tracking";

/**
 * Wrapper rendered by `app/(marketing)/layout.tsx` for every page in
 * the marketing route group — including the homepage `/`.
 *
 * Includes:
 *   - theme container (light on `/`, dark on every other marketing page)
 *   - MarketingTracking beacon (UTM capture + landing_view)
 *   - sticky MarketingNav (adapts its own light/dark treatment by route)
 *
 * The homepage was redesigned to an ando.so-style light/airy aesthetic
 * (warm white, sky-blue accent, large light headings). Scoping the light
 * theme to `/` keeps the other marketing pages (/runtimes, /security,
 * /privacy, /teams, …) on their established dark treatment so nothing
 * else has to change. When the light theme is active we deliberately do
 * NOT add the `.dark` class, so HeroUI tokens resolve to their light
 * `:root` values for any Pro components used on the page.
 *
 * Per-page footer lives in apps/web/src/components/marketing/footer.tsx
 * — kept separate so individual pages can drop sections without
 * losing the global footer.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  // NOTE: deliberately does NOT include SignedInRedirect.
  // Auto-redirect to /s/[slug] is mounted ONLY in the homepage
  // (`app/(marketing)/page.tsx`) so secondary marketing pages
  // (/runtimes, /indie, /security, /privacy, etc.) stay browsable
  // by signed-in users.
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <div className="bg-[#fafaf8] text-zinc-900">
        <MarketingTracking />
        <MarketingNav />
        {children}
      </div>
    );
  }

  return (
    <div className="dark bg-[var(--eclipse)] text-[var(--snow)]">
      <MarketingTracking />
      <MarketingNav />
      {children}
    </div>
  );
}
