"use client";

import * as React from "react";
import { Checkbox as HeroCheckbox } from "@heroui/react/checkbox";
import { cn } from "@/lib/utils";

type RootClassName = React.ComponentProps<typeof HeroCheckbox.Root>["className"];
type RootStyle = React.ComponentProps<typeof HeroCheckbox.Root>["style"];
type CheckboxClassNameState = Parameters<Extract<RootClassName, (...args: never[]) => unknown>>[0];
type CheckboxStyleState = Parameters<Extract<RootStyle, (...args: never[]) => unknown>>[0];

export interface CheckboxProps extends Omit<React.ComponentProps<typeof HeroCheckbox.Root>, "children" | "isSelected" | "onChange"> {
  children?: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  controlClassName?: string;
  contentClassName?: string;
  surface?: "card" | "list";
}

export function Checkbox({
  className,
  controlClassName,
  contentClassName,
  children,
  checked,
  onCheckedChange,
  surface = "card",
  style,
  ...props
}: CheckboxProps) {
  const rootClassName = (state: CheckboxClassNameState) => cn(
    "raltic-checkbox items-start gap-3 rounded-md border border-border p-3 text-sm text-foreground transition-colors",
    state.isSelected && "raltic-checkbox--selected border-accent/35 text-[var(--accent-soft-foreground)]",
    surface === "card" && !state.isSelected
      ? "bg-[var(--surface-secondary)] shadow-xs hover:bg-[var(--surface-tertiary)]"
      : "shadow-none hover:border-accent/25 hover:bg-[var(--surface-secondary)]",
    surface === "list" && !state.isSelected && "bg-transparent",
    typeof className === "function" ? className(state) : className,
  );
  const rootStyle = (state: CheckboxStyleState) => ({
    ...(typeof style === "function" ? style(state) : style),
    ...(state.isSelected ? { backgroundColor: "var(--accent-soft)" } : null),
  });

  return (
    <HeroCheckbox.Root
      {...props}
      isSelected={checked}
      onChange={(next) => onCheckedChange?.(Boolean(next))}
      className={rootClassName}
      style={rootStyle}
    >
      <HeroCheckbox.Control className={cn("mt-0.5", controlClassName)}>
        <HeroCheckbox.Indicator />
      </HeroCheckbox.Control>
      <HeroCheckbox.Content className={cn("min-w-0", contentClassName)}>
        {children}
      </HeroCheckbox.Content>
    </HeroCheckbox.Root>
  );
}
