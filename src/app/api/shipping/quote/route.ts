import { NextResponse, type NextRequest } from "next/server";
import { quoteShipping } from "@/lib/commerce/shipping";
import { store } from "@/lib/data";

/** GET /api/shipping/quote?pin=600049&weight=500&subtotal=29500 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const pin = (sp.get("pin") ?? "").trim();
  const weight = Math.max(1, Math.min(50000, Number(sp.get("weight")) || 500));
  const subtotal = Math.max(0, Number(sp.get("subtotal")) || 0);
  const settings = await store.getSettings();
  const quote = quoteShipping({ pincode: pin, weightG: weight, eligibleSubtotal: subtotal, settings });
  if (!quote) return NextResponse.json({ error: "Invalid PIN code" }, { status: 422 });
  return NextResponse.json({ quote }, { headers: { "Cache-Control": "private, max-age=300" } });
}
