"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";
import { loadGsap } from "@/lib/motion/useGsap";
import { cn } from "@/lib/utils";

/**
 * 3D tilt with a travelling glare and inner parallax layers.
 * Children marked `data-depth="0.6"` drift with the pointer for depth.
 */
export function TiltCard({ children, className, max = 7, glare = true }: { children: ReactNode; className?: string; max?: number; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isFinePointer() || prefersReducedMotion()) return;
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    let cancelled = false;
    let detach: (() => void) | undefined;
    void loadGsap().then(({ gsap }) => {
      if (cancelled) return;
      const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
      const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
      const gx = glareRef.current ? gsap.quickTo(glareRef.current, "x", { duration: 0.6, ease: "power3.out" }) : null;
      const gy = glareRef.current ? gsap.quickTo(glareRef.current, "y", { duration: 0.6, ease: "power3.out" }) : null;
      const lx = layers.map((l) => gsap.quickTo(l, "x", { duration: 0.8, ease: "power3.out" }));
      const ly = layers.map((l) => gsap.quickTo(l, "y", { duration: 0.8, ease: "power3.out" }));
      gsap.set(el, { transformPerspective: 900, transformStyle: "preserve-3d" });

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        rx(-py * max * 2);
        ry(px * max * 2);
        gx?.(px * r.width);
        gy?.(py * r.height);
        layers.forEach((l, i) => {
          const d = Number(l.dataset.depth ?? 0.5);
          lx[i](px * 28 * d);
          ly[i](py * 28 * d);
        });
        if (glareRef.current) gsap.to(glareRef.current, { opacity: 1, duration: 0.3, overwrite: "auto" });
      };
      const onLeave = () => {
        rx(0);
        ry(0);
        lx.forEach((f) => f(0));
        ly.forEach((f) => f(0));
        if (glareRef.current) gsap.to(glareRef.current, { opacity: 0, duration: 0.5, overwrite: "auto" });
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      detach = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => {
      cancelled = true;
      detach?.();
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("relative will-change-transform", className)}>
      {children}
      {glare && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div
            ref={glareRef}
            className="absolute left-1/2 top-1/2 size-[140%] -translate-x-1/2 -translate-y-1/2 opacity-0"
            style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.32), rgba(255,255,255,0) 45%)" }}
          />
        </div>
      )}
    </div>
  );
}
