"use client";

import { useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { useNearViewport } from "@/lib/motion/useNearViewport";
import { cn } from "@/lib/utils";

/**
 * Scroll-linked parallax. `speed` is the fraction of the element's own
 * height it travels across the viewport (negative = moves against scroll).
 */
export function Parallax({ children, speed = 0.15, className, scale }: { children: ReactNode; speed?: number; className?: string; scale?: [number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref);
  useGsap(
    ({ gsap }) => {
      const el = ref.current;
      if (!el || !near || prefersReducedMotion()) return;
      gsap.fromTo(
        el,
        { yPercent: -speed * 50, scale: scale?.[0] ?? 1 },
        {
          yPercent: speed * 50,
          scale: scale?.[1] ?? 1,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    },
    { scope: ref, dependencies: [near, speed], when: () => near },
  );
  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

/**
 * Horizontal wipe reveal using a double counter-translate (transform only):
 * the outer clip slides in while the content slides the opposite way.
 */
export function WipeReveal({ children, className, scrub = true }: { children: ReactNode; className?: string; scrub?: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const near = useNearViewport(outer);
  useGsap(
    ({ gsap }) => {
      if (!near || !outer.current || !inner.current || prefersReducedMotion()) return;
      const tl = gsap.timeline({
        scrollTrigger: scrub
          ? { trigger: outer.current, start: "top 80%", end: "bottom 40%", scrub: 0.8 }
          : { trigger: outer.current, start: "top 85%", once: true },
      });
      tl.fromTo(outer.current, { xPercent: -100 }, { xPercent: 0, ease: scrub ? "none" : "expo.out", duration: scrub ? 1 : 1.4 }, 0).fromTo(
        inner.current,
        { xPercent: 100 },
        { xPercent: 0, ease: scrub ? "none" : "expo.out", duration: scrub ? 1 : 1.4 },
        0,
      );
    },
    { dependencies: [near, scrub], when: () => near },
  );
  return (
    <div className={cn("overflow-hidden", className)}>
      <div ref={outer} className="overflow-hidden will-change-transform">
        <div ref={inner} className="will-change-transform">
          {children}
        </div>
      </div>
    </div>
  );
}
