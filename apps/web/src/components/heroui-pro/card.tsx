import * as React from "react";
import { Card as HeroCard } from "@heroui/react/card";
import { cn } from "@/lib/utils";

type DivProps = React.ComponentProps<"div"> & { render?: React.ReactElement };

function renderDiv(defaultClassName: string, { className, render, children, ...props }: DivProps) {
  if (render && React.isValidElement(render)) {
    return React.cloneElement(render, {
      ...props,
      className: cn(defaultClassName, className, (render.props as { className?: string }).className),
      children,
    } as React.HTMLAttributes<HTMLElement>);
  }
  return <div className={cn(defaultClassName, className)} {...props}>{children}</div>;
}

export function Card({ className, render, children, ...props }: DivProps) {
  if (render && React.isValidElement(render)) {
    const slot = (props as { "data-slot"?: string })["data-slot"]
      ?? (render.props as { "data-slot"?: string })["data-slot"]
      ?? "card";
    return React.cloneElement(render, {
      ...props,
      "data-slot": slot,
      className: cn("rounded-xl border border-border bg-background shadow-surface", className, (render.props as { className?: string }).className),
      children,
    } as React.HTMLAttributes<HTMLElement>);
  }
  return (
    <HeroCard.Root variant="default" className={cn("rounded-xl border-border bg-background shadow-surface", className)} {...props}>
      {children}
    </HeroCard.Root>
  );
}

export function CardHeader(props: DivProps) {
  return renderDiv("px-5 py-4", { ...props, "data-slot": "card-header" } as DivProps);
}

export function CardTitle(props: DivProps) {
  return renderDiv("text-base font-semibold", { ...props, "data-slot": "card-title" } as DivProps);
}

export function CardDescription(props: DivProps) {
  return renderDiv("text-sm text-muted-foreground", { ...props, "data-slot": "card-description" } as DivProps);
}

export function CardPanel(props: DivProps) {
  return renderDiv("px-5 py-4", { ...props, "data-slot": "card-panel" } as DivProps);
}

export function CardFooter(props: DivProps) {
  return renderDiv("flex gap-2 px-5 py-4", { ...props, "data-slot": "card-footer" } as DivProps);
}

export function CardAction(props: DivProps) {
  return renderDiv("col-start-2 row-span-2 row-start-1 inline-flex self-start justify-self-end", props);
}

export const CardFrame = Card;
export const CardFrameHeader = CardHeader;
export const CardFrameTitle = CardTitle;
export const CardFrameDescription = CardDescription;
export const CardFrameAction = CardAction;
export const CardFrameFooter = CardFooter;
