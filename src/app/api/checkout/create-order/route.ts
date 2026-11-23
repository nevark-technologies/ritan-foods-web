import { revalidateTag } from "next/cache";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { normalizeCode } from "@/lib/commerce/coupons";
import { notifyOrderConfirmed } from "@/lib/commerce/notify";
import { orderToken } from "@/lib/commerce/order-token";
import { computeTotals, generateOrderNumber, priceLines } from "@/lib/commerce/pricing";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/commerce/razorpay";
import { INDIAN_STATES, isValidPincode } from "@/lib/commerce/shipping";
import { isDemoMode, store } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+?91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number.");

const schema = z.object({
  items: z.array(z.object({ variantId: z.string().max(80), quantity: z.coerce.number().int().min(1).max(20) })).min(1, "Your bag is empty.").max(50),
  coupon: z.string().max(40).optional().nullable(),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone,
  address: z.object({
    fullName: z.string().trim().min(2, "Enter the recipient's name.").max(80),
    phone,
    line1: z.string().trim().min(4, "Enter your house / street.").max(120),
    line2: z.string().trim().max(120).optional().nullable(),
    landmark: z.string().trim().max(80).optional().nullable(),
    city: z.string().trim().min(2, "Enter your city.").max(60),
    state: z.enum(INDIAN_STATES, { message: "Choose your state." }),
    pincode: z.string().trim().refine(isValidPincode, "Enter a valid 6-digit PIN code."),
  }),
  paymentMethod: z.enum(["razorpay", "cod"]),
  saveAddress: z.boolean().optional(),
  notes: z.string().trim().max(300).optional().nullable(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`checkout:${ip}`, 12, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts — please wait a few minutes." }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]));
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details.", fieldErrors }, { status: 422 });
  }
  const input = parsed.data;
  // With a real database but no Razorpay keys yet, online payment isn't possible: refuse before creating an order.
  if (input.paymentMethod === "razorpay" && !razorpayConfigured() && !isDemoMode) {
    return NextResponse.json({ error: "Online payment isn't available yet — please choose cash on delivery." }, { status: 400 });
  }
  const user = await getSessionUser();

  const [products, settings] = await Promise.all([store.listProducts(), store.getSettings()]);
  const { priced, problems } = priceLines(input.items, products);
  if (problems.length || !priced.length) return NextResponse.json({ error: "Some items in your bag need attention.", problems }, { status: 409 });

  let couponArg: Parameters<typeof computeTotals>[0]["coupon"] = null;
  if (input.coupon?.trim()) {
    const record = await store.getCoupon(normalizeCode(input.coupon));
    couponArg = { entered: input.coupon, record, usedByCustomer: record ? await store.countRedemptions(record.code, input.email) : 0 };
  }
  const totals = computeTotals({ lines: priced, settings, pincode: input.address.pincode, coupon: couponArg, paymentMethod: input.paymentMethod });
  if (totals.coupon && !totals.coupon.ok) return NextResponse.json({ error: totals.coupon.reason, field: "coupon" }, { status: 422 });
  if (!totals.shipping) return NextResponse.json({ error: "We can't deliver to that PIN code.", fieldErrors: { "address.pincode": "Enter a valid 6-digit PIN code." } }, { status: 422 });
  if (input.paymentMethod === "cod" && (!settings.codEnabled || totals.total > settings.codMaxOrder)) {
    return NextResponse.json({ error: "Cash on delivery isn't available for this order. Please pay online." }, { status: 422 });
  }
  if (input.paymentMethod === "razorpay" && !razorpayConfigured() && !isDemoMode) {
    return NextResponse.json({ error: "Online payments are being set up. Please choose cash on delivery or try again later." }, { status: 503 });
  }

  let orderNumber = generateOrderNumber();
  for (let i = 0; i < 4 && (await store.getOrderByNumber(orderNumber)); i++) orderNumber = generateOrderNumber();

  const order = await store.createOrder({
    orderNumber,
    userId: user?.id ?? null,
    email: input.email,
    phone: input.phone,
    customerName: input.address.fullName,
    shippingAddress: { ...input.address, line2: input.address.line2 || null, landmark: input.address.landmark || null },
    items: priced.map((l) => ({
      productId: l.product.id,
      variantId: l.variant.id,
      productName: l.product.name,
      productSlug: l.product.slug,
      weightG: l.variant.weightG,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
      image: l.product.image,
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    shippingFee: totals.shippingFee,
    codFee: totals.codFee,
    total: totals.total,
    couponCode: totals.coupon?.ok ? totals.coupon.code : null,
    paymentMethod: input.paymentMethod,
    shippingZone: totals.zone,
    notes: input.notes || null,
  });

  if (user && input.saveAddress) {
    await store.saveAddress(user.id, { ...order.shippingAddress, label: "Home" }).catch(() => {});
  }

  const token = orderToken(order.orderNumber);

  if (input.paymentMethod === "cod") {
    const { order: confirmed } = await store.confirmOrder(order.orderNumber, { method: "cod" });
    revalidateTag("catalog", { expire: 0 });
    after(() => notifyOrderConfirmed(confirmed));
    return NextResponse.json({ orderNumber: order.orderNumber, token, confirmed: true });
  }

  if (razorpayConfigured()) {
    try {
      const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.orderNumber, notes: { order_number: order.orderNumber } });
      await store.attachRazorpayOrder(order.orderNumber, rzp.id);
      return NextResponse.json({
        orderNumber: order.orderNumber,
        token,
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: rzp.id,
          amount: rzp.amount,
          currency: "INR",
          prefill: { name: input.address.fullName, email: input.email, contact: input.phone },
        },
      });
    } catch (err) {
      console.error("[checkout] razorpay order failed", err);
      await store.markOrderFailed(order.orderNumber, "Could not create payment order");
      return NextResponse.json({ error: "We couldn't start the payment. Please try again in a moment." }, { status: 502 });
    }
  }

  // Demo mode: simulated gateway (never available when a real database is connected).
  return NextResponse.json({ orderNumber: order.orderNumber, token, demo: true, amount: order.total });
}
