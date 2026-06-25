import type { ReactNode } from "react";
import { MarketingNav } from "@/components/marketing-nav";
import { MarketingTracking } from "@/components/marketing/tracking";

/**
 * Wrapper rendered by `app/(marketing)/layout.tsx` for every public
 * marketing page.
 *
 * The entire marketing site uses the ando.so-style LIGHT aesthetic:
 * warm-white surfaces (`#fafaf8`), monochrome black-opacity text, a
 * single sky-blue accent (`#2f7bff`), large light headings, rounded
 * cards with hairline black/8% borders. We deliberately do NOT add the
 * `.dark` class, so HeroUI tokens resolve to their light `:root` values.
 *
 * Includes:
 *   - light theme container
 *   - MarketingTracking beacon (UTM capture + landing_view)
 *   - sticky MarketingNav
 *
 * NOTE: deliberately does NOT include SignedInRedirect. Auto-redirect to
 * /s/[slug] is mounted ONLY in the homepage so secondary marketing pages
 * stay browsable for signed-in users.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-[#fafaf8] text-zinc-900">
      <MarketingTracking />
      <MarketingNav />
      {children}
    </div>
  );
}
