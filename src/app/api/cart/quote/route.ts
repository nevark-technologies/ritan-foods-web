import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeCode } from "@/lib/commerce/coupons";
import { computeTotals, priceLines } from "@/lib/commerce/pricing";
import { store } from "@/lib/data";

const schema = z.object({
  items: z.array(z.object({ variantId: z.string().max(80), quantity: z.coerce.number().int().min(1).max(20) })).max(50),
  coupon: z.string().max(40).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  email: z.string().max(120).optional().nullable(),
  paymentMethod: z.enum(["razorpay", "cod"]).optional(),
});

/** Server-authoritative cart pricing used by the cart page and checkout summary. */
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 422 });
  const { items, coupon, pincode, email, paymentMethod } = parsed.data;

  const [products, settings] = await Promise.all([store.listProducts(), store.getSettings()]);
  const { priced, problems } = priceLines(items, products);

  let couponArg: Parameters<typeof computeTotals>[0]["coupon"] = null;
  if (coupon?.trim()) {
    const record = await store.getCoupon(normalizeCode(coupon));
    const used = record && email ? await store.countRedemptions(record.code, email) : 0;
    couponArg = { entered: coupon, record, usedByCustomer: used };
  }
  const totals = computeTotals({ lines: priced, settings, pincode: pincode || null, coupon: couponArg, paymentMethod });

  return NextResponse.json({
    lines: priced.map((l) => ({
      variantId: l.variant.id,
      productId: l.product.id,
      slug: l.product.slug,
      name: l.product.name,
      weightG: l.variant.weightG,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
      stock: l.variant.stock,
    })),
    problems,
    totals,
    freeShippingThreshold: settings.freeShippingThreshold,
    cod: { enabled: settings.codEnabled && totals.total <= settings.codMaxOrder, fee: settings.codFee, maxOrder: settings.codMaxOrder },
  });
}
