import type { CSSProperties, ReactNode } from "react";
import { MarketingNav } from "@/components/marketing-nav";
import { MicrosoftClarity } from "@/components/marketing/microsoft-clarity";
import { MarketingTracking } from "@/components/marketing/tracking";

/**
 * Wrapper rendered by `app/(marketing)/layout.tsx` for every public
 * marketing page.
 *
 * The entire marketing site uses the ando.so-style LIGHT aesthetic:
 * warm-white surfaces (`#fafaf8`), monochrome black-opacity text, a
 * single sky-blue accent (`#2563eb`), large light headings, rounded
 * cards with hairline black/8% borders. We deliberately do NOT add the
 * `.dark` class, so HeroUI tokens resolve to their light `:root` values.
 *
 * Includes:
 *   - light theme container
 *   - MarketingTracking beacon (UTM capture + landing_view)
 *   - consent-gated Microsoft Clarity on public marketing routes only
 *   - sticky MarketingNav
 *
 * NOTE: deliberately does NOT include SignedInRedirect. Auto-redirect to
 * /s/[slug] is mounted ONLY in the homepage so secondary marketing pages
 * stay browsable for signed-in users.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  // The product theme ships `--radius: 0px` (brutalism), which remaps every
  // Tailwind `rounded-lg/xl/2xl` token to 0 — leaving marketing cards sharp
  // while arbitrary radii (e.g. the hero mockup's `rounded-[24px]`) stay
  // round. Scope a non-zero radius to the marketing tree so all token-based
  // corners round consistently (ando.so style) without touching the product.
  return (
    <div className="bg-[#fafaf8] text-foreground" style={{ "--radius": "12px" } as CSSProperties}>
      <MarketingTracking />
      <MicrosoftClarity />
      <MarketingNav />
      {children}
    </div>
  );
}
