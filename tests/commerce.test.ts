import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildSeedCoupons, buildSeedProducts, defaultSettings, placeholderPrice } from "@/lib/data/catalog";
import { evaluateCoupon, normalizeCode } from "@/lib/commerce/coupons";
import { computeTotals, generateOrderNumber, priceLines } from "@/lib/commerce/pricing";
import { isValidPincode, quoteShipping, slabFee, zoneForPincode } from "@/lib/commerce/shipping";
import { verifyPaymentSignature, verifyWebhookSignature } from "@/lib/commerce/razorpay";

const products = buildSeedProducts();
const coupons = Object.fromEntries(buildSeedCoupons().map((c) => [c.code, c]));
const now = new Date("2026-11-22T10:00:00Z");

describe("pincode zones", () => {
  it("validates Indian PIN codes", () => {
    expect(isValidPincode("600049")).toBe(true);
    expect(isValidPincode("060049")).toBe(false);
    expect(isValidPincode("900001")).toBe(false);
    expect(isValidPincode("60004")).toBe(false);
  });

  it.each([
    ["600049", "chennai"],
    ["603103", "chennai"],
    ["641001", "tamil-nadu"],
    ["605001", "tamil-nadu"],
    ["560001", "south"],
    ["682001", "south"],
    ["500001", "south"],
    ["682551", "remote"],
    ["110001", "national"],
    ["400001", "national"],
    ["781001", "remote"],
    ["190001", "remote"],
    ["744101", "remote"],
  ])("%s → %s", (pin, zone) => {
    expect(zoneForPincode(pin)).toBe(zone);
  });
});

describe("shipping", () => {
  it("charges per 500 g slab", () => {
    expect(slabFee(100, 4000, 1500)).toBe(4000);
    expect(slabFee(500, 4000, 1500)).toBe(4000);
    expect(slabFee(501, 4000, 1500)).toBe(5500);
    expect(slabFee(1600, 4000, 1500)).toBe(8500);
  });

  it("is free above the threshold", () => {
    const q = quoteShipping({ pincode: "110001", weightG: 600, eligibleSubtotal: 99900, settings: defaultSettings });
    expect(q?.free).toBe(true);
    expect(q?.fee).toBe(0);
  });

  it("reports how much is left for free shipping", () => {
    const q = quoteShipping({ pincode: "110001", weightG: 600, eligibleSubtotal: 50000, settings: defaultSettings });
    expect(q?.fee).toBe(9000 + 3500);
    expect(q?.remainingForFree).toBe(49900);
  });

  it("returns null for invalid PIN codes", () => {
    expect(quoteShipping({ pincode: "12", weightG: 100, eligibleSubtotal: 0, settings: defaultSettings })).toBeNull();
  });
});

describe("coupons", () => {
  it("normalises codes", () => {
    expect(normalizeCode(" welcome 10 ")).toBe("WELCOME10");
  });

  it("caps percentage discounts", () => {
    const r = evaluateCoupon(coupons.WELCOME10, { subtotal: 300000, now, usedByCustomer: 0 });
    expect(r).toMatchObject({ ok: true, discount: 15000 });
  });

  it("applies percentage under the cap", () => {
    const r = evaluateCoupon(coupons.WELCOME10, { subtotal: 60000, now, usedByCustomer: 0 });
    expect(r).toMatchObject({ ok: true, discount: 6000 });
  });

  it("enforces minimum subtotal", () => {
    const r = evaluateCoupon(coupons.TRADITION100, { subtotal: 50000, now, usedByCustomer: 0 });
    expect(r.ok).toBe(false);
  });

  it("enforces per-customer limits", () => {
    const r = evaluateCoupon(coupons.WELCOME10, { subtotal: 60000, now, usedByCustomer: 1 });
    expect(r.ok).toBe(false);
  });

  it("rejects expired and inactive codes", () => {
    expect(evaluateCoupon({ ...coupons.TRADITION100, endsAt: "2026-01-01T00:00:00Z" }, { subtotal: 200000, now, usedByCustomer: 0 }).ok).toBe(false);
    expect(evaluateCoupon({ ...coupons.TRADITION100, isActive: false }, { subtotal: 200000, now, usedByCustomer: 0 }).ok).toBe(false);
    expect(evaluateCoupon(null, { subtotal: 200000, now, usedByCustomer: 0 }, "nope").ok).toBe(false);
  });

  it("free-shipping codes carry no discount", () => {
    const r = evaluateCoupon(coupons.FREESHIP, { subtotal: 60000, now, usedByCustomer: 0 });
    expect(r).toMatchObject({ ok: true, discount: 0, freeShipping: true });
  });
});

describe("pricing", () => {
  it("rounds placeholder prices to ₹5", () => {
    expect(placeholderPrice(70, 100)).toBe(7000);
    expect(placeholderPrice(70, 200)).toBe(13500);
    expect(placeholderPrice(70, 1000) % 500).toBe(0);
  });

  it("prices lines from the catalogue and merges duplicates", () => {
    const { priced, problems } = priceLines(
      [
        { variantId: "v-idli-podi-200", quantity: 1 },
        { variantId: "v-idli-podi-200", quantity: 2 },
      ],
      products,
    );
    expect(problems).toHaveLength(0);
    expect(priced[0].quantity).toBe(3);
    expect(priced[0].lineTotal).toBe(priced[0].unitPrice * 3);
  });

  it("flags out-of-stock, short stock and unknown variants", () => {
    const { priced, problems } = priceLines(
      [
        { variantId: "v-abc-malt-1000", quantity: 1 },
        { variantId: "v-moringa-rice-mix-300", quantity: 5 },
        { variantId: "v-nope", quantity: 1 },
      ],
      products,
    );
    expect(priced).toHaveLength(0);
    expect(problems.map((p) => p.reason).sort()).toEqual(["insufficient_stock", "missing", "out_of_stock"]);
  });

  it("computes totals with coupon, shipping and COD fee", () => {
    const { priced } = priceLines([{ variantId: "v-idli-podi-500", quantity: 2 }], products);
    const totals = computeTotals({
      lines: priced,
      settings: defaultSettings,
      pincode: "560001",
      coupon: { entered: "welcome10", record: coupons.WELCOME10, usedByCustomer: 0 },
      paymentMethod: "cod",
      now,
    });
    expect(totals.subtotal).toBe(priced[0].lineTotal);
    expect(totals.discount).toBeGreaterThan(0);
    expect(totals.weightG).toBe(1000);
    expect(totals.zone).toBe("south");
    expect(totals.codFee).toBe(defaultSettings.codFee);
    expect(totals.total).toBe(totals.subtotal - totals.discount + totals.shippingFee + totals.codFee);
  });

  it("generates readable order numbers", () => {
    expect(generateOrderNumber(now)).toMatch(/^RF-2611-[2-9A-HJKMNP-Z]{5}$/);
  });
});

describe("razorpay signatures", () => {
  const secret = "test_secret";
  it("verifies checkout signatures", () => {
    const signature = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature, secret })).toBe(true);
    expect(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_2", signature, secret })).toBe(false);
  });

  it("verifies webhook signatures", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyWebhookSignature(body, signature, "whsec")).toBe(true);
    expect(verifyWebhookSignature(body + " ", signature, "whsec")).toBe(false);
    expect(verifyWebhookSignature(body, null, "whsec")).toBe(false);
  });
});
