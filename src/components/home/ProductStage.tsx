"use client";

import { ArrowRight, Plus } from "lucide-react";
import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { defaultVariant, useAddToCart } from "@/components/cart/useAddToCart";
import { Magnetic } from "@/components/motion/Magnetic";
import { useMediaQuery } from "@/components/motion/SmoothScroll";
import { spriteSize, spriteSrc } from "@/components/physics/sprites";
import type { Product } from "@/lib/data/types";
import { prefersReducedMotion } from "@/lib/motion/env";
import { useGsap } from "@/lib/motion/useGsap";
import { spring } from "@/lib/motion/tokens";
import { cn, formatINR, pad2, readableOn } from "@/lib/utils";

const STAGE_WORD: Record<string, string> = {
  "idli-podi": "Podi",
  "curry-leaf-rice-mix": "Curry Leaf",
  "sprouted-millet-health-mix": "Millet",
  "abc-malt": "A·B·C",
  "nendran-banana-malt": "Nendran",
  "plant-based-protein": "Protein",
};

const wordSize = (word: string) => `${Math.min(25, 86 / (0.5 * word.length)).toFixed(1)}vw`;

function OrbitSprites({ product, className }: { product: Product; className?: string }) {
  const ring = product.sprites.concat(product.sprites).slice(0, 7);
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute left-1/2 top-1/2 size-[min(72vh,46vw)] -translate-x-1/2 -translate-y-1/2 animate-[spin_48s_linear_infinite] motion-reduce:animate-none">
        {ring.map((id, k) => {
          const angle = (k / ring.length) * Math.PI * 2;
          const r = 46 + (k % 2) * 6;
          const def = spriteSize(id);
          const scale = def.w * def.h > 900 ? 1.5 : 3.2;
          return (
            <span
              key={`${id}-${k}`}
              className="absolute"
              style={{
                left: `${50 + Math.cos(angle) * r}%`,
                top: `${50 + Math.sin(angle) * r}%`,
                transform: `translate(-50%, -50%) rotate(${(k * 47) % 360}deg)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG sprite */}
              <img src={spriteSrc(id)} alt="" width={def.w * scale} height={def.h * scale} decoding="async" className="drop-shadow-[0_10px_12px_rgba(0,0,0,0.18)]" />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StageCopy({ product, index, total }: { product: Product; index: number; total: number }) {
  const addToCart = useAddToCart();
  const quick = defaultVariant(product.variants);
  const from = Math.min(...product.variants.filter((v) => v.isActive).map((v) => v.price));
  return (
    <>
      <p className="eyebrow" style={{ color: readableOn(product.palette.accent, product.palette.bg, product.palette.ink) }}>
        {pad2(index + 1)} / {pad2(total)} · {product.tagline}
      </p>
      <h3 className="mt-4 font-display text-[clamp(2.4rem,3.6vw,3.6rem)] leading-[1.02]" style={{ color: product.palette.ink }}>
        {product.name}
      </h3>
      <p className="mt-4 text-body-lg opacity-80" style={{ color: product.palette.ink }}>
        {product.summary}
      </p>
      <p className="mt-6 text-sm opacity-70" style={{ color: product.palette.ink }}>
        5 pack sizes from <span className="tabular font-display text-2xl opacity-100">{formatINR(from)}</span>
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-4">
        {quick && (
          <Magnetic>
            <m.button
              type="button"
              whileTap={{ scaleX: 1.1, scaleY: 0.88 }}
              transition={spring.squash}
              onClick={(e) => {
                const img = (e.currentTarget.closest("[data-stage]") as HTMLElement | null)?.querySelector<HTMLImageElement>(`[data-pack-img="${product.slug}"]`);
                addToCart(product, quick, 1, img);
              }}
              className="flex h-13 items-center gap-2 rounded-full px-7 py-3.5 text-[0.95rem] font-semibold text-cream-50 shadow-lg"
              style={{ background: product.palette.deep }}
            >
              <Plus className="size-4" /> Add {quick.weightG} g · {formatINR(quick.price)}
            </m.button>
          </Magnetic>
        )}
        <Link href={`/products/${product.slug}`} className="group inline-flex items-center gap-2 text-sm font-semibold" style={{ color: product.palette.ink }}>
          Discover
          <ArrowRight className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
        </Link>
      </div>
    </>
  );
}

export function ProductStage({ products }: { products: Product[] }) {
  const root = useRef<HTMLElement>(null);
  const total = products.length;
  // The desktop stage is heavy (packs, orbiting sprites, split letters), so it
  // is only built on large screens, on the client. The section keeps its full
  // height in the server HTML, so nothing shifts when the stage mounts.
  const desktop = useMediaQuery("(min-width: 1024px)");

  useGsap(
    ({ gsap }) => {
      const el = root.current;
      if (!el || !desktop) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const q = gsap.utils.selector(el);
        const bgs = q<HTMLElement>("[data-bg]");
        const words = q<HTMLElement>("[data-word]");
        const packs = q<HTMLElement>("[data-pack]");
        const copies = q<HTMLElement>("[data-copy]");
        const orbits = q<HTMLElement>("[data-orbit]");
        const counter = q<HTMLElement>("[data-counter]")[0];
        const bar = q<HTMLElement>("[data-bar]")[0];
        const reduced = prefersReducedMotion();

        words.forEach((w, i) => {
          if (i > 0) gsap.set(w.querySelectorAll("[data-letter]"), { yPercent: 115 });
        });
        gsap.set(words, { opacity: 1 });

        const setActive = (i: number) => {
          copies.forEach((c, k) => {
            c.dataset.active = String(k === i);
            c.inert = k !== i;
          });
        };
        setActive(0);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: reduced ? true : 0.8,
            snap: reduced ? undefined : { snapTo: 1 / (total - 1), inertia: false, duration: { min: 0.25, max: 0.7 }, delay: 0.15, ease: "power2.inOut" },
            onUpdate: (self) => setActive(Math.round(self.progress * (total - 1))),
          },
        });

        for (let i = 0; i < total - 1; i++) {
          const at = i;
          const letterOut = words[i].querySelectorAll("[data-letter]");
          const letterIn = words[i + 1].querySelectorAll("[data-letter]");
          tl.to(bgs[i + 1], { opacity: 1, duration: 0.5 }, at + 0.25)
            .to(letterOut, { yPercent: -115, rotate: -6, stagger: 0.025, duration: 0.35, ease: "power2.in" }, at + 0.15)
            .fromTo(letterIn, { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, stagger: 0.02, duration: 0.35, ease: "power3.out" }, at + 0.45)
            .to(packs[i], { yPercent: -70, rotation: -16, scale: 0.78, opacity: 0, duration: 0.45, ease: "power2.in" }, at + 0.2)
            .fromTo(packs[i + 1], { yPercent: 75, rotation: 14, scale: 0.86, opacity: 0 }, { yPercent: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }, at + 0.5)
            .to(orbits[i], { opacity: 0, scale: 0.8, duration: 0.3 }, at + 0.2)
            .fromTo(orbits[i + 1], { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" }, at + 0.55)
            .to(copies[i], { opacity: 0, y: -40, duration: 0.3 }, at + 0.15)
            .fromTo(copies[i + 1], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, at + 0.6)
            .to(counter, { yPercent: -((i + 1) * 100) / total, duration: 0.5, ease: "power3.inOut" }, at + 0.35);
        }
        tl.fromTo(bar, { scaleX: 1 / total }, { scaleX: 1, duration: total - 1, ease: "none" }, 0);
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [total, desktop] },
  );

  return (
    <>
      {/* Desktop: sticky, scroll-scrubbed stage */}
      <section ref={root} aria-label="Our products" className="relative hidden lg:block" style={{ height: `${total * 100}vh` }}>
        {desktop && (
          <div data-stage className="sticky top-0 h-screen overflow-hidden">
            {products.map((p, i) => (
              <div key={p.id} data-bg aria-hidden className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 50% 40%, ${p.palette.bg} 0%, color-mix(in oklab, ${p.palette.bg} 82%, #000) 100%)`, opacity: i === 0 ? 1 : 0 }} />
            ))}

            <div className="absolute left-[var(--gutter)] top-[calc(var(--header-h)+1.25rem)] z-30">
              <p className="eyebrow text-forest-900/70">Our products · Made with love</p>
            </div>

            {products.map((p, i) => {
              const word = STAGE_WORD[p.slug] ?? p.name;
              return (
                <div key={p.id} data-word aria-hidden className="absolute inset-0 z-10 grid place-items-center" style={{ opacity: i === 0 ? 1 : 0 }}>
                  <span
                    className="flex overflow-hidden whitespace-pre pb-[0.06em] font-display italic leading-[0.86]"
                    style={{ fontSize: wordSize(word), color: `color-mix(in oklab, ${p.palette.deep} 34%, ${p.palette.bg})` }}
                  >
                    {word.split("").map((ch, k) => (
                      <span key={k} data-letter className="inline-block will-change-transform">
                        {ch}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}

            {products.map((p, i) => (
              <div
                key={p.id}
                data-orbit
                // Ingredients fade out before they reach the copy column, so they never sit under the text.
                className="absolute inset-0 z-20 [-webkit-mask-image:linear-gradient(to_right,#000_56%,transparent_67%)] [mask-image:linear-gradient(to_right,#000_56%,transparent_67%)]"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <OrbitSprites product={p} />
              </div>
            ))}

            {products.map((p, i) => (
              <div key={p.id} data-pack className="absolute left-1/2 top-1/2 z-20 h-[min(66vh,54vw)] -translate-x-1/2 -translate-y-[46%]" style={{ opacity: i === 0 ? 1 : 0 }}>
                <Link href={`/products/${p.slug}`} data-cursor="View" aria-label={`View ${p.name}`} tabIndex={-1} className="block h-full">
                  <Image
                    data-pack-img={p.slug}
                    src={p.image}
                    alt={`${p.name} pack`}
                    width={p.imageWidth}
                    height={p.imageHeight}
                    sizes="(min-width: 1024px) 30vw, 1px"
                    quality={90}
                    className="h-full w-auto drop-shadow-[0_40px_50px_rgba(0,0,0,0.3)]"
                  />
                </Link>
              </div>
            ))}

            {products.map((p, i) => (
              <div
                key={p.id}
                data-copy
                data-active={i === 0}
                className="absolute right-[var(--gutter)] top-1/2 z-30 w-[min(27rem,30vw)] -translate-y-1/2 data-[active=false]:pointer-events-none"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                <StageCopy product={p} index={i} total={total} />
              </div>
            ))}

            {/* Index + progress */}
            <div className="absolute bottom-10 left-[var(--gutter)] z-30 flex items-end gap-6">
              <div className="h-[5.5rem] overflow-hidden font-display text-[5.5rem] leading-none text-forest-900/85" aria-hidden>
                <div data-counter className="will-change-transform">
                  {products.map((p, i) => (
                    <div key={p.id} className="tabular h-[5.5rem]">
                      {pad2(i + 1)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-900/60">Scroll to explore</p>
                <div className="mt-3 h-[3px] w-48 overflow-hidden rounded-full bg-forest-900/15">
                  <div data-bar className="h-full origin-left rounded-full bg-forest-900/80" style={{ transform: `scaleX(${1 / total})` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mobile / tablet: swipeable snap carousel */}
      <section aria-label="Our products" className="bg-parchment-100 py-20 lg:hidden">
        <div className="container-x">
          <p className="eyebrow text-leaf-600">Our products</p>
          <h2 className="mt-3 font-display text-display-md text-forest-900">
            Made with <em className="display-italic text-leaf-500">love.</em>
          </h2>
        </div>
        <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-4" data-lenis-prevent>
          {products.map((p, i) => (
            <MobileStageCard key={p.id} product={p} index={i} total={total} />
          ))}
        </div>
      </section>
    </>
  );
}

function MobileStageCard({ product, index, total }: { product: Product; index: number; total: number }) {
  const img = useRef<HTMLImageElement>(null);
  const addToCart = useAddToCart();
  const quick = defaultVariant(product.variants);
  return (
    <article className="relative w-[84vw] max-w-[26rem] shrink-0 snap-center overflow-hidden rounded-[2rem] p-6" style={{ background: product.palette.bg, color: product.palette.ink }}>
      <p className="eyebrow" style={{ color: readableOn(product.palette.accent, product.palette.bg, product.palette.ink) }}>
        {pad2(index + 1)} / {pad2(total)}
      </p>
      <span aria-hidden className="pointer-events-none absolute -right-4 top-10 font-display text-[7rem] italic leading-none opacity-15" style={{ color: product.palette.deep }}>
        {(STAGE_WORD[product.slug] ?? product.name).split(" ")[0]}
      </span>
      <Link href={`/products/${product.slug}`} className="relative mx-auto mt-4 block h-72 w-fit">
        <Image ref={img} src={product.image} alt={`${product.name} pack`} width={product.imageWidth} height={product.imageHeight} sizes="60vw" className="h-full w-auto drop-shadow-[0_24px_30px_rgba(0,0,0,0.25)]" />
      </Link>
      <h3 className="mt-6 font-display text-3xl leading-tight">{product.name}</h3>
      <p className="mt-1 font-display italic opacity-75">{product.tagline}</p>
      <p className="mt-3 text-sm leading-relaxed opacity-80">{product.summary}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold">
          Discover <ArrowRight className="size-4" />
        </Link>
        {quick && (
          <m.button
            type="button"
            whileTap={{ scaleX: 1.1, scaleY: 0.88 }}
            transition={spring.squash}
            onClick={() => addToCart(product, quick, 1, img.current)}
            className="flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-semibold text-cream-50"
            style={{ background: product.palette.deep }}
          >
            <Plus className="size-4" /> {formatINR(quick.price)}
          </m.button>
        )}
      </div>
    </article>
  );
}
