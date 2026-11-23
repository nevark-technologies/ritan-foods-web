/**
 * Shared motion system. Every animated component reads from here so the
 * site moves with one voice: soft, organic, never mechanical.
 * CSS mirrors (durations, easings) live in globals.css (`--dur-*`, `--ease-*`).
 */

export const duration = {
  xs: 0.2,
  sm: 0.35,
  md: 0.6,
  lg: 0.9,
  xl: 1.4,
} as const;

/** Cubic-bezier tuples for Motion (motion/react). */
export const ease = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOut: [0.65, 0, 0.35, 1],
  organic: [0.22, 1.18, 0.36, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** GSAP ease names. `organic` is registered as a CustomEase in lib/motion/gsap.ts */
export const gsapEase = {
  outExpo: "expo.out",
  outQuart: "quart.out",
  inOut: "power3.inOut",
  organic: "organic",
  settle: "elastic.out(1, 0.55)",
  soft: "power2.out",
} as const;

/** SVG path for the CustomEase "organic": quick lift, gentle overshoot, long settle. */
export const ORGANIC_EASE_PATH = "M0,0 C0.14,0.38 0.2,0.98 0.48,1.04 0.72,1.08 0.84,1 1,1";

/** Motion spring presets. */
export const spring = {
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 1 },
  soft: { type: "spring", stiffness: 170, damping: 26, mass: 1 },
  bouncy: { type: "spring", stiffness: 320, damping: 13, mass: 0.9 },
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
  /** Tactile press/squash on buttons and cart controls. */
  squash: { type: "spring", stiffness: 640, damping: 15, mass: 0.6 },
  /** Drawers and sheets. */
  sheet: { type: "spring", stiffness: 260, damping: 32, mass: 0.9 },
} as const;

/** Squash & stretch keyframes (scaleX, scaleY) for tactile feedback. */
export const squash = {
  press: { scaleX: 1.06, scaleY: 0.9 },
  release: { scaleX: [1.06, 0.94, 1.02, 1], scaleY: [0.9, 1.08, 0.98, 1] },
  bump: { scaleX: [1, 1.25, 0.9, 1.04, 1], scaleY: [1, 0.78, 1.12, 0.97, 1] },
} as const;

/** Parallax depth factors (fraction of pointer/scroll travel). */
export const depth = {
  back: 0.12,
  mid: 0.3,
  front: 0.55,
  /** Max pointer-parallax offset in px for depth 1. */
  pointerRange: 36,
} as const;

/** Matter.js physics constants. */
export const physics = {
  gravityY: 1,
  gravityScale: 0.0011,
  restitution: 0.32,
  friction: 0.08,
  frictionAir: 0.018,
  frictionStatic: 0.4,
  density: 0.0016,
  /** Cursor repel radius in CSS px. */
  repelRadius: 150,
  /** Force multiplier applied to bodies inside the repel radius. */
  repelStrength: 0.00085,
  /** Drag constraint stiffness. */
  dragStiffness: 0.18,
  /** Fixed simulation step (ms). */
  step: 1000 / 60,
  /** Bodies kept on touch devices / small screens, as a fraction. */
  mobileFactor: 0.4,
  /** Hard cap on device pixel ratio for physics canvases. */
  maxDpr: 2,
} as const;

/** Reveal defaults for scroll-triggered entrances. */
export const reveal = {
  start: "top 82%",
  y: 48,
  stagger: 0.08,
  lineStagger: 0.09,
} as const;

/** Header behaviour. */
export const header = {
  hideAfter: 140,
  delta: 6,
} as const;

export type SpringName = keyof typeof spring;
