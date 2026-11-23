"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { reveal } from "@/lib/motion/tokens";
import { useNearViewport } from "@/lib/motion/useNearViewport";
import { cn } from "@/lib/utils";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** "lines" = masked line rise, "words" = soft word stagger, "chars" = character cascade */
  type?: "lines" | "words" | "chars";
  delay?: number;
  start?: string;
  /** Scrub word-by-word colour fill against scroll instead of a one-shot reveal */
  fill?: boolean;
};

/**
 * Editorial text reveal using GSAP SplitText with masked lines.
 * Text stays visible without JS (`html.js` gates the pre-hide).
 */
export function SplitReveal({ as: Tag = "h2", children, className, type = "lines", delay = 0, start = reveal.start, fill = false }: Props) {
  const ref = useRef<HTMLElement>(null);
  const near = useNearViewport(ref);

  useGsap(
    ({ gsap, SplitText }) => {
      const el = ref.current;
      if (!el || !near) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 1 });
        return;
      }
      const split = SplitText.create(el, {
        type: fill ? "words" : type === "chars" ? "lines,chars" : type === "words" ? "lines,words" : "lines",
        mask: fill ? undefined : "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { autoAlpha: 1 });
          if (fill) {
            return gsap.fromTo(
              self.words,
              { opacity: 0.16 },
              {
                opacity: 1,
                ease: "none",
                stagger: 0.08,
                scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
              },
            );
          }
          const targets = type === "chars" ? self.chars : type === "words" ? self.words : self.lines;
          return gsap.from(targets, {
            yPercent: type === "lines" ? 112 : 60,
            rotate: type === "lines" ? 2.5 : 0,
            opacity: type === "lines" ? 1 : 0,
            duration: type === "chars" ? 0.9 : 1.15,
            ease: "expo.out",
            stagger: type === "chars" ? 0.018 : type === "words" ? 0.045 : reveal.lineStagger,
            delay,
            scrollTrigger: { trigger: el, start, once: true },
          });
        },
      });
      return () => split.revert();
    },
    { scope: ref, dependencies: [near, type, delay, start, fill] },
  );

  return (
    <Tag ref={ref} className={cn("split-reveal", className)}>
      {children}
    </Tag>
  );
}
