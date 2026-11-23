import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Unguessable token that lets a guest view their own order confirmation page.
 * The dev fallback is public (the repo is), so production refuses to run without AUTH_SECRET.
 */
function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be set");
  return s || "ritan-dev-only-secret";
}

export function orderToken(orderNumber: string) {
  return createHmac("sha256", secret()).update(`order:${orderNumber}`).digest("hex").slice(0, 24);
}

export function verifyOrderToken(orderNumber: string, token: string | null | undefined) {
  if (!token) return false;
  const expected = orderToken(orderNumber);
  return expected.length === token.length && timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
