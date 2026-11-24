"use client";

import { useCallback } from "react";
import type { Product, ProductLite, Variant } from "@/lib/data/types";
import { flyToCart } from "@/lib/motion/flyToCart";
import { useCart } from "@/lib/store/cart";

type CartProduct = Pick<Product, "id" | "slug" | "name" | "image" | "palette"> | ProductLite;

/** Smallest in-stock active pack size - the sensible "quick add" default. */
export function defaultVariant(variants: Variant[]) {
  return [...variants].filter((v) => v.isActive && v.stock > 0).sort((a, b) => a.weightG - b.weightG)[0] ?? null;
}

export function useAddToCart() {
  const add = useCart((s) => s.add);
  return useCallback(
    (product: CartProduct, variant: Variant, qty = 1, source?: HTMLElement | null) => {
      void flyToCart(source ?? null);
      add(
        {
          variantId: variant.id,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          weightG: variant.weightG,
          price: variant.price,
          image: product.image,
          palette: product.palette,
          maxQty: Math.max(1, variant.stock),
        },
        qty,
      );
    },
    [add],
  );
}
