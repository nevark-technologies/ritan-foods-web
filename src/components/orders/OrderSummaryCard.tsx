import Image from "next/image";
import type { Order } from "@/lib/data/types";
import { formatINR, formatWeight } from "@/lib/utils";

/** Items, totals, address and payment for an order (server component). */
export function OrderSummaryCard({ order, showAddress = true }: { order: Order; showAddress?: boolean }) {
  const a = order.shippingAddress;
  return (
    <div className="select-text rounded-[2rem] bg-parchment-100 p-6 sm:p-8">
      <ul className="divide-y divide-forest-900/10">
        {order.items.map((it) => (
          <li key={it.id} className="flex items-center gap-4 py-3 first:pt-0">
            {it.image && (
              <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-cream-50">
                <Image src={it.image} alt="" width={56} height={56} sizes="56px" className="h-12 w-auto object-contain" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-forest-900">{it.productName}</span>
              <span className="text-sm text-ink-500">
                {formatWeight(it.weightG)} × {it.quantity}
              </span>
            </span>
            <span className="tabular text-sm font-semibold">{formatINR(it.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-forest-900/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Subtotal</dt>
          <dd className="tabular">{formatINR(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-leaf-500">
            <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
            <dd className="tabular">−{formatINR(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-500">Shipping</dt>
          <dd className="tabular">{order.shippingFee ? formatINR(order.shippingFee) : "Free"}</dd>
        </div>
        {order.codFee > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-500">COD fee</dt>
            <dd className="tabular">{formatINR(order.codFee)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between pt-2">
          <dt className="font-semibold text-forest-900">Total</dt>
          <dd className="tabular font-display text-2xl text-forest-900">{formatINR(order.total)}</dd>
        </div>
      </dl>
      <div className="mt-6 grid gap-6 border-t border-forest-900/10 pt-6 text-sm sm:grid-cols-2">
        {showAddress && (
          <div>
            <p className="eyebrow text-ink-500">Delivering to</p>
            <p className="mt-2 leading-relaxed text-ink-700">
              {a.fullName}
              <br />
              {a.line1}
              {a.line2 && (
                <>
                  <br />
                  {a.line2}
                </>
              )}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
          </div>
        )}
        <div>
          <p className="eyebrow text-ink-500">Payment</p>
          <p className="mt-2 text-ink-700">{order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online · Razorpay"}</p>
        </div>
      </div>
    </div>
  );
}
