import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { store } from "@/lib/data";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  authorName: z.string().trim().min(2).max(60),
  title: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => v || null),
  body: z.string().trim().min(10, "Please write at least a sentence.").max(1500),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please sign in to write a review." }, { status: 401 });
  if (!rateLimit(`review:${user.id}`, 5, 24 * 60 * 60 * 1000)) return NextResponse.json({ error: "You've written a lot of reviews today — thank you! Try again tomorrow." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review" }, { status: 422 });

  const products = await store.listProducts({ includeInactive: true });
  if (!products.some((p) => p.id === parsed.data.productId)) return NextResponse.json({ error: "Unknown product" }, { status: 404 });
  const orders = await store.listOrders({ email: user.email });
  const verifiedPurchase = orders.some((o) => !["pending", "failed", "cancelled"].includes(o.status) && o.items.some((i) => i.productId === parsed.data.productId));

  await store.createReview({ ...parsed.data, userId: user.id, verifiedPurchase });
  return NextResponse.json({ ok: true, pendingApproval: true });
}
