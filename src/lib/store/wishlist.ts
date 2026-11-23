"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => boolean;
  has: (productId: string) => boolean;
  replace: (ids: string[]) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) => {
        const on = !get().ids.includes(productId);
        set((s) => ({ ids: on ? [...s.ids, productId] : s.ids.filter((id) => id !== productId) }));
        // Fire-and-forget sync for signed-in customers (no-op for guests).
        fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: get().ids }),
        }).catch(() => {});
        return on;
      },
      has: (productId) => get().ids.includes(productId),
      replace: (ids) => set({ ids: [...new Set(ids)] }),
    }),
    {
      name: "ritan-wishlist",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
