/** Environment checks shared by motion code (no GSAP import, so they're free to use anywhere). */

/**
 * The site's motion is part of the brand, so it runs even when the device asks for
 * reduced motion (owner's decision). Kept as one switch: return the media-query
 * result again to restore the reduced-motion behaviour everywhere.
 */
export function prefersReducedMotion() {
  return false;
}

export function isFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
