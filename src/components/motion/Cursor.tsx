"use client";

import { useEffect, useRef } from "react";
// Cursor is itself a lazily loaded chunk (see Overlays), so a static GSAP import is fine here.
import { gsap } from "@/lib/motion/gsap";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";

/**
 * Two-part cursor: a dot that tracks the pointer 1:1 and a ring that trails
 * with inertia. Elements can set `data-cursor="View"` (any label) to morph
 * the ring into a labelled disc. Difference blending keeps it legible on
 * both cream and forest backgrounds. Fine pointers only.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.06, ease: "none" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.06, ease: "none" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.42, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.42, ease: "power3.out" });

    let mode: "idle" | "hover" | "label" = "idle";
    let visible = false;

    const setMode = (next: typeof mode, text = "") => {
      if (next === mode && (next !== "label" || label.textContent === text)) return;
      mode = next;
      label.textContent = text;
      gsap.to(ring, {
        scale: next === "label" ? 2.3 : next === "hover" ? 1.65 : 1,
        backgroundColor: next === "label" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
        duration: 0.45,
        ease: "expo.out",
        overwrite: "auto",
      });
      gsap.to(label, { opacity: next === "label" ? 1 : 0, duration: 0.25, overwrite: "auto" });
      gsap.to(dot, { scale: next === "idle" ? 1 : 0, duration: 0.3, ease: "expo.out", overwrite: "auto" });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      const target = e.target as HTMLElement | null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setMode("label", labelled.dataset.cursor ?? "");
      const interactive = target?.closest("a, button, [role='button'], summary, label, select");
      setMode(interactive ? "hover" : "idle");
    };
    const onDown = () => gsap.to(ring, { scaleX: "*=0.82", scaleY: "*=0.82", duration: 0.15, ease: "power2.out" });
    const onUp = () => setMode(mode, label.textContent ?? "");
    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] hidden mix-blend-difference [html.has-cursor_&]:block">
      <div ref={dotRef} className="absolute left-0 top-0 size-2 rounded-full bg-white opacity-0" />
      <div
        ref={ringRef}
        className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border border-white/90 opacity-0"
      >
        <span ref={labelRef} className="text-[5px] font-bold uppercase tracking-[0.18em] text-black opacity-0" />
      </div>
    </div>
  );
}
