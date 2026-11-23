"use client";

import { useEffect, useEffectEvent, type DependencyList, type RefObject } from "react";

export type GsapKit = typeof import("./gsap");

let kit: Promise<GsapKit> | null = null;

/**
 * GSAP (+ ScrollTrigger, SplitText, CustomEase) is loaded on first use instead
 * of shipping in the initial bundle, so it never competes with the first paint.
 */
export const loadGsap = () => (kit ??= import("./gsap"));

/**
 * Lazy counterpart of `useGSAP`: runs `setup` inside a gsap.context once GSAP
 * has loaded, and reverts everything it created (tweens, ScrollTriggers,
 * matchMedia) on cleanup or when `dependencies` change.
 */
export function useGsap(
  setup: (kit: GsapKit) => void | (() => void),
  { scope, dependencies = [] }: { scope?: RefObject<Element | null>; dependencies?: DependencyList } = {},
) {
  const run = useEffectEvent(setup);
  useEffect(() => {
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
