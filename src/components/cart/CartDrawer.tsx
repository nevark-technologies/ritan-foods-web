"use client";

import { ArrowRight, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useHydrated } from "@/components/layout/StoreHydrator";
import { ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { ProductLite } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { cartCount, cartSubtotal, useCart, type CartItem } from "@/lib/store/cart";
import { formatINR, formatWeight } from "@/lib/utils";
import { FreeShippingMeter } from "./FreeShippingMeter";
import { QtyStepper } from "./QtyStepper";

function Line({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 80, transition: { duration: 0.25 } }}
      transition={spring.soft}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* swipe-to-remove backdrop */}
      <div className="absolute inset-0 flex items-center justify-end rounded-2xl bg-chilli-600 pr-6 text-cream-50" aria-hidden>
        <Trash2 className="size-5" />
      </div>
      <m.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.25, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90) remove(item.variantId);
        }}
        className="relative flex gap-4 bg-cream-50 p-3"
      >
        <Link href={`/products/${item.slug}`} className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: item.palette.bg }}>
          <Image src={item.image} alt="" width={96} height={96} sizes="96px" className="h-20 w-auto object-contain drop-shadow-md" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/products/${item.slug}`} className="block truncate font-display text-lg leading-tight text-forest-900">
                {item.name}
              </Link>
              <p className="text-sm text-ink-500">{formatWeight(item.weightG)}</p>
            </div>
            <button type="button" onClick={() => remove(item.variantId)} className="grid size-8 place-items-center rounded-full text-ink-500 hover:bg-forest-900/5 hover:text-chilli-600" aria-label={`Remove ${item.name}`}>
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
            <QtyStepper size="sm" value={item.quantity} max={Math.min(20, item.maxQty)} allowZero onChange={(v) => setQty(item.variantId, v)} />
            <span className="tabular font-semibold text-forest-900">{formatINR(item.price * item.quantity)}</span>
          </div>
        </div>
      </m.div>
    </m.li>
  );
}

export function CartDrawer({ freeShippingThreshold, suggestions }: { freeShippingThreshold: number; suggestions: ProductLite[] }) {
  const open = useCart((s) => s.drawerOpen);
  const close = useCart((s) => s.closeDrawer);
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const list = hydrated ? items : [];
  const subtotal = cartSubtotal(list);
  const count = cartCount(list);

  return (
    <Sheet open={open} onClose={close} side="right" label="Your bag">
      <div className="flex items-center justify-between border-b border-forest-900/10 px-6 py-5">
        <h2 className="font-display text-2xl text-forest-900">
          Your bag <span className="tabular text-base text-ink-500">({count})</span>
        </h2>
        <button type="button" onClick={close} className="grid size-11 place-items-center rounded-full hover:bg-forest-900/5" aria-label="Close bag">
          <X className="size-5" />
        </button>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-1 flex-col px-6 py-8">
          <div className="grid place-items-center py-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-sprout-100 text-forest-700">
              <ShoppingBag className="size-7" />
            </span>
            <p className="mt-4 font-display text-2xl text-forest-900">Your bag is empty</p>
            <p className="mt-1 text-ink-500">Start with a family favourite.</p>
          </div>
          <ul className="mt-4 space-y-3">
            {suggestions.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.slug}`} onClick={close} className="flex items-center gap-4 rounded-2xl p-2 hover:bg-sprout-100">
                  <span className="grid size-16 place-items-center rounded-xl" style={{ background: p.palette.bg }}>
                    <Image src={p.image} alt="" width={64} height={64} sizes="64px" className="h-14 w-auto object-contain" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-lg text-forest-900">{p.name}</span>
                    <span className="text-sm text-ink-500">from {formatINR(p.fromPrice)}</span>
                  </span>
                  <Plus className="size-4 text-forest-700" />
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/shop" onClick={close} variant="outline" className="mt-8 w-full">
            Browse the pantry
          </ButtonLink>
        </div>
      ) : (
        <>
          <div className="px-6 pt-5">
            <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
          </div>
          <ul className="flex-1 space-y-3 px-3 py-4">
            <AnimatePresence initial={false}>
              {list.map((item) => (
                <Line key={item.variantId} item={item} />
              ))}
            </AnimatePresence>
          </ul>
          <div className="sticky bottom-0 border-t border-forest-900/10 bg-cream-50/95 px-6 py-5 backdrop-blur">
            <div className="flex items-baseline justify-between">
              <span className="text-ink-500">Subtotal</span>
              <span className="tabular font-display text-2xl text-forest-900">{formatINR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500">Shipping and coupons are calculated at checkout. Prices include taxes.</p>
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
              <ButtonLink href="/cart" onClick={close} variant="outline">
                View bag
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={close}>
                Checkout <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>
        </>
      )}
    </Sheet>
  );
}
