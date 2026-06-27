import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Visible breadcrumb trail for marketing sub-pages. Pairs with the
 * `breadcrumbJsonLd` structured data (same items) so the on-page trail and
 * the machine-readable breadcrumb agree — good for SEO sitelinks + AI context.
 *
 * The LAST item is the current page (rendered as plain text, not a link).
 */
export function Breadcrumbs({ items }: { items: Array<{ name: string; href: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-zinc-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {index > 0 && <ChevronRight className="h-3 w-3 text-zinc-400" aria-hidden="true" />}
              {isLast ? (
                <span aria-current="page" className="font-medium text-zinc-700">{item.name}</span>
              ) : (
                <Link href={item.href} className="underline-offset-4 transition-colors hover:text-zinc-900 hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
