"use client";

import { ArrowLeft, ArrowRight, BadgeCheck, Quote } from "lucide-react";
import { m, useMotionValue } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Stars } from "@/components/product/Stars";
import type { Review } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";

/** Drag-to-scroll reviews with inertia and elastic edges. */
export function ReviewsCarousel({ reviews, productNames }: { reviews: Review[]; productNames: Record<string, string> }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [bounds, setBounds] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const measure = () => {
      if (!viewport.current || !track.current) return;
      setBounds({ left: Math.min(0, viewport.current.clientWidth - track.current.scrollWidth), right: 0 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    return () => ro.disconnect();
  }, [reviews.length]);

  const nudge = (dir: 1 | -1) => {
    const card = track.current?.firstElementChild as HTMLElement | null;
    const step = (card?.offsetWidth ?? 360) + 24;
    const next = Math.max(bounds.left, Math.min(0, x.get() - dir * step));
    // The imperative animator is only needed on click, so it loads on demand.
    void import("@/lib/motion/animate").then(({ animate }) => animate(x, next, spring.soft));
  };

  if (!reviews.length) return null;
  const demo = reviews.some((r) => r.isDemo);

  return (
    <section aria-labelledby="reviews-title" className="relative overflow-hidden bg-cream-50 pb-28 lg:pb-40">
      <div className="container-x flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow text-leaf-600">Kind words</p>
          <SplitReveal as="h2" className="mt-4 font-display text-display-lg text-forest-900">
            Loved at <em className="display-italic text-leaf-500">family tables.</em>
          </SplitReveal>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => nudge(-1)} className="grid size-12 place-items-center rounded-full border border-forest-900/15 text-forest-800 hover:bg-forest-900/5" aria-label="Previous reviews">
            <ArrowLeft className="size-5" />
          </button>
          <button type="button" onClick={() => nudge(1)} className="grid size-12 place-items-center rounded-full border border-forest-900/15 text-forest-800 hover:bg-forest-900/5" aria-label="Next reviews">
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>

      <div ref={viewport} className="mt-14 cursor-grab overflow-hidden pl-[var(--gutter)] active:cursor-grabbing" data-cursor="Drag">
        <m.div
          ref={track}
          drag="x"
          style={{ x }}
          dragConstraints={bounds}
          dragElastic={0.12}
          dragTransition={{ power: 0.28, timeConstant: 320, bounceStiffness: 260, bounceDamping: 28 }}
          className="flex w-max gap-6 pr-[var(--gutter)]"
        >
          {reviews.map((r) => (
            <m.figure
              key={r.id}
              whileHover={{ y: -6 }}
              transition={spring.soft}
              className="flex w-[min(84vw,24rem)] shrink-0 select-none flex-col rounded-[2rem] border border-forest-900/10 bg-parchment-100 p-7"
            >
              <Quote className="size-7 text-gold-500" aria-hidden />
              <Stars value={r.rating} size="md" className="mt-4" />
              {r.title && <p className="mt-3 font-display text-2xl leading-tight text-forest-900">{r.title}</p>}
              <blockquote className="mt-3 flex-1 text-ink-700">{r.body}</blockquote>
              <figcaption className="mt-6 flex items-center justify-between gap-3 border-t border-forest-900/10 pt-4 text-sm">
                <span>
                  <span className="block font-semibold text-forest-900">{r.authorName}</span>
                  <span className="text-ink-500">{r.location}</span>
                </span>
                {r.productSlug && (
                  <Link href={`/products/${r.productSlug}`} className="max-w-[45%] truncate rounded-full bg-cream-50 px-3 py-1.5 text-xs font-semibold text-forest-800" draggable={false}>
                    {productNames[r.productSlug] ?? "View product"}
                  </Link>
                )}
              </figcaption>
              {r.verifiedPurchase && (
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-leaf-600">
                  <BadgeCheck className="size-3.5" /> Verified purchase
                </span>
              )}
            </m.figure>
          ))}
        </m.div>
      </div>
      {demo && <p className="container-x mt-8 text-xs text-ink-500">Sample reviews shown in demo mode — replaced by verified customer reviews at launch.</p>}
    </section>
  );
}
