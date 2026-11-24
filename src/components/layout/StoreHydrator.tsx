"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";

/** Rehydrates persisted stores after mount (keeps SSR markup stable). */
export function StoreHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    void useWishlist.persist.rehydrate();
  }, []);
  // Storefront images can't be dragged out (Firefox ignores -webkit-user-drag in globals.css).
  useEffect(() => {
    const noImageDrag = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };
    document.addEventListener("dragstart", noImageDrag);
    return () => document.removeEventListener("dragstart", noImageDrag);
  }, []);
  return null;
}

/** True once the persisted cart has been read from localStorage. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useCart.persist.onFinishHydration(cb),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
