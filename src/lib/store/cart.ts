"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Paise, ProductPalette } from "@/lib/data/types";

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  weightG: number;
  /** Display price only - the server always re-prices at checkout. */
  price: Paise;
  image: string;
  palette: ProductPalette;
  quantity: number;
  maxQty: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  pincode: string | null;
  drawerOpen: boolean;
  /** increments on every add, drives the bag bump animation */
  bumpKey: number;
  lastAdded: { name: string; image: string; at: number } | null;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  setPincode: (pin: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const MAX_QTY = 20;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      pincode: null,
      drawerOpen: false,
      bumpKey: 0,
      lastAdded: null,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === item.variantId);
          const cap = Math.min(MAX_QTY, item.maxQty);
          const items = existing
            ? s.items.map((i) => (i.variantId === item.variantId ? { ...i, ...item, quantity: Math.min(cap, i.quantity + qty) } : i))
            : [...s.items, { ...item, quantity: Math.min(cap, qty) }];
          return { items, bumpKey: s.bumpKey + 1, lastAdded: { name: item.name, image: item.image, at: Date.now() } };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(0, Math.min(Math.min(MAX_QTY, i.maxQty), Math.floor(qty))) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      setPincode: (pincode) => set({ pincode }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "ritan-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, pincode: s.pincode }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.price * i.quantity, 0);
