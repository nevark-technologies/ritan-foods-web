"use client";

import type Lenis from "lenis";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { isFinePointer } from "@/lib/motion/env";
import { loadGsap } from "@/lib/motion/useGsap";

type LenisRef = { current: Lenis | null };
const LenisContext = createContext<LenisRef>({ current: null });

/** Access the Lenis instance (null on touch devices / reduced motion). */
export function useLenis() {
  return useContext(LenisContext).current;
}
export function useLenisRef() {
  return useContext(LenisContext);
}

/** Stop smooth scrolling while overlays (drawers, menus) are open. */
export function lockScroll(lenis: Lenis | null, locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Touch devices keep their native momentum scrolling (smoother and kinder
    // to battery than syncTouch).
    // Lenis is loaded on demand, so phones never download it.
    if (!isFinePointer()) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;
    void Promise.all([import("lenis"), loadGsap()]).then(([{ default: LenisCtor }, { gsap, ScrollTrigger }]) => {
      if (cancelled) return;
      const lenis = new LenisCtor({
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        autoRaf: false,
        autoToggle: true,
        stopInertiaOnNavigate: true,
        anchors: { offset: -96 },
        prevent: (node) => Boolean((node as HTMLElement).closest?.("[data-lenis-prevent]")),
      });
      lenisRef.current = lenis;
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenis.on("scroll", ScrollTrigger.update);
      teardown = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        lenisRef.current = null;
      };
    });
    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  // On small screens, sections skip rendering until they near the viewport
  // (`.cv-auto`), so the page grows as they appear. Re-measure scroll triggers
  // when that happens (debounced; there are no pinned scenes at these sizes).
  useEffect(() => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    let last = document.documentElement.scrollHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - last) < 4) return;
      last = h;
      clearTimeout(timer);
      timer = setTimeout(() => void loadGsap().then(({ ScrollTrigger }) => ScrollTrigger.refresh()), 250);
    });
    ro.observe(document.body);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}

/**
 * Re-measures Lenis and ScrollTrigger after client navigations.
 * Reads the pathname, so the layout renders it inside <Suspense>.
 */
export function RouteRefresh() {
  const pathname = usePathname();
  const lenisRef = useLenisRef();
  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      lenisRef.current?.resize();
      void loadGsap().then(({ ScrollTrigger }) => !cancelled && ScrollTrigger.refresh());
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [pathname, lenisRef]);
  return null;
}

/** Media-query hook that is SSR-safe (server snapshot = false). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
