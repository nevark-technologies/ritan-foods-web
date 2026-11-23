"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/components/motion/SmoothScroll";
import type { ProductLite } from "@/lib/data/types";
import { useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";

const loadDrawer = () => import("@/components/cart/CartDrawer");
const loadToast = () => import("@/components/cart/CartToast");
const loadSearch = () => import("@/components/search/SearchPalette");
const loadMenu = () => import("./MobileMenu");
const loadCursor = () => import("@/components/motion/Cursor");

const CartDrawer = dynamic(() => loadDrawer().then((m) => m.CartDrawer), { ssr: false });
const CartToast = dynamic(() => loadToast().then((m) => m.CartToast), { ssr: false });
const SearchPalette = dynamic(() => loadSearch().then((m) => m.SearchPalette), { ssr: false });
const MobileMenu = dynamic(() => loadMenu().then((m) => m.MobileMenu), { ssr: false });
const Cursor = dynamic(() => loadCursor().then((m) => m.Cursor), { ssr: false });

/** True from the first time `flag` is true (keeps the overlay mounted for its exit animation). */
function useLatch(flag: boolean) {
  const [latched, setLatched] = useState(flag);
  if (flag && !latched) setLatched(true);
  return latched || flag;
}

/**
 * Drawers, palette, menu and toast are code-split and mounted on first use,
 * so they cost nothing during hydration. Their chunks are warmed once the
 * page is idle, which keeps the first open instant.
 */
export function Overlays({
  freeShippingThreshold,
  suggestions,
  products,
  phone,
  whatsapp,
}: {
  freeShippingThreshold: number;
  suggestions: ProductLite[];
  products: ProductLite[];
  phone: string;
  whatsapp: string;
}) {
  const drawer = useLatch(useCart((s) => s.drawerOpen));
  const toast = useLatch(useCart((s) => s.lastAdded !== null));
  const search = useLatch(useUI((s) => s.searchOpen));
  const menu = useLatch(useUI((s) => s.menuOpen));
  const finePointer = useMediaQuery("(hover: hover) and (pointer: fine)");

  useEffect(() => {
    const warm = () => {
      void loadDrawer();
      void loadToast();
      void loadSearch();
      void loadMenu();
    };
    let id: number | ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      id = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(warm, { timeout: 4000 }) : setTimeout(warm, 1500);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (typeof id === "number" && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      else if (id !== undefined) clearTimeout(id);
    };
  }, []);

  return (
    <>
      {drawer && <CartDrawer freeShippingThreshold={freeShippingThreshold} suggestions={suggestions} />}
      {toast && <CartToast />}
      {search && <SearchPalette products={products} />}
      {menu && <MobileMenu phone={phone} whatsapp={whatsapp} />}
      {finePointer && <Cursor />}
    </>
  );
}
