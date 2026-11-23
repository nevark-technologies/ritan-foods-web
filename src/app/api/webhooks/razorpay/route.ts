import { revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";
import { notifyOrderConfirmed } from "@/lib/commerce/notify";
import { verifyWebhookSignature } from "@/lib/commerce/razorpay";
import { store } from "@/lib/data";

/**
 * Razorpay webhook (backup path if the browser closes before /verify runs).
 * Configure in Dashboard > Webhooks with events: payment.captured, order.paid, payment.failed.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; error_description?: string } }; order?: { entity?: { id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const rzpOrderId = payment?.order_id ?? event.payload?.order?.entity?.id;
  if (!rzpOrderId) return NextResponse.json({ ok: true, ignored: true });
  const order = await store.getOrderByRazorpayOrderId(rzpOrderId);
  if (!order) return NextResponse.json({ ok: true, unknownOrder: true });

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const { order: confirmed, alreadyConfirmed } = await store.confirmOrder(order.orderNumber, { razorpayPaymentId: payment?.id ?? null, method: "razorpay" });
    if (!alreadyConfirmed) {
      revalidateTag("catalog", { expire: 0 });
      after(() => notifyOrderConfirmed(confirmed));
    }
  } else if (event.event === "payment.failed") {
    await store.markOrderFailed(order.orderNumber, payment?.error_description ?? "Payment failed");
  }
  return NextResponse.json({ ok: true });
}
