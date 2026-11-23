"use client";

import { useEffect, useRef, type RefObject } from "react";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";
import { cn } from "@/lib/utils";
import type { Simulation } from "./engine";
import type { PhysicsPreset } from "./presets";

type IdleHandle = { kind: "idle"; id: number } | { kind: "timeout"; id: ReturnType<typeof setTimeout> };

function whenIdle(cb: () => void, timeout = 1200): IdleHandle {
  if (typeof window.requestIdleCallback === "function") return { kind: "idle", id: window.requestIdleCallback(cb, { timeout }) };
  return { kind: "timeout", id: setTimeout(cb, 250) };
}
function cancelIdle(h: IdleHandle) {
  if (h.kind === "idle") window.cancelIdleCallback(h.id);
  else clearTimeout(h.id);
}

/**
 * Matter.js ingredient field. Lazy-loads the physics engine once the page
 * has loaded and is idle (never blocks LCP or hydration), renders sprites to a sharp back canvas plus an
 * optional blurred front canvas for depth, and listens for pointer input on
 * `interactionRef` (defaults to the parent element) so content underneath
 * stays clickable.
 */
export function PhysicsField({
  preset,
  className,
  backClassName,
  frontClassName,
  withFront = false,
  interactionRef,
  delay = 0,
  active = true,
  onReady,
  onEmpty,
}: {
  preset: PhysicsPreset;
  className?: string;
  backClassName?: string;
  frontClassName?: string;
  withFront?: boolean;
  interactionRef?: RefObject<HTMLElement | null>;
  delay?: number;
  active?: boolean;
  onReady?: (sim: Simulation) => void;
  onEmpty?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const readyRef = useRef(onReady);
  const emptyRef = useRef(onEmpty);

  useEffect(() => {
    readyRef.current = onReady;
    emptyRef.current = onEmpty;
  });

  useEffect(() => {
    if (!active) return;
    const host = hostRef.current;
    const back = backRef.current;
    if (!host || !back) return;
    let sim: Simulation | null = null;
    let cancelled = false;
    const introDelay = document.documentElement.dataset.intro === "play" ? 900 : 0;

    // Start only after the page has loaded and gone idle, so the engine never
    // competes with hydration or the LCP image.
    let handle: IdleHandle | null = null;
    const run = async () => {
      const { default: Matter } = await import("matter-js");
      const { createSimulation } = await import("./engine");
      if (cancelled) return;
      sim = await createSimulation(Matter, preset, {
        host,
        back,
        front: withFront ? frontRef.current : null,
        interaction: interactionRef?.current ?? host.parentElement ?? host,
        reduced: prefersReducedMotion(),
        fine: isFinePointer(),
        delay: delay + introDelay,
        onEmpty: () => emptyRef.current?.(),
      });
      if (cancelled) {
        sim.destroy();
        return;
      }
      readyRef.current?.(sim);
    };
    const schedule = () => {
      handle = whenIdle(run, 2500);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      if (handle) cancelIdle(handle);
      sim?.destroy();
    };
  }, [preset, withFront, interactionRef, delay, active]);

  return (
    <div ref={hostRef} aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas ref={backRef} className={cn("absolute inset-0", backClassName)} />
      {withFront && <canvas ref={frontRef} className={cn("absolute inset-0", frontClassName)} />}
    </div>
  );
}
