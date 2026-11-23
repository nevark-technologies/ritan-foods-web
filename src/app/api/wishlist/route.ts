import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { store } from "@/lib/data";

/** Signed-in customers: GET returns saved ids, POST replaces them. Guests keep theirs locally. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ids: [] });
  return NextResponse.json({ ids: await store.getWishlist(user.id) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return new NextResponse(null, { status: 204 });
  const parsed = z.object({ ids: z.array(z.string().max(80)).max(100) }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid wishlist" }, { status: 422 });
  await store.setWishlist(user.id, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
