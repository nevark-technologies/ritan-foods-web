"use client";

import { useMemo, useRef } from "react";
import { PhysicsField } from "@/components/physics/PhysicsField";
import { confettiPreset } from "@/components/physics/presets";
import type { SpriteId } from "@/lib/data/types";

/** A celebratory burst of curry leaves, chillies and the order's own ingredients. */
export function SuccessConfetti({ sprites }: { sprites: SpriteId[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const preset = useMemo(() => confettiPreset(sprites), [sprites]);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <PhysicsField preset={preset} interactionRef={ref} withFront backClassName="z-0" frontClassName="z-10" />
    </div>
  );
}
