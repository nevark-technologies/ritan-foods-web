import Link from "next/link";
import type { Order } from "@/lib/data/types";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge } from "./AdminShell";

export function OrdersTable({ orders }: { orders: Order[] }) {
  if (!orders.length) return <p className="mt-6 text-sm text-ink-500">No orders yet.</p>;
  return (
    <div className="-mx-2 mt-4 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
            <th className="px-2 py-2 font-semibold">Order</th>
            <th className="px-2 py-2 font-semibold">Customer</th>
            <th className="px-2 py-2 font-semibold">Date</th>
            <th className="px-2 py-2 font-semibold">Payment</th>
            <th className="px-2 py-2 font-semibold">Status</th>
            <th className="px-2 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-forest-900/5 hover:bg-parchment-100/60">
              <td className="px-2 py-3">
                <Link href={`/admin/orders/${encodeURIComponent(o.orderNumber)}`} className="tabular font-semibold text-forest-800 underline-offset-4 hover:underline">
                  {o.orderNumber}
                </Link>
              </td>
              <td className="px-2 py-3">
                <span className="block">{o.customerName}</span>
                <span className="text-xs text-ink-500">
                  {o.shippingAddress.city}, {o.shippingAddress.pincode}
                </span>
              </td>
              <td className="px-2 py-3 text-ink-700">{formatDate(o.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
              <td className="px-2 py-3">
                <Badge value={o.paymentStatus} label={o.paymentMethod === "cod" ? (o.paymentStatus === "paid" ? "COD · paid" : "COD") : o.paymentStatus} />
              </td>
              <td className="px-2 py-3">
                <Badge value={o.status} />
              </td>
              <td className="tabular px-2 py-3 text-right font-semibold">{formatINR(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
