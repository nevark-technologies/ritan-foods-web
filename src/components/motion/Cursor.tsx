"use client";

import { useEffect, useRef } from "react";
// Cursor is itself a lazily loaded chunk (see Overlays), so a static GSAP import is fine here.
import { gsap } from "@/lib/motion/gsap";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";

const LEAF_IDLE = "#c6d9a3"; // sprout-300
const LEAF_HOVER = "#4e8f2f"; // leaf-500
const OUTLINE = "#0f2a17"; // forest-900
/** Resting tilt: the leaf points up-left like an arrow, its tip on the hotspot. */
const BASE_TILT = -32;

/**
 * Curry-leaf cursor. The leaf's tip is the hotspot; it sways gently at rest,
 * leans into the direction of travel, grows and deepens in colour over links
 * and buttons (with a trailing ring), squishes and flicks on press, and steps
 * aside for a labelled disc on elements with `data-cursor="View"` (any label).
 * Sprout fill with a forest outline reads on both cream and forest sections.
 * Fine pointers only; inputs keep the native caret (globals.css).
 */
export function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const swayRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer() || prefersReducedMotion()) return;
    const layer = layerRef.current!;
    const leaf = leafRef.current!;
    const sway = swayRef.current!;
    const body = bodyRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    // Modal <dialog>s (bag, menu, search) render in the browser's top layer, above any
    // z-index. The cursor is a manual popover so it lives in the top layer too, and it is
    // re-shown whenever a dialog opens so it lands above that dialog.
    const raise = () => {
      try {
        if (layer.matches(":popover-open")) layer.hidePopover();
        layer.showPopover();
      } catch {}
    };
    raise();
    const dialogs = new MutationObserver((records) => {
      if (records.some((r) => r.target instanceof HTMLDialogElement && r.target.open)) raise();
    });
    dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

    // Leaf: tip (top centre) sits on the pointer and is the rotation origin.
    gsap.set(leaf, { xPercent: -50, x: -100, y: -100, rotation: BASE_TILT, transformOrigin: "50% 0%" });
    gsap.set(ring, { xPercent: -50, yPercent: -50, x: -100, y: -100, scale: 0.5 });
    const idleSway = gsap.fromTo(sway, { rotation: -6 }, { rotation: 6, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: -1, transformOrigin: "50% 0%" });

    const leafX = gsap.quickTo(leaf, "x", { duration: 0.05, ease: "none" });
    const leafY = gsap.quickTo(leaf, "y", { duration: 0.05, ease: "none" });
    const leafTilt = gsap.quickTo(leaf, "rotation", { duration: 0.55, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    let mode: "idle" | "hover" | "label" = "idle";
    let visible = false;
    let lastX = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;

    const setMode = (next: typeof mode, text = "") => {
      if (next === mode && (next !== "label" || label.textContent === text)) return;
      mode = next;
      label.textContent = text;
      gsap.to(leaf, { scale: next === "hover" ? 1.35 : next === "label" ? 0.8 : 1, duration: 0.45, ease: "expo.out", overwrite: "auto" });
      gsap.to(body, { attr: { fill: next === "idle" ? LEAF_IDLE : LEAF_HOVER }, duration: 0.3, overwrite: "auto" });
      gsap.to(ring, {
        scale: next === "label" ? 2.1 : next === "hover" ? 1 : 0.5,
        opacity: next === "idle" ? 0 : 1,
        backgroundColor: next === "label" ? "rgba(251,247,238,0.96)" : "rgba(251,247,238,0)",
        duration: 0.45,
        ease: "expo.out",
        overwrite: "auto",
      });
      gsap.to(label, { opacity: next === "label" ? 1 : 0, duration: 0.25, overwrite: "auto" });
      if (next === "idle") idleSway.play();
      else idleSway.pause();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        lastX = e.clientX;
        gsap.set(leaf, { x: e.clientX, y: e.clientY });
        gsap.set(ring, { x: e.clientX, y: e.clientY });
        gsap.to(leaf, { opacity: 1, duration: 0.3 });
      }
      leafX(e.clientX);
      leafY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      // Lean into horizontal travel, then drift back to the resting tilt.
      const lean = gsap.utils.clamp(-22, 22, (e.clientX - lastX) * 1.6);
      lastX = e.clientX;
      leafTilt(BASE_TILT + lean);
      clearTimeout(settle);
      settle = setTimeout(() => leafTilt(BASE_TILT), 120);

      const target = e.target as HTMLElement | null;
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setMode("label", labelled.dataset.cursor ?? "");
      const interactive = target?.closest("a, button, [role='button'], summary, label, select");
      setMode(interactive ? "hover" : "idle");
    };
    const onDown = () => {
      gsap.to(sway, { scaleY: 0.85, scaleX: 1.08, rotation: "+=20", duration: 0.14, ease: "power2.out", overwrite: "auto" });
    };
    const onUp = () => {
      gsap.to(sway, { scaleY: 1, scaleX: 1, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.45)", overwrite: "auto", onComplete: () => { if (mode === "idle") idleSway.restart(); } });
    };
    const onLeave = () => {
      visible = false;
      gsap.to(leaf, { opacity: 0, duration: 0.25 });
      gsap.to(ring, { opacity: 0, duration: 0.25 });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-cursor");
      dialogs.disconnect();
      idleSway.kill();
      clearTimeout(settle);
      try {
        layer.hidePopover();
      } catch {}
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      popover="manual"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] m-0 hidden h-dvh max-h-none w-screen max-w-none overflow-visible border-0 bg-transparent p-0 [html.has-cursor_&]:block"
    >
      <div
        ref={ringRef}
        className="absolute left-0 top-0 grid size-10 place-items-center rounded-full border border-leaf-500/70 opacity-0"
      >
        <span ref={labelRef} className="text-[5px] font-bold uppercase tracking-[0.18em] text-forest-900 opacity-0" />
      </div>
      <div ref={leafRef} className="absolute left-0 top-0 h-[30px] w-[14px] opacity-0">
        <div ref={swayRef} className="size-full drop-shadow-[0_2px_3px_rgba(15,42,23,0.35)]">
          <svg viewBox="0 0 34 72" className="size-full overflow-visible">
            <path ref={bodyRef} d="M17 1C29 14 33 34 27 52C24 62 20 68 17 71C14 68 10 62 7 52C1 34 5 14 17 1Z" fill={LEAF_IDLE} stroke={OUTLINE} strokeWidth="2.6" strokeLinejoin="round" />
            <path d="M17 6L17 68" stroke={OUTLINE} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M17 24L25 17M17 36L27 28M17 48L25 42M17 24L9 17M17 36L7 28M17 48L9 42" stroke={OUTLINE} strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
