"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { reveal } from "@/lib/motion/tokens";
import { useNearViewport } from "@/lib/motion/useNearViewport";
import { cn } from "@/lib/utils";

/**
 * Fades/lifts a block (or its `[data-reveal-item]` children, staggered)
 * into view once. Transform + opacity only.
 */
export function Reveal({
  as: Tag = "div",
  children,
  className,
  y = reveal.y,
  delay = 0,
  stagger = reveal.stagger,
  start = reveal.start,
  scale,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  stagger?: number;
  start?: string;
  scale?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const near = useNearViewport(ref);
  useGsap(
    ({ gsap, ScrollTrigger }) => {
      const el = ref.current;
      if (!el || !near) return;
      const items = el.querySelectorAll<HTMLElement>("[data-reveal-item]");
      const targets: HTMLElement[] = items.length ? Array.from(items) : [el];
      if (prefersReducedMotion()) {
        gsap.set([el, ...targets], { autoAlpha: 1, clearProps: "transform" });
        return;
      }
      gsap.set(el, { autoAlpha: 1 });
      gsap.set(targets, { autoAlpha: 0, y, scale: scale ?? 1 });
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () =>
          gsap.to(targets, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out", stagger, delay, overwrite: true }),
      });
    },
    { scope: ref, dependencies: [near] },
  );
  return (
    <Tag ref={ref} className={cn("reveal", className)}>
      {children}
    </Tag>
  );
}

/** Animated number that counts up when it scrolls into view. */
export function CountUp({ to, suffix = "", prefix = "", className, decimals = 0 }: { to: number; suffix?: string; prefix?: string; className?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const near = useNearViewport(ref);
  useGsap(
    ({ gsap }) => {
      const el = ref.current;
      if (!el || !near) return;
      const format = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;
      if (prefersReducedMotion()) {
        el.textContent = format(to);
        return;
      }
      const state = { v: 0 };
      el.textContent = format(0);
      gsap.to(state, {
        v: to,
        duration: 1.8,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = format(state.v);
        },
      });
    },
    { scope: ref, dependencies: [near] },
  );
  return (
    <span ref={ref} className={cn("tabular", className)}>
      {prefix}
      {to.toFixed(decimals)}
      {suffix}
    </span>
  );
}
