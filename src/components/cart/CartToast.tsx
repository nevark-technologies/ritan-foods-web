"use client";

import { Check } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { spring } from "@/lib/motion/tokens";
import { useCart } from "@/lib/store/cart";

/** "Added to bag" confirmation that springs up from the bottom edge. */
export function CartToast() {
  const lastAdded = useCart((s) => s.lastAdded);
  const openDrawer = useCart((s) => s.openDrawer);
  const [dismissedAt, setDismissedAt] = useState(0);
  const visibleAt = lastAdded && lastAdded.at !== dismissedAt ? lastAdded.at : null;

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => setDismissedAt(lastAdded.at), 3200);
    return () => clearTimeout(t);
  }, [lastAdded]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {visibleAt && lastAdded && (
          <m.div
            key={visibleAt}
            initial={{ y: 90, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={spring.bouncy}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-forest-900 py-2 pl-2 pr-2 text-cream-50 shadow-2xl"
          >
            <span className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-cream-50">
              <Image src={lastAdded.image} alt="" width={44} height={44} sizes="44px" className="h-9 w-auto object-contain" />
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Check className="size-4 text-sprout-300" /> Added <span className="max-w-[10rem] truncate font-normal text-cream-50/80">{lastAdded.name}</span>
            </span>
            <button type="button" onClick={openDrawer} className="rounded-full bg-cream-50 px-4 py-2 text-sm font-bold text-forest-900">
              View bag
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
