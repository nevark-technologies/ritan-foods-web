"use client";

import { Check, MapPin, ShoppingBag, Truck, Zap } from "lucide-react";
import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { defaultVariant, useAddToCart } from "@/components/cart/useAddToCart";
import { Magnetic } from "@/components/motion/Magnetic";
import type { Product } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { useCart } from "@/lib/store/cart";
import { cn, formatINR, formatWeight } from "@/lib/utils";
import { WishlistButton } from "./WishlistButton";

interface Quote {
  zoneLabel: string;
  eta: string;
  fee: number;
  free: boolean;
  remainingForFree: number;
}

export function BuyBox({ product, lowStock }: { product: Product; lowStock: number }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const setPincode = useCart((s) => s.setPincode);
  const savedPin = useCart((s) => s.pincode);
  const variants = product.variants.filter((v) => v.isActive).sort((a, b) => a.weightG - b.weightG);
  const [variantId, setVariantId] = useState(() => (defaultVariant(variants) ?? variants[0])?.id);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const [qty, setQty] = useState(1);
  const [pin, setPin] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!variant) return null;
  const soldOut = variant.stock <= 0;
  const maxQty = Math.max(1, Math.min(20, variant.stock));

  const add = () => {
    const img = document.querySelector<HTMLImageElement>(`[data-pdp-pack] img`);
    addToCart(product, variant, qty, img);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const checkPin = async (value: string) => {
    setQuoteError(null);
    if (!/^[1-8]\d{5}$/.test(value)) {
      setQuote(null);
      setQuoteError("Enter a valid 6-digit PIN code.");
      return;
    }
    const res = await fetch(`/api/shipping/quote?pin=${value}&weight=${variant.weightG * qty}&subtotal=${variant.price * qty}`).catch(() => null);
    const data = res && res.ok ? await res.json() : null;
    if (!data?.quote) {
      setQuote(null);
      setQuoteError("We couldn't check that PIN code. Please try again.");
      return;
    }
    setQuote(data.quote);
    setPincode(value);
  };

  return (
    <div>
      {/* Pack size */}
      <fieldset>
        <legend className="flex w-full items-baseline justify-between text-sm font-semibold text-forest-900">
          Pack size <span className="font-normal text-ink-500">{formatWeight(variant.weightG)}</span>
        </legend>
        <LayoutGroup id="variants">
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Pack size">
            {variants.map((v) => {
              const on = v.id === variant.id;
              const out = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                    setQuote(null);
                  }}
                  className={cn(
                    "relative h-12 min-w-[4.5rem] rounded-full border px-4 text-sm font-semibold transition-colors",
                    on ? "border-transparent text-cream-50" : "border-forest-900/15 text-forest-800 hover:border-forest-700",
                    out && !on && "text-ink-500 line-through decoration-1",
                  )}
                >
                  {on && <m.span layoutId="variant-pill" className="absolute inset-0 rounded-full bg-forest-800" transition={spring.snappy} />}
                  <span className="relative">{formatWeight(v.weightG)}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </fieldset>

      {/* Price */}
      <div className="mt-7 flex items-end justify-between gap-4">
        <div>
          <div className="relative h-12 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <m.p key={variant.price} initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={spring.snappy} className="tabular font-display text-[2.6rem] leading-[3rem] text-forest-900">
                {formatINR(variant.price)}
              </m.p>
            </AnimatePresence>
          </div>
          <p className="mt-1 text-xs text-ink-500">
            {variant.mrp && variant.mrp > variant.price && <span className="mr-2 line-through">{formatINR(variant.mrp)}</span>}
            Inclusive of all taxes · {formatINR(Math.round(variant.price / (variant.weightG / 100)))} / 100 g
          </p>
        </div>
        <p className={cn("rounded-full px-3 py-1.5 text-xs font-bold", soldOut ? "bg-chilli-600/10 text-chilli-600" : variant.stock <= lowStock ? "bg-turmeric-500/15 text-clay-600" : "bg-sprout-100 text-forest-700")} aria-live="polite">
          {soldOut ? "Out of stock" : variant.stock <= lowStock ? `Only ${variant.stock} left` : "In stock"}
        </p>
      </div>

      {/* Quantity + add */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} onChange={setQty} max={maxQty} />
        <Magnetic className="min-w-0 flex-1" strength={0.18} innerStrength={0.1}>
          <m.button
            ref={buttonRef}
            type="button"
            disabled={soldOut}
            onClick={add}
            whileTap={{ scaleX: 1.06, scaleY: 0.9 }}
            transition={spring.squash}
            className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-forest-700 px-4 font-semibold text-cream-50 sm:px-8 shadow-[0_14px_30px_-14px_rgba(15,42,23,0.7)] disabled:bg-ink-300"
          >
            <span aria-hidden className="absolute left-1/2 top-full aspect-square w-[160%] -translate-x-1/2 rounded-full bg-leaf-500 transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-[55%]" />
            <AnimatePresence mode="wait" initial={false}>
              <m.span key={added ? "added" : soldOut ? "sold" : "add"} data-magnetic-inner className="relative flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.2 }}>
                {added ? (
                  <>
                    <Check className="size-5 shrink-0 max-[419px]:hidden" aria-hidden /> Added to bag
                  </>
                ) : soldOut ? (
                  "Sold out"
                ) : (
                  <>
                    <ShoppingBag className="size-5 shrink-0 max-[419px]:hidden" aria-hidden /> Add to bag
                    {/* The price is already shown large above; keep the button to one line on phones */}
                    <span className="hidden sm:inline">· {formatINR(variant.price * qty)}</span>
                  </>
                )}
              </m.span>
            </AnimatePresence>
          </m.button>
        </Magnetic>
        <WishlistButton productId={product.id} name={product.name} className="size-14 border border-forest-900/15 bg-cream-50" />
      </div>
      {!soldOut && (
        <button
          type="button"
          onClick={() => {
            add();
            router.push("/checkout");
          }}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-forest-900/15 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-700"
        >
          <Zap className="size-4" /> Buy it now
        </button>
      )}

      {/* Delivery estimate */}
      <form
        className="mt-8 rounded-3xl border border-forest-900/10 bg-parchment-100/70 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void checkPin(pin.trim());
        }}
      >
        <label htmlFor="pdp-pin" className="flex items-center gap-2 text-sm font-semibold text-forest-900">
          <MapPin className="size-4 text-leaf-500" /> Check delivery to your PIN code
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="pdp-pin"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder={savedPin ?? "600049"}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="h-11 min-w-0 flex-1 rounded-full border border-forest-900/15 bg-cream-50 px-4 text-sm tracking-[0.2em] outline-none focus:border-forest-700"
            aria-describedby="pdp-pin-result"
          />
          <button type="submit" className="h-11 rounded-full bg-forest-800 px-5 text-sm font-semibold text-cream-50">
            Check
          </button>
        </div>
        <div id="pdp-pin-result" aria-live="polite" className="mt-3 text-sm">
          {quoteError && <p className="text-chilli-600">{quoteError}</p>}
          {quote && (
            <p className="flex items-start gap-2 text-ink-700">
              <Truck className="mt-0.5 size-4 shrink-0 text-leaf-500" />
              <span>
                Delivers to <strong>{quote.zoneLabel}</strong> in <strong>{quote.eta}</strong> ·{" "}
                {quote.free ? <strong className="text-leaf-500">Free shipping</strong> : <>{formatINR(quote.fee)} shipping</>}
                {!quote.free && quote.remainingForFree > 0 && <span className="text-ink-500"> (free above {formatINR(quote.remainingForFree + variant.price * qty)})</span>}
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
