"use client";

import { Check, Tag, X } from "lucide-react";
import { useRef, useState } from "react";
import type { CouponResult } from "@/lib/commerce/coupons";
import { useCart } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

/** Coupon entry: applies to the cart store; the server quote decides validity. Shakes when rejected. */
export function CouponField({ result }: { result: CouponResult | null | undefined }) {
  const code = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [value, setValue] = useState(code ?? "");
  const [shake, setShake] = useState(0);
  const [prevResult, setPrevResult] = useState(result);
  const formRef = useRef<HTMLFormElement>(null);

  // Re-trigger the shake whenever the server rejects a (new) result.
  if (result !== prevResult) {
    setPrevResult(result);
    if (result && !result.ok) setShake((n) => n + 1);
  }

  if (code && result?.ok) {
    return (
      <div className="flex items-center justify-between rounded-2xl bg-sprout-100 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-semibold text-forest-800">
          <Check className="size-4 text-leaf-500" /> {result.code} · {result.message}
        </span>
        <button
          type="button"
          onClick={() => {
            setCoupon(null);
            setValue("");
          }}
          className="grid size-7 place-items-center rounded-full hover:bg-forest-900/10"
          aria-label="Remove coupon"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      key={shake}
      onSubmit={(e) => {
        e.preventDefault();
        setCoupon(value.trim() ? value.trim().toUpperCase() : null);
      }}
      className={cn(shake > 0 && "shake")}
    >
      <label htmlFor="coupon" className="sr-only">
        Coupon code
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
          <input
            id="coupon"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            autoComplete="off"
            aria-invalid={Boolean(code && result && !result.ok)}
            aria-describedby="coupon-msg"
            className="h-12 w-full rounded-full border border-forest-900/15 bg-cream-50 pl-11 pr-4 text-sm font-semibold uppercase tracking-[0.12em] outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-forest-700"
          />
        </div>
        <button type="submit" className="h-12 rounded-full bg-forest-800 px-5 text-sm font-semibold text-cream-50">
          Apply
        </button>
      </div>
      <p id="coupon-msg" className="mt-2 min-h-5 text-xs font-semibold text-chilli-600" aria-live="polite">
        {code && result && !result.ok ? result.reason : ""}
      </p>
    </form>
  );
}
