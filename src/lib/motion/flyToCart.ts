"use client";

import { prefersReducedMotion } from "./env";
import { loadGsap } from "./useGsap";

/**
 * Clone the product image and throw it into the bag along an arc:
 * x eases linearly-ish while y uses back.in for the lift-then-drop, the
 * clone spins and shrinks, then the bag squashes (handled by the header).
 */
export async function flyToCart(source: HTMLElement | null): Promise<void> {
  if (!source || prefersReducedMotion()) return;
  const { gsap } = await loadGsap();
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!target) return;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const clone = source.cloneNode(true) as HTMLElement;
  const size = Math.min(from.width, from.height, 220);
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left + from.width / 2 - size / 2}px`,
    top: `${from.top + from.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "contain",
    zIndex: "95",
    pointerEvents: "none",
    margin: "0",
  } satisfies Partial<CSSStyleDeclaration>);
  clone.removeAttribute("srcset");
  document.body.appendChild(clone);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);

  return new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        clone.remove();
        resolve();
      },
    });
    tl.to(clone, { x: dx, duration: 0.85, ease: "power1.inOut" }, 0)
      .to(clone, { y: dy, duration: 0.85, ease: "back.in(2.2)" }, 0)
      .to(clone, { scale: 0.16, rotation: 200, duration: 0.85, ease: "power2.in" }, 0)
      .to(clone, { opacity: 0, duration: 0.15 }, 0.75);
  });
}
