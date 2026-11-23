"use client";

import { Minus, Plus } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/** Tactile quantity control: buttons squash on press, the number rolls. */
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  label = "Quantity",
  allowZero = false,
  className,
}: {
  value: number;
  allowZero?: boolean;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const btn = size === "sm" ? "size-8" : "size-11";
  const lower = allowZero ? 0 : min;
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-full border border-forest-900/15 bg-cream-50", className)}>
      <m.button
        type="button"
        whileTap={{ scaleX: 1.15, scaleY: 0.85 }}
        transition={spring.squash}
        onClick={() => onChange(Math.max(lower, value - 1))}
        disabled={value <= lower}
        className={cn("grid place-items-center rounded-full text-forest-800 hover:bg-forest-900/5 disabled:opacity-40", btn)}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </m.button>
      <span className={cn("relative grid place-items-center overflow-hidden tabular font-semibold", size === "sm" ? "h-8 w-7 text-sm" : "h-11 w-9")} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span key={value} initial={{ y: "70%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-70%", opacity: 0 }} transition={spring.snappy}>
            {value}
          </m.span>
        </AnimatePresence>
      </span>
      <m.button
        type="button"
        whileTap={{ scaleX: 1.15, scaleY: 0.85 }}
        transition={spring.squash}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn("grid place-items-center rounded-full text-forest-800 hover:bg-forest-900/5 disabled:opacity-40", btn)}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </m.button>
    </div>
  );
}
