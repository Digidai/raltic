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
  borderTop: "1px solid var(--border)",
};

export function MarketingFooter({ lead, leadId, theme = "light" }: MarketingFooterProps = {}) {
  const isLight = theme === "light";

  return (
    <footer
      className={cn(
        "w-full",
        isLight
          ? "text-muted-foreground"
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
            isLight && "border-b border-border",
          )}
        >
          {lead}
        </div>
      )}
      <div
        className={cn(
          "raltic-marketing-footer-grid mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 sm:py-16 lg:grid-cols-5",
          isLight && "border-border",
        )}
      >
        <div className="lg:col-span-2">
          <div className={cn("flex items-center gap-2", isLight ? "text-foreground" : "text-[var(--snow)]")}>
            <RalticLogo size={24} idSuffix="footer-shared" onDark={!isLight} />
            <span className="font-medium">Raltic</span>
          </div>
          <p className={cn("mt-3 max-w-xs text-sm leading-relaxed", isLight ? "text-muted-foreground" : "text-[color-mix(in_srgb,var(--snow)_64%,transparent)]")}>
            Workflow rooms where humans and AI agents ship together.
          </p>
        </div>
        <FooterCol isLight={isLight} label="Product" links={[
          { label: "Features", href: "/features" },
          { label: "Workflows", href: "/workflows" },
          { label: "Runtimes", href: "/runtimes" },
          { label: "Connectors", href: "/connectors" },
        ]} />
        <FooterCol isLight={isLight} label="Built for" links={[
          { label: "Product teams", href: "/built-for/product-teams" },
          { label: "Engineering teams", href: "/built-for/engineering-teams" },
          { label: "Founders", href: "/built-for/founders" },
          { label: "GTM teams", href: "/built-for/gtm-teams" },
          { label: "Research teams", href: "/built-for/research-teams" },
          { label: "AI-native teams", href: "/built-for/ai-native-teams" },
          { label: "For indie devs", href: "/indie" },
          { label: "Teams waitlist", href: "/teams" },
        ]} />
        <FooterCol isLight={isLight} label="Resources" links={[
          { label: "Blog", href: "/blog" },
          { label: "Answers", href: "/answers" },
          { label: "Comparisons", href: "/compare" },
          { label: "Glossary", href: "/glossary" },
          { label: "Pricing", href: "/pricing" },
          { label: "About", href: "/about" },
          { label: "Security", href: "/security" },
          { label: "Desktop beta", href: "/desktop" },
          { label: "Sign up", href: "/signup" },
          { label: "Sign in", href: "/login" },
          { label: "Privacy policy", href: "/privacy" },
          { label: "Terms of service", href: "/terms" },
        ]} />
      </div>
      <div
        className="raltic-marketing-footer-base"
        style={isLight ? { borderTop: "1px solid var(--border)" } : undefined}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs sm:flex-row">
          <span>© {new Date().getFullYear()} Raltic</span>
          <span>
            Reach out:{" "}
            <a
              className={isLight ? "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" : "raltic-marketing-footer-link"}
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
      <p className={cn("text-[10.5px] font-medium uppercase tracking-[0.18em]", isLight ? "text-muted-foreground" : "text-[color-mix(in_srgb,var(--snow)_58%,transparent)]")}>{label}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className={isLight ? "text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline" : "raltic-marketing-footer-link"}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
