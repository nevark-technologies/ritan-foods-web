"use client";

import { Plus } from "lucide-react";
import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { defaultVariant, useAddToCart } from "@/components/cart/useAddToCart";
import { TiltCard } from "@/components/motion/TiltCard";
import { spring } from "@/lib/motion/tokens";
import type { Product } from "@/lib/data/types";
import { cn, formatINR, formatWeight } from "@/lib/utils";
import { Stars } from "./Stars";
import { WishlistButton } from "./WishlistButton";

const CATEGORY: Record<string, string> = {
  podis: "Podi",
  "rice-mixes": "Rice mix",
  "health-mixes": "Health mix",
  wellness: "Wellness",
};

export function ProductCard({ product, morph = true, priority = false, className }: { product: Product; morph?: boolean; priority?: boolean; className?: string }) {
  const addToCart = useAddToCart();
  const quick = defaultVariant(product.variants);
  const prices = product.variants.filter((v) => v.isActive).map((v) => v.price);
  const from = prices.length ? Math.min(...prices) : 0;
  const soldOut = !quick;

  const image = (
    <Image
      src={product.image}
      alt={`${product.name} pack`}
      width={product.imageWidth}
      height={product.imageHeight}
      preload={priority}
      sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
      className="h-full w-auto object-contain drop-shadow-[0_22px_26px_rgba(15,42,23,0.25)]"
    />
  );

  return (
    <article className={cn("group relative", className)}>
      {/* Image area: wishlist + quick-add are anchored to the pack, not to the text below */}
      <div className="relative">
        <TiltCard className="rounded-[2rem]" max={6}>
          {/* Duplicate of the title link: hidden from assistive tech and the tab order */}
          <Link href={`/products/${product.slug}`} className="block" data-cursor="View" aria-hidden tabIndex={-1}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]" style={{ background: product.palette.bg }}>
              <div aria-hidden className="absolute inset-x-[12%] bottom-[9%] h-[10%] rounded-[50%] bg-forest-950/15 blur-xl transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-90" />
              <div
                data-depth="0.7"
                className="absolute inset-x-0 bottom-[8%] top-[9%] flex justify-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 group-hover:-rotate-2"
              >
                {morph ? <ViewTransition name={`pack-${product.slug}`} share="morph">{image}</ViewTransition> : image}
              </div>
              <span data-depth="0.25" className="absolute left-4 top-4 rounded-full bg-cream-50/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-forest-800 backdrop-blur">
                {CATEGORY[product.categoryId]}
              </span>
              {soldOut && <span className="absolute inset-x-4 bottom-4 rounded-full bg-forest-950/80 py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-cream-50">Sold out</span>}
            </div>
          </Link>
        </TiltCard>

        <WishlistButton productId={product.id} name={product.name} className="absolute right-4 top-4 z-10" />

        {!soldOut && (
          <m.button
            type="button"
            whileTap={{ scaleX: 1.12, scaleY: 0.86 }}
            transition={spring.squash}
            onClick={() => quick && addToCart(product, quick, 1)}
            className="absolute bottom-4 right-4 z-10 flex h-11 items-center gap-2 rounded-full bg-forest-800 px-4 text-sm font-semibold text-cream-50 shadow-lg transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
            aria-label={`Add ${formatWeight(quick.weightG)} ${product.name} to bag`}
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Add {formatWeight(quick.weightG)}</span>
          </m.button>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="font-display text-[1.35rem] leading-tight text-forest-900">
            <Link href={`/products/${product.slug}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">
              {product.name}
            </Link>
          </h3>
          <p className="mt-0.5 font-display text-[0.95rem] italic text-ink-500">{product.tagline}</p>
          {product.ratingCount > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
              <Stars value={product.ratingAvg} /> <span className="tabular">({product.ratingCount})</span>
            </p>
          )}
        </div>
        <p className="shrink-0 text-right text-sm text-ink-500">
          from
          <span className="tabular block font-display text-xl text-forest-900">{formatINR(from)}</span>
        </p>
      </div>
    </article>
  );
}
