"use client";

import { useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { useNearViewport } from "@/lib/motion/useNearViewport";
import { cn } from "@/lib/utils";

/**
 * Infinite marquee driven by the GSAP ticker. Scroll velocity speeds it up,
 * flips its direction with the scroll, and leans the text (skew) — then it
 * eases back to its resting pace. Pauses offscreen.
 */
export function Marquee({
  children,
  speed = 40,
  reverse = false,
  className,
  trackClassName,
  skew = true,
}: {
  children: ReactNode;
  /** px per second at rest */
  speed?: number;
  reverse?: boolean;
  className?: string;
  trackClassName?: string;
  skew?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const near = useNearViewport(root);

  useGsap(
    ({ gsap, ScrollTrigger }) => {
      const el = track.current;
      if (!el || !near || prefersReducedMotion()) return;
      // Measure once (and on resize) rather than reading layout every frame.
      let width = el.scrollWidth / 2;
      const ro = new ResizeObserver(() => (width = el.scrollWidth / 2));
      ro.observe(el);
      const half = () => width;
      let x = 0;
      let dir = reverse ? 1 : -1;
      let boost = 0;
      let visible = true;
      const setX = gsap.quickSetter(el, "x", "px");
      const skewTo = gsap.quickTo(el, "skewX", { duration: 0.5, ease: "power3.out" });

      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (visible = self.isActive),
        onUpdate: (self) => {
          const v = self.getVelocity();
          boost = Math.min(Math.abs(v) / 120, 14);
          if (Math.abs(v) > 40) dir = (v > 0 ? -1 : 1) * (reverse ? -1 : 1);
          if (skew) skewTo(gsap.utils.clamp(-8, 8, v / -260));
        },
      });

      const tick = (_t: number, dt: number) => {
        if (!visible) return;
        boost *= 0.94;
        if (skew && boost < 0.4) skewTo(0);
        const w = half();
        if (!w) return;
        x += dir * (speed * (1 + boost)) * (dt / 1000);
        x = gsap.utils.wrap(-w, 0, x);
        setX(x);
      };
      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        ro.disconnect();
        st.kill();
      };
    },
    { scope: root, dependencies: [near, speed, reverse, skew] },
  );

  return (
    <div ref={root} className={cn("overflow-hidden", className)}>
      <div ref={track} className={cn("flex w-max will-change-transform", trackClassName)}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
