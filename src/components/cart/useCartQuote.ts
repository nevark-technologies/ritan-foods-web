"use client";

import { useEffect, useState } from "react";
import type { LineProblem, Totals } from "@/lib/commerce/pricing";
import type { PaymentMethod } from "@/lib/data/types";
import type { CartItem } from "@/lib/store/cart";

export interface QuoteLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  weightG: number;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
}

export interface CartQuote {
  lines: QuoteLine[];
  problems: LineProblem[];
  totals: Totals;
  freeShippingThreshold: number;
  cod: { enabled: boolean; fee: number; maxOrder: number };
}

/** Debounced server quote for the current cart (prices, stock, coupon, shipping). */
export function useCartQuote(params: { items: CartItem[]; coupon: string | null; pincode: string | null; email?: string | null; paymentMethod?: PaymentMethod; enabled?: boolean }) {
  const [result, setResult] = useState<{ key: string; quote: CartQuote | null } | null>(null);
  const key = JSON.stringify({
    items: params.items.map((i) => [i.variantId, i.quantity]),
    coupon: params.coupon,
    pincode: params.pincode,
    email: params.email,
    paymentMethod: params.paymentMethod,
  });
  const hasItems = params.items.length > 0;
  const enabled = params.enabled !== false;

  useEffect(() => {
    if (!enabled || !hasItems) return;
    let cancelled = false;
    const payload = JSON.parse(key) as { items: [string, number][]; coupon: string | null; pincode: string | null; email?: string | null; paymentMethod?: PaymentMethod };
    const t = setTimeout(async () => {
      const res = await fetch("/api/cart/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payload.items.map(([variantId, quantity]) => ({ variantId, quantity })),
          coupon: payload.coupon,
          pincode: payload.pincode && /^[1-8]\d{5}$/.test(payload.pincode) ? payload.pincode : null,
          email: payload.email,
          paymentMethod: payload.paymentMethod,
        }),
      }).catch(() => null);
      const quote = res?.ok ? ((await res.json()) as CartQuote) : null;
      if (!cancelled) setResult({ key, quote });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key, enabled, hasItems]);

  // Keep showing the previous quote while a fresh one loads.
  const quote = hasItems ? (result?.quote ?? null) : null;
  const loading = enabled && hasItems && result?.key !== key;
  return { quote, loading };
}
