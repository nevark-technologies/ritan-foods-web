import type { Coupon, Paise } from "../data/types";

export interface CouponContext {
  subtotal: Paise;
  now: Date;
  /** Times this customer (email) has already redeemed the code */
  usedByCustomer: number;
}

export type CouponResult =
  | { ok: true; code: string; discount: Paise; freeShipping: boolean; message: string }
  | { ok: false; code: string; reason: string };

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

const rupees = (p: Paise) => `₹${Math.round(p / 100).toLocaleString("en-IN")}`;

export function evaluateCoupon(coupon: Coupon | null | undefined, ctx: CouponContext, enteredCode = coupon?.code ?? ""): CouponResult {
  const code = normalizeCode(enteredCode);
  if (!coupon) return { ok: false, code, reason: "That code doesn't exist." };
  if (!coupon.isActive) return { ok: false, code, reason: "This code is no longer active." };
  if (coupon.startsAt && ctx.now < new Date(coupon.startsAt)) return { ok: false, code, reason: "This code isn't active yet." };
  if (coupon.endsAt && ctx.now > new Date(coupon.endsAt)) return { ok: false, code, reason: "This code has expired." };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return { ok: false, code, reason: "This code has reached its usage limit." };
  if (coupon.perCustomerLimit !== null && ctx.usedByCustomer >= coupon.perCustomerLimit)
    return { ok: false, code, reason: "You've already used this code." };
  if (ctx.subtotal < coupon.minSubtotal)
    return { ok: false, code, reason: `Add ${rupees(coupon.minSubtotal - ctx.subtotal)} more to use this code.` };

  if (coupon.type === "free_shipping") {
    return { ok: true, code: coupon.code, discount: 0, freeShipping: true, message: "Free shipping applied" };
  }

  let discount = coupon.type === "percent" ? Math.floor((ctx.subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, ctx.subtotal);
  // Round down to whole rupees so totals stay clean.
  discount = Math.floor(discount / 100) * 100;
  return {
    ok: true,
    code: coupon.code,
    discount,
    freeShipping: false,
    message: `${rupees(discount)} off applied`,
  };
}
