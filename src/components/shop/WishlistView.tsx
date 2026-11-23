"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useEffect } from "react";
import { useHydrated } from "@/components/layout/StoreHydrator";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { useWishlist } from "@/lib/store/wishlist";

export function WishlistView({ products }: { products: Product[] }) {
  const hydrated = useHydrated();
  const ids = useWishlist((s) => s.ids);
  const replace = useWishlist((s) => s.replace);

  // Signed-in customers: merge the saved wishlist with this device's.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => (r.ok ? r.json() : { ids: [] }))
      .then((data: { ids: string[] }) => {
        if (cancelled || !data.ids?.length) return;
        const merged = [...new Set([...useWishlist.getState().ids, ...data.ids])];
        replace(merged);
        void fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: merged }) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, replace]);

  if (!hydrated) return <div className="skeleton h-80 rounded-[2rem]" />;
  const saved = products.filter((p) => ids.includes(p.id));

  if (!saved.length) {
    return (
      <div className="rounded-[2rem] bg-parchment-100 px-6 py-20 text-center">
        <Heart className="mx-auto size-10 text-chilli-500" />
        <p className="mt-5 font-display text-4xl text-forest-900">Nothing saved yet</p>
        <p className="mt-2 text-ink-500">Tap the heart on any product to keep it here for later.</p>
        <ButtonLink href="/shop" className="mt-8">
          Browse the pantry
        </ButtonLink>
      </div>
    );
  }

  return (
    <m.ul layout className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
      <AnimatePresence initial={false} mode="popLayout">
        {saved.map((p) => (
          <m.li key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring.soft}>
            <ProductCard product={p} />
          </m.li>
        ))}
      </AnimatePresence>
    </m.ul>
  );
}
