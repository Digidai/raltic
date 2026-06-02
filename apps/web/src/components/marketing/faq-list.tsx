"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/heroui-pro/accordion";

type FaqItem = { q: string; a: string };

type FaqTheme = "dark" | "light";

export interface MarketingFaqListProps {
  items: FaqItem[];
  idPrefix: string;
  theme?: FaqTheme;
}

const THEME = {
  dark: {
    container: "border-[color-mix(in_srgb,var(--white)_10%,transparent)] bg-[color-mix(in_srgb,var(--eclipse)_94%,var(--accent)_6%)] text-[color-mix(in_srgb,var(--snow)_68%,transparent)] shadow-[0_18px_60px_color-mix(in_srgb,var(--accent)_10%,transparent)]",
    item: "border-[color-mix(in_srgb,var(--white)_10%,transparent)] text-[color-mix(in_srgb,var(--snow)_78%,transparent)]",
    title: "text-[var(--snow)]",
    open: "bg-[color-mix(in_srgb,var(--white)_5%,transparent)]",
    border: "border-[color-mix(in_srgb,var(--white)_10%,transparent)]",
    indicator: "text-[color-mix(in_srgb,var(--snow)_62%,transparent)]",
  },
  light: {
    container: "border-border bg-[var(--surface-secondary)] text-muted-foreground shadow-[var(--surface-shadow)]",
    item: "border-border text-foreground",
    title: "text-foreground",
    open: "bg-[var(--surface-tertiary)]",
    border: "border-border",
    indicator: "text-muted-foreground",
  },
} satisfies Record<FaqTheme, {
  container: string;
  item: string;
  title: string;
  open: string;
  border: string;
  indicator: string;
}>;

export function MarketingFaqList({ items, idPrefix, theme = "dark" }: MarketingFaqListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const palette = THEME[theme];

  function handleToggle(indexOrNull: number | null) {
    setOpenIndex((current) => (indexOrNull === null ? null : current === indexOrNull ? null : indexOrNull));
  }

  const expandedKeys = openIndex === null ? new Set<string>() : new Set([`${idPrefix}-faq-${openIndex}`]);

  return (
    <Accordion
      selectionMode="single"
      expandedKeys={expandedKeys}
      onExpandedChange={(keys) => {
        const next = Array.from(keys ?? [])[0];
        handleToggle(next ? Number(String(next).replace(`${idPrefix}-faq-`, "")) : null);
      }}
      className={cn("mt-10 overflow-hidden rounded-lg border", palette.container)}
    >
      {items.map((item, index) => {
        const itemId = `${idPrefix}-faq-${index}`;
        const isOpen = openIndex === index;

        return (
          <AccordionItem
            id={itemId}
            key={itemId}
            className={cn(
              "group border-b last:border-b-0",
              palette.item,
              palette.border,
              isOpen && palette.open,
              "transition-colors duration-150",
            )}
          >
            <AccordionHeading>
              <AccordionTrigger className="flex w-full items-start justify-between px-5 py-4 text-left sm:py-3">
                <span className={cn("block text-sm font-medium leading-tight text-balance sm:text-base", palette.title)}>
                  {item.q}
                </span>
                <AccordionIndicator className={cn("mt-1 shrink-0 transition-transform duration-200 data-[expanded]:rotate-180", palette.indicator)} />
              </AccordionTrigger>
            </AccordionHeading>
            <AccordionPanel>
              <AccordionBody>
                <p className={cn("border-t px-6 pb-5 pt-2 text-sm leading-relaxed", palette.item, palette.border)}>
                  {item.a}
                </p>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
