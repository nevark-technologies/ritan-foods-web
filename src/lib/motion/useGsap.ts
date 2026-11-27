"use client";

import { useEffect, useEffectEvent, type DependencyList, type RefObject } from "react";
import { isFinePointer } from "./env";

export type GsapKit = typeof import("./gsap");

let kit: Promise<GsapKit> | null = null;

/**
 * Touch screens wait until the page has loaded and gone idle, or the visitor
 * first scrolls, taps or types (whichever comes first), so GSAP never competes
 * with start-up on a phone. Desktop loads it straight away.
 */
function whenSettled(): Promise<void> {
  if (typeof window === "undefined" || isFinePointer()) return Promise.resolve();
  return new Promise((resolve) => {
    const events = ["scroll", "touchstart", "pointerdown", "keydown"] as const;
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      for (const e of events) window.removeEventListener(e, go, true);
      window.removeEventListener("load", scheduleIdle);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      clearTimeout(timer);
      resolve();
    };
    const scheduleIdle = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 1500 });
      else timer = setTimeout(go, 600);
    };
    for (const e of events) window.addEventListener(e, go, { capture: true, passive: true });
    if (document.readyState === "complete") scheduleIdle();
    else window.addEventListener("load", scheduleIdle, { once: true });
  });
}

/**
 * GSAP (+ ScrollTrigger, SplitText, CustomEase) is loaded on first use instead
 * of shipping in the initial bundle, so it never competes with the first paint.
 */
export const loadGsap = () => (kit ??= whenSettled().then(() => import("./gsap")));

/** Runs `fn` only if GSAP has already been requested (nothing to refresh otherwise). */
export const withLoadedGsap = (fn: (k: GsapKit) => void) => void kit?.then(fn);

/**
 * Lazy counterpart of `useGSAP`: runs `setup` inside a gsap.context once GSAP
 * has loaded, and reverts everything it created (tweens, ScrollTriggers,
 * matchMedia) on cleanup or when `dependencies` change. `when` (checked each
 * time the effect runs) keeps GSAP unloaded until the effect is needed, e.g.
 * until the element nears the viewport.
 */
export function useGsap(
  setup: (kit: GsapKit) => void | (() => void),
  { scope, dependencies = [], when }: { scope?: RefObject<Element | null>; dependencies?: DependencyList; when?: () => boolean } = {},
) {
  const run = useEffectEvent(setup);
  useEffect(() => {
    if (when && !when()) return;
    let cancelled = false;
    let ctx: ReturnType<GsapKit["gsap"]["context"]> | undefined;
    let cleanup: void | (() => void);
    void loadGsap().then((k) => {
      if (cancelled) return;
      ctx = k.gsap.context(() => {
        cleanup = run(k);
      }, scope?.current ?? undefined);
    });
    return () => {
      cancelled = true;
      if (typeof cleanup === "function") cleanup();
      ctx?.revert();
    };
    // Caller-provided dependency list, exactly like useGSAP's `dependencies`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
