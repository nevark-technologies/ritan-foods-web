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

/** Sticky gallery: pack on its palette with a living ingredient field, zoom lens, lifestyle shot. */
export function ProductGallery({ product }: { product: Product }) {
  const [view, setView] = useState<"pack" | "scene">("pack");
  const stageRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const preset = useMemo(() => productPreset(product.sprites, product.slug), [product.sprites, product.slug]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (view !== "pack" || !isFinePointer() || prefersReducedMotion() || !lensRef.current) return;
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
        data-cursor={view === "pack" ? "Zoom" : undefined}
        className="relative aspect-[4/5] overflow-hidden rounded-[2.25rem] lg:aspect-[5/6]"
        style={{ background: `radial-gradient(120% 90% at 50% 35%, ${product.palette.bg}, color-mix(in oklab, ${product.palette.bg} 84%, #000))` }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {view === "pack" ? (
            <m.div key="pack" className="absolute inset-0" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={spring.soft}>
              <PhysicsField preset={preset} interactionRef={stageRef} withFront backClassName="z-0" frontClassName="z-20" />
              <div className="absolute inset-x-0 bottom-[17%] top-[7%] z-10 flex justify-center">
                <div ref={lensRef} data-pdp-pack className="h-full will-change-transform">
                  <ViewTransition name={`pack-${product.slug}`} share="morph">
                    <Image
                      src={product.image}
                      alt={`${product.name} pack`}
                      width={product.imageWidth}
                      height={product.imageHeight}
                      preload
                      fetchPriority="high"
                      quality={90}
                      sizes="(min-width: 1024px) 34vw, 80vw"
                      className="h-full w-auto object-contain drop-shadow-[0_40px_45px_rgba(0,0,0,0.28)]"
                    />
                  </ViewTransition>
                </div>
              </div>
            </m.div>
          ) : (
            <m.div key="scene" className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={spring.soft}>
              {product.scene && <Image src={product.scene} alt={`${product.name} served with traditional dishes`} fill sizes="(min-width: 1024px) 45vw, 100vw" quality={85} className="object-cover" />}
            </m.div>
          )}
        </AnimatePresence>
        <span className="pointer-events-none absolute left-5 top-5 z-30 rounded-full bg-cream-50/85 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-forest-800 backdrop-blur">
          {view === "pack" ? "Drag the ingredients" : "Serving suggestion"}
        </span>
      </div>
      {product.scene && (
        <div className="mt-4 flex gap-3" role="tablist" aria-label="Product images">
          {(["pack", "scene"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn("relative size-20 overflow-hidden rounded-2xl border-2 transition-colors", view === v ? "border-forest-700" : "border-transparent opacity-70 hover:opacity-100")}
              style={{ background: product.palette.bg }}
            >
              {v === "pack" ? (
                <Image src={product.image} alt="Pack" width={80} height={80} sizes="80px" className="mx-auto h-16 w-auto object-contain" />
              ) : (
                <Image src={product.scene!} alt="Serving suggestion" fill sizes="80px" className="object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
