import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Star row geometry (see /images/ui/star-row.svg): 24-unit stars at a 27-unit pitch. */
const PITCH = 27;
const ROW_W = PITCH * 4 + 24;

/**
 * Star rating as a single element: a two-tone gradient masked by a row of
 * stars (globals.css `.stars`), instead of ten SVG icons per rating.
 */
export function Stars({ value, size = "sm", className }: { value: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const h = size === "lg" ? "h-5" : size === "md" ? "h-4" : "h-3.5";
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const fillTo = full >= 5 ? ROW_W : full * PITCH + (v - full) * 24;
  return (
    <span
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
      className={cn("stars", h, className)}
      style={{ "--fill": `${((fillTo / ROW_W) * 100).toFixed(1)}%` } as CSSProperties}
    />
  );
}
