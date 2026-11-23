"use client";

import { Heart } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useHydrated } from "@/components/layout/StoreHydrator";
import { spring } from "@/lib/motion/tokens";
import { useWishlist } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";

/** Heart toggle with a springy pop and a ring burst when saved. */
export function WishlistButton({ productId, name, className }: { productId: string; name: string; className?: string }) {
  const hydrated = useHydrated();
  const on = useWishlist((s) => s.ids.includes(productId)) && hydrated;
  const toggle = useWishlist((s) => s.toggle);
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.82 }}
      transition={spring.squash}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={cn("relative grid size-10 place-items-center rounded-full bg-cream-50/90 text-forest-800 shadow-sm backdrop-blur", className)}
    >
      <m.span key={String(on)} initial={{ scale: on ? 0.4 : 1 }} animate={{ scale: 1 }} transition={spring.bouncy}>
        <Heart className={cn("size-[1.05rem] transition-colors", on && "fill-chilli-500 text-chilli-500")} />
      </m.span>
      <AnimatePresence>
        {on && (
          <m.span
            key="ring"
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-chilli-500"
            initial={{ scale: 0.6, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </m.button>
  );
}
