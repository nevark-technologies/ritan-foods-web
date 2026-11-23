"use client";

import { AlertTriangle, ArrowRight, MapPin, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useHydrated } from "@/components/layout/StoreHydrator";
import { ButtonLink } from "@/components/ui/Button";
import type { ProductLite } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { cartSubtotal, useCart } from "@/lib/store/cart";
import { formatINR, formatWeight } from "@/lib/utils";
import { CouponField } from "./CouponField";
import { FreeShippingMeter } from "./FreeShippingMeter";
import { QtyStepper } from "./QtyStepper";
import { SummaryRows } from "./SummaryRows";
import { useCartQuote } from "./useCartQuote";

export function CartView({ suggestions }: { suggestions: ProductLite[] }) {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const coupon = useCart((s) => s.couponCode);
  const pincode = useCart((s) => s.pincode);
  const setPincode = useCart((s) => s.setPincode);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const [pin, setPin] = useState(pincode ?? "");
  const list = hydrated ? items : [];
  const { quote, loading } = useCartQuote({ items: list, coupon, pincode, enabled: hydrated });

  if (!hydrated) return <div className="skeleton h-96 rounded-[2rem]" />;

  if (!list.length) {
    return (
      <div className="rounded-[2rem] bg-parchment-100 px-6 py-20 text-center">
        <ShoppingBag className="mx-auto size-10 text-forest-700" />
        <p className="mt-5 font-display text-4xl text-forest-900">Your bag is empty</p>
        <p className="mt-2 text-ink-500">Every good meal starts somewhere — try a family favourite.</p>
        <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          {suggestions.slice(0, 3).map((p) => (
            <li key={p.id}>
              <Link href={`/products/${p.slug}`} className="group block rounded-[1.5rem] p-4 transition-transform duration-500 hover:-translate-y-1" style={{ background: p.palette.bg }}>
                <Image src={p.image} alt="" width={200} height={260} sizes="200px" className="mx-auto h-40 w-auto object-contain drop-shadow-lg" />
                <span className="mt-3 block font-display text-xl text-forest-900">{p.name}</span>
                <span className="text-sm text-ink-500">from {formatINR(p.fromPrice)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ButtonLink href="/shop" size="lg" className="mt-10">
          Shop the pantry <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    );
  }

  const problems = quote?.problems ?? [];

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_26rem] lg:gap-16">
      <div>
        <FreeShippingMeter subtotal={cartSubtotal(list)} threshold={quote?.freeShippingThreshold ?? 99900} />
        {problems.length > 0 && (
          <div className="mt-5 rounded-2xl border border-turmeric-500/40 bg-turmeric-500/10 p-4 text-sm" role="alert">
            {problems.map((p) => (
              <p key={p.variantId} className="flex items-start gap-2 text-clay-600">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>{p.name}</strong> — {p.reason === "insufficient_stock" ? `only ${p.available} left.` : p.reason === "out_of_stock" ? "sold out." : "no longer available."}{" "}
                  <button
                    type="button"
                    className="font-semibold underline underline-offset-2"
                    onClick={() => (p.reason === "insufficient_stock" ? setQty(p.variantId, p.available) : remove(p.variantId))}
                  >
                    {p.reason === "insufficient_stock" ? `Set to ${p.available}` : "Remove"}
                  </button>
                </span>
              </p>
            ))}
          </div>
        )}
        <ul className="mt-6 divide-y divide-forest-900/10 border-y border-forest-900/10">
          <AnimatePresence initial={false}>
            {list.map((item) => (
              <m.li
                key={item.variantId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }}
                transition={spring.soft}
                className="flex gap-5 py-6"
              >
                <Link href={`/products/${item.slug}`} className="grid size-28 shrink-0 place-items-center rounded-2xl sm:size-32" style={{ background: item.palette.bg }}>
                  <Image src={item.image} alt="" width={128} height={128} sizes="128px" className="h-24 w-auto object-contain drop-shadow-md sm:h-28" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/products/${item.slug}`} className="font-display text-2xl leading-tight text-forest-900 hover:underline hover:decoration-1 hover:underline-offset-4">
                        {item.name}
                      </Link>
                      <p className="text-sm text-ink-500">
                        {formatWeight(item.weightG)} · {formatINR(item.price)} each
                      </p>
                    </div>
                    <button type="button" onClick={() => remove(item.variantId)} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-forest-900/5 hover:text-chilli-600" aria-label={`Remove ${item.name}`}>
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QtyStepper value={item.quantity} max={Math.min(20, item.maxQty)} allowZero onChange={(v) => setQty(item.variantId, v)} />
                    <span className="tabular font-display text-2xl text-forest-900">{formatINR(item.price * item.quantity)}</span>
                  </div>
                </div>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
        <Link href="/shop" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest-800">
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[2rem] bg-parchment-100 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest-900">Order summary</h2>
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              setPincode(/^[1-8]\d{5}$/.test(pin) ? pin : null);
            }}
          >
            <label htmlFor="cart-pin" className="flex items-center gap-2 text-sm font-semibold text-forest-900">
              <MapPin className="size-4 text-leaf-500" /> Delivery PIN code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="cart-pin"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                onBlur={() => /^[1-8]\d{5}$/.test(pin) && setPincode(pin)}
                placeholder="e.g. 600049"
                autoComplete="postal-code"
                className="h-12 min-w-0 flex-1 rounded-full border border-forest-900/15 bg-cream-50 px-4 text-sm tracking-[0.2em] outline-none focus:border-forest-700"
              />
              <button type="submit" className="h-12 rounded-full border border-forest-900/15 px-5 text-sm font-semibold text-forest-800 hover:border-forest-700">
                Update
              </button>
            </div>
          </form>
          <div className="mt-5">
            <CouponField result={quote?.totals.coupon} />
          </div>
          <div className="mt-4">
            <SummaryRows totals={quote?.totals ?? null} loading={loading} pincodeKnown={Boolean(pincode)} />
          </div>
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full" aria-disabled={problems.length > 0}>
            Checkout securely <ArrowRight className="size-4" />
          </ButtonLink>
          <p className="mt-3 text-center text-xs text-ink-500">UPI · Cards · Netbanking · Wallets{quote?.cod.enabled ? " · Cash on delivery" : ""}</p>
        </div>
      </aside>
    </div>
  );
}
