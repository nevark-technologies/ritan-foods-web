import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay Orders API + signature checks, via fetch (no SDK needed).
 * Docs: https://razorpay.com/docs/payments/server-integration/nodejs/
 */

export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createRazorpayOrder(params: { amount: number; receipt: string; notes?: Record<string, string> }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new Error("Razorpay is not configured");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount: params.amount, currency: "INR", receipt: params.receipt, notes: params.notes ?? {} }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(params: { orderId: string; paymentId: string; signature: string; secret?: string }) {
  const secret = params.secret ?? process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !params.signature) return false;
  const expected = createHmac("sha256", secret).update(`${params.orderId}|${params.paymentId}`).digest("hex");
  return safeEqualHex(expected, params.signature);
}

/** Webhook signature: HMAC_SHA256(raw_body, webhook_secret) in X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody: string, signature: string | null, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
