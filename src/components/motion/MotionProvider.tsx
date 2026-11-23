"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("@/lib/motion/motion-features").then((mod) => mod.default);

/**
 * All Motion components in the app are `m.*`; their feature code (springs,
 * gestures, drag, layout) streams in after the first paint. `strict` makes a
 * stray full `motion.*` import fail loudly instead of re-bloating the bundle.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
