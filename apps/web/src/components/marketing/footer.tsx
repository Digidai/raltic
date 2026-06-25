import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { RalticLogo } from "@/components/raltic-logo";
import { cn } from "@/lib/utils";

/**
 * Shared marketing footer.
 *
 * `theme="light"` (default) is the ando.so light surface used across the
 * marketing site. `theme="dark"` is retained for completeness. Structure
 * (`[data-raltic-footer-lead]`, `.raltic-marketing-footer-grid`,
 * `.raltic-marketing-footer-base`) is stable so e2e hooks + the lead CTA
 * layout don't drift.
 *
 * Uses plain semantic elements (NOT HeroUI Card) — Card injects a default
 * `border`/`bg-background`/`shadow` that can't be reliably overridden by
 * className order, which rendered visible boxes around the columns on the
 * light surface.
 *
 * Keep this footer's links in sync with sitemap.ts.
 */
type MarketingFooterProps = {
  lead?: ReactNode;
  leadId?: string;
  theme?: "dark" | "light";
};

const LIGHT_FOOTER_STYLE: CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #f6f5f1 100%)",
  borderTop: "1px solid rgba(0,0,0,0.07)",
};

export function MarketingFooter({ lead, leadId, theme = "light" }: MarketingFooterProps = {}) {
  const isLight = theme === "light";

  return (
    <footer
      className={cn(
        "w-full",
        isLight
          ? "text-zinc-500"
          : "raltic-marketing-footer-surface text-[color-mix(in_srgb,var(--snow)_68%,transparent)]",
      )}
      style={isLight ? LIGHT_FOOTER_STYLE : undefined}
    >
      {lead && (
        <div
          id={leadId}
          data-raltic-footer-lead
          className={cn(
            "mx-auto max-w-6xl scroll-mt-20 px-6 py-7 text-center sm:py-9",
            isLight && "border-b border-black/[0.07]",
          )}
        >
          {lead}
        </div>
      )}
      <div
        className={cn(
          "raltic-marketing-footer-grid mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-5",
          isLight && "border-black/[0.07]",
        )}
      >
        <div className="lg:col-span-2">
          <div className={cn("flex items-center gap-2", isLight ? "text-zinc-900" : "text-[var(--snow)]")}>
            <RalticLogo size={24} idSuffix="footer-shared" onDark={!isLight} />
            <span className="font-medium">Raltic</span>
          </div>
          <p className={cn("mt-3 max-w-xs text-sm leading-relaxed", isLight ? "text-zinc-500" : "text-[color-mix(in_srgb,var(--snow)_64%,transparent)]")}>
            Workflow rooms where humans and AI agents ship together.
          </p>
        </div>
        <FooterCol isLight={isLight} label="Product" links={[
          { label: "Home", href: "/" },
          { label: "Workflows", href: "/workflows" },
          { label: "Runtimes", href: "/runtimes" },
          { label: "Connectors", href: "/connectors" },
          { label: "Desktop beta", href: "/desktop" },
          { label: "Security", href: "/security" },
        ]} />
        <FooterCol isLight={isLight} label="Audiences" links={[
          { label: "For indie devs", href: "/indie" },
          { label: "For teams (waitlist)", href: "/teams" },
        ]} />
        <FooterCol isLight={isLight} label="Get started" links={[
          { label: "Sign up", href: "/signup" },
          { label: "Sign in", href: "/login" },
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
        ]} />
      </div>
      <div
        className="raltic-marketing-footer-base"
        style={isLight ? { borderTop: "1px solid rgba(0,0,0,0.07)" } : undefined}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} Raltic</span>
          <span>
            Reach out:{" "}
            <a
              className={isLight ? "text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline" : "raltic-marketing-footer-link"}
              href="mailto:hello@raltic.com"
            >
              hello@raltic.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ isLight, label, links }: { isLight: boolean; label: string; links: { label: string; href: string }[] }) {
  return (
    <div className="space-y-2.5">
      <p className={cn("text-[10.5px] font-medium uppercase tracking-[0.18em]", isLight ? "text-zinc-400" : "text-[color-mix(in_srgb,var(--snow)_58%,transparent)]")}>{label}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className={isLight ? "text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline" : "raltic-marketing-footer-link"}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
