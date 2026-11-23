import { revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { notifyOrderConfirmed } from "@/lib/commerce/notify";
import { orderToken } from "@/lib/commerce/order-token";
import { verifyPaymentSignature } from "@/lib/commerce/razorpay";
import { isDemoMode, store } from "@/lib/data";

const schema = z.union([
  z.object({
    orderNumber: z.string().max(40),
    razorpay_order_id: z.string().max(80),
    razorpay_payment_id: z.string().max(80),
    razorpay_signature: z.string().max(200),
  }),
  z.object({ orderNumber: z.string().max(40), demo: z.literal(true), outcome: z.enum(["success", "failure"]) }),
]);

/** Confirms a payment from the Razorpay checkout handler (or the demo gateway). Idempotent. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment response" }, { status: 422 });
  const body = parsed.data;
  const order = await store.getOrderByNumber(body.orderNumber);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let paymentId: string;
  if ("demo" in body) {
    if (!isDemoMode) return NextResponse.json({ error: "Demo payments are disabled" }, { status: 403 });
    if (body.outcome === "failure") {
      await store.markOrderFailed(order.orderNumber, "Demo payment declined");
      return NextResponse.json({ error: "Payment was declined. No money was taken — please try again." }, { status: 402 });
    }
    paymentId = `pay_demo_${order.orderNumber.slice(-5)}`;
  } else {
    const valid =
      order.razorpayOrderId === body.razorpay_order_id &&
      verifyPaymentSignature({ orderId: body.razorpay_order_id, paymentId: body.razorpay_payment_id, signature: body.razorpay_signature });
    if (!valid) return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted, contact us with your order number." }, { status: 400 });
    paymentId = body.razorpay_payment_id;
  }

  const { order: confirmed, alreadyConfirmed } = await store.confirmOrder(order.orderNumber, { razorpayPaymentId: paymentId, method: "razorpay" });
  if (!alreadyConfirmed) {
    revalidateTag("catalog", { expire: 0 });
    after(() => notifyOrderConfirmed(confirmed));
  }
  return NextResponse.json({ ok: true, orderNumber: confirmed.orderNumber, token: orderToken(confirmed.orderNumber) });
}
