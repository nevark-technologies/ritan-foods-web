"use client";

import { useRef } from "react";
import { PhysicsField } from "@/components/physics/PhysicsField";
import { footerPreset } from "@/components/physics/presets";

/** Curry leaves that drift down and settle along the footer's edge. */
export function FooterLeaves() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="absolute inset-x-0 bottom-0 h-[340px]">
      <PhysicsField preset={footerPreset} interactionRef={ref} backClassName="opacity-90" />
    </div>
  );
}
