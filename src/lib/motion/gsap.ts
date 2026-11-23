"use client";

import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { ORGANIC_EASE_PATH } from "./tokens";

let registered = false;

export function ensureGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, useGSAP);
  CustomEase.create("organic", ORGANIC_EASE_PATH);
  gsap.defaults({ ease: "expo.out", duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

ensureGsap();

export { prefersReducedMotion, isFinePointer } from "./env";

/**
 * Only ever imported lazily (see `loadGsap` / `useGsap` in ./useGsap) so GSAP
 * stays out of the initial bundle.
 */
export { gsap, ScrollTrigger, SplitText, CustomEase, useGSAP };
