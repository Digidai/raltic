import type { ReactNode } from "react";

/**
 * Section header shared across marketing pages. Light (ando.so) style:
 * sky-blue eyebrow, large light-weight SN Pro title, muted description.
 *
 * The `dark` prop is retained for call-site compatibility but no longer
 * changes the rendering — the whole marketing site is light now.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && (
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#2563eb]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-4 text-balance text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-foreground sm:text-5xl font-[family-name:var(--font-sn-pro)]">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
