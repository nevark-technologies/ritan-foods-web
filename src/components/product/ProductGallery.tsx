"use client";

import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { useMemo, useRef, useState, ViewTransition } from "react";
import { PhysicsField } from "@/components/physics/PhysicsField";
import { productPreset } from "@/components/physics/presets";
import type { Product } from "@/lib/data/types";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion/env";
import { loadGsap } from "@/lib/motion/useGsap";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/** Sticky gallery: pack on its palette with a living ingredient field and zoom lens, then up to 2 product photos. */
export function ProductGallery({ product }: { product: Product }) {
  // 0 is the pack; 1 and 2 are product.gallery[0] and [1].
  const [view, setView] = useState(0);
  const photos = product.gallery;
  const current = view > 0 && photos[view - 1] ? view : 0;
  const photo = current > 0 ? photos[current - 1] : undefined;
  const stageRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const preset = useMemo(() => productPreset(product.sprites, product.slug), [product.sprites, product.slug]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (current !== 0 || !isFinePointer() || prefersReducedMotion() || !lensRef.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const lens = lensRef.current;
    void loadGsap().then(({ gsap }) => gsap.to(lens, { xPercent: (0.5 - x) * 45, yPercent: (0.5 - y) * 45, scale: 1.55, duration: 0.6, ease: "power3.out", overwrite: "auto" }));
  };
  const onLeave = () => {
    const lens = lensRef.current;
    if (lens) void loadGsap().then(({ gsap }) => gsap.to(lens, { xPercent: 0, yPercent: 0, scale: 1, duration: 0.8, ease: "expo.out", overwrite: "auto" }));
  };

  return (
    <div className="lg:sticky lg:top-28 lg:self-start">
      <div
        ref={stageRef}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        data-cursor={current === 0 ? "Zoom" : undefined}
        className="relative aspect-[4/5] overflow-hidden rounded-[2.25rem] lg:aspect-[5/6]"
        style={{ background: `radial-gradient(120% 90% at 50% 35%, ${product.palette.bg}, color-mix(in oklab, ${product.palette.bg} 84%, #000))` }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {!photo ? (
            <m.div key="pack" className="absolute inset-0" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={spring.soft}>
              <PhysicsField preset={preset} interactionRef={stageRef} withFront backClassName="z-0" frontClassName="z-20" />
              <div className="absolute inset-x-0 bottom-[17%] top-[7%] z-10 flex justify-center">
                <div ref={lensRef} className="h-full will-change-transform">
                  <ViewTransition name={`pack-${product.slug}`} share="morph">
                    <Image
                      src={product.image}
                      alt={`${product.name} pack`}
                      width={product.imageWidth}
                      height={product.imageHeight}
                      preload
                      fetchPriority="high"
                      quality={80}
                      sizes="(min-width: 1024px) 34vw, 80vw"
                      className="h-full w-auto object-contain drop-shadow-[0_40px_45px_rgba(0,0,0,0.28)]"
                    />
                  </ViewTransition>
                </div>
              </div>
            </m.div>
          ) : (
            <m.div key={`photo-${current}`} className="absolute inset-0 flex items-center justify-center p-6 sm:p-10" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={spring.soft}>
              {/* The whole photo, never cropped; it only loads once its tab is chosen. */}
              <Image
                src={photo.src}
                alt={`${product.name}, photo ${current + 1}`}
                width={photo.width}
                height={photo.height}
                loading="eager"
                quality={80}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="h-auto max-h-full w-auto max-w-full rounded-[1.5rem] object-contain"
              />
            </m.div>
          )}
        </AnimatePresence>
        {current === 0 && (
          <span className="pointer-events-none absolute left-5 top-5 z-30 rounded-full bg-cream-50/85 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-forest-800 backdrop-blur">
            Drag the ingredients
          </span>
        )}
      </div>
      {photos.length > 0 && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
          {[undefined, ...photos].map((p, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={current === i}
              aria-label={p ? `Photo ${i + 1}` : "Pack"}
              onClick={() => setView(i)}
              className={cn("relative size-20 overflow-hidden rounded-2xl border-2 transition-colors", current === i ? "border-forest-700" : "border-transparent opacity-70 hover:opacity-100")}
              style={{ background: product.palette.bg }}
            >
              {p ? (
                <Image src={p.src} alt="" fill sizes="80px" className="object-contain p-1.5" />
              ) : (
                <Image src={product.image} alt="" width={80} height={80} sizes="80px" className="mx-auto h-16 w-auto object-contain" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
