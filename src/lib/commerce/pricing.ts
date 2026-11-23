import type { Coupon, Paise, PaymentMethod, Product, StoreSettings, Variant, ZoneId } from "../data/types";
import { evaluateCoupon, type CouponResult } from "./coupons";
import { quoteShipping, type ShippingQuote } from "./shipping";

export interface CartLineInput {
  variantId: string;
  quantity: number;
}

export interface PricedLine {
  product: Product;
  variant: Variant;
  quantity: number;
  unitPrice: Paise;
  lineTotal: Paise;
}

export interface LineProblem {
  variantId: string;
  name: string;
  reason: "missing" | "inactive" | "out_of_stock" | "insufficient_stock";
  available: number;
}

export const MAX_QTY_PER_LINE = 20;

/** Resolve cart lines against the catalogue (authoritative prices + stock). */
export function priceLines(lines: CartLineInput[], products: Product[]) {
  const byVariant = new Map<string, { product: Product; variant: Variant }>();
  for (const product of products) for (const variant of product.variants) byVariant.set(variant.id, { product, variant });

  const merged = new Map<string, number>();
  for (const l of lines) {
    const qty = Math.floor(Number(l.quantity));
    if (!l.variantId || !Number.isFinite(qty) || qty <= 0) continue;
    merged.set(l.variantId, Math.min(MAX_QTY_PER_LINE, (merged.get(l.variantId) ?? 0) + qty));
  }

  const priced: PricedLine[] = [];
  const problems: LineProblem[] = [];
  for (const [variantId, quantity] of merged) {
    const hit = byVariant.get(variantId);
    if (!hit) {
      problems.push({ variantId, name: "Unavailable item", reason: "missing", available: 0 });
      continue;
    }
    const { product, variant } = hit;
    const name = `${product.name} · ${variant.weightG >= 1000 ? `${variant.weightG / 1000} kg` : `${variant.weightG} g`}`;
    if (!product.isActive || !variant.isActive) {
      problems.push({ variantId, name, reason: "inactive", available: 0 });
      continue;
    }
    if (variant.stock <= 0) {
      problems.push({ variantId, name, reason: "out_of_stock", available: 0 });
      continue;
    }
    if (variant.stock < quantity) {
      problems.push({ variantId, name, reason: "insufficient_stock", available: variant.stock });
      continue;
    }
    priced.push({ product, variant, quantity, unitPrice: variant.price, lineTotal: variant.price * quantity });
  }
  return { priced, problems };
}

export interface Totals {
  subtotal: Paise;
  discount: Paise;
  shippingFee: Paise;
  codFee: Paise;
  total: Paise;
  weightG: number;
  itemsCount: number;
  coupon: CouponResult | null;
  shipping: ShippingQuote | null;
  zone: ZoneId | null;
}

export function computeTotals(params: {
  lines: PricedLine[];
  settings: StoreSettings;
  pincode?: string | null;
  coupon?: { entered: string; record: Coupon | null; usedByCustomer: number } | null;
  paymentMethod?: PaymentMethod;
  now?: Date;
}): Totals {
  const now = params.now ?? new Date();
  const subtotal = params.lines.reduce((s, l) => s + l.lineTotal, 0);
  const weightG = params.lines.reduce((s, l) => s + l.variant.weightG * l.quantity, 0);
  const itemsCount = params.lines.reduce((s, l) => s + l.quantity, 0);

  let couponResult: CouponResult | null = null;
  if (params.coupon && params.coupon.entered.trim()) {
    couponResult = evaluateCoupon(params.coupon.record, { subtotal, now, usedByCustomer: params.coupon.usedByCustomer }, params.coupon.entered);
  }
  const discount = couponResult?.ok ? couponResult.discount : 0;
  const forceFree = Boolean(couponResult?.ok && couponResult.freeShipping);

  const shipping = params.pincode
    ? quoteShipping({ pincode: params.pincode, weightG, eligibleSubtotal: subtotal - discount, settings: params.settings, forceFree })
    : null;
  const shippingFee = subtotal > 0 && shipping ? shipping.fee : 0;
  const codFee = params.paymentMethod === "cod" && subtotal > 0 ? params.settings.codFee : 0;
  const total = Math.max(0, subtotal - discount + shippingFee + codFee);

  return {
    subtotal,
    discount,
    shippingFee,
    codFee,
    total,
    weightG,
    itemsCount,
    coupon: couponResult,
    shipping,
    zone: shipping?.zone ?? null,
  };
}

/** RF-2611-7KQ4M style order numbers (no ambiguous characters). */
export function generateOrderNumber(now = new Date(), random: () => number = Math.random) {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  let suffix = "";
  for (let i = 0; i < 5; i++) suffix += alphabet[Math.floor(random() * alphabet.length)];
  return `RF-${yy}${mm}-${suffix}`;
}
