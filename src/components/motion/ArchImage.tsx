"use client";

import Image from "next/image";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { useNearViewport } from "@/lib/motion/useNearViewport";
import { cn } from "@/lib/utils";

/**
 * Image in an organic mask (arch / leaf / pill) whose photo drifts inside
 * the frame as you scroll - the frame and the picture move at different
 * speeds, so the image feels deeper than the page.
 */
export function ArchImage({
  src,
  alt,
  className,
  shape = "arch",
  objectPosition = "50% 50%",
  speed = 0.14,
  sizes = "(min-width: 1024px) 30vw, 80vw",
  preload = false,
}: {
  src: string;
  alt: string;
  className?: string;
  shape?: "arch" | "leaf" | "pill" | "round";
  objectPosition?: string;
  speed?: number;
  sizes?: string;
  /** Above-the-fold image (likely LCP): load eagerly with high priority. */
  preload?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const near = useNearViewport(frame);

  useGsap(
    ({ gsap }) => {
      if (!near || !frame.current || !inner.current || prefersReducedMotion()) return;
      gsap.fromTo(
        inner.current,
        { yPercent: -speed * 50, scale: 1.18 },
        { yPercent: speed * 50, scale: 1.08, ease: "none", scrollTrigger: { trigger: frame.current, start: "top bottom", end: "bottom top", scrub: true } },
      );
      gsap.from(frame.current, {
        y: 60,
        scale: 0.94,
        // Above-the-fold frames stay visible (transform-only entrance) so they can paint as LCP immediately.
        opacity: preload ? 1 : 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: frame.current, start: "top 88%", once: true },
      });
    },
    { dependencies: [near, speed, preload] },
  );

  return (
    <div
      ref={frame}
      className={cn(
        "relative overflow-hidden bg-parchment-200",
        shape === "arch" && "rounded-[999px_999px_1.5rem_1.5rem]",
        shape === "leaf" && "rounded-[0_999px_0_999px]",
        shape === "pill" && "rounded-full",
        shape === "round" && "rounded-[2rem]",
        className,
      )}
    >
      <div ref={inner} className="absolute inset-[-8%] will-change-transform">
        <Image src={src} alt={alt} fill sizes={sizes} quality={80} preload={preload} fetchPriority={preload ? "high" : undefined} className="object-cover" style={{ objectPosition }} />
      </div>
    </div>
  );
}
