"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";
import { loadGsap } from "@/lib/motion/useGsap";
import { cn } from "@/lib/utils";

/**
 * Pulls its child toward the pointer and springs back with an elastic
 * settle. `inner` (selector) moves further for a layered, tactile feel.
 */
export function Magnetic({
  children,
  strength = 0.32,
  innerStrength = 0.18,
  className,
}: {
  children: ReactNode;
  strength?: number;
  innerStrength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isFinePointer() || prefersReducedMotion()) return;
    const inner = el.querySelector<HTMLElement>("[data-magnetic-inner]");
    let cancelled = false;
    let detach: (() => void) | undefined;
    void loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.5, ease: "power3.out", overwrite: "auto" });
        if (inner) gsap.to(inner, { x: dx * innerStrength, y: dy * innerStrength, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      };
      const onLeave = () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.38)", overwrite: "auto" });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.38)", overwrite: "auto" });
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      detach = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(el);
      };
    });
    return () => {
      cancelled = true;
      detach?.();
    };
  }, [strength, innerStrength]);

  return (
    <div ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </div>
  );
}
