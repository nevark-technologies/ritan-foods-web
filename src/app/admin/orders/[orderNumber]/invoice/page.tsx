import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/PrintButton";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate, formatINR, formatWeight } from "@/lib/utils";

export const metadata = { title: "Invoice" };

/** Printable order invoice (prices inclusive of GST). */
export default async function InvoicePage({ params }: PageProps<"/admin/orders/[orderNumber]/invoice">) {
  await requireAdmin();
  const { orderNumber } = await params;
  const [order, settings] = await Promise.all([store.getOrderByNumber(decodeURIComponent(orderNumber)), store.getSettings()]);
  if (!order) notFound();
  const a = order.shippingAddress;
  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 text-sm text-ink-900 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <div className="no-print mb-6 flex justify-end">
        <PrintButton />
      </div>
      <div className="flex items-start justify-between gap-6 border-b border-forest-900/15 pb-6">
        <div>
          <p className="font-display text-3xl text-forest-900">Ritan Foods</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-700">{settings.contact.address}</p>
          <p className="mt-1 text-xs text-ink-700">
            GSTIN {settings.contact.gstin} · {settings.contact.phone} · {settings.contact.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-500">Invoice</p>
          <p className="tabular mt-1 font-semibold">{order.orderNumber}</p>
          <p className="text-xs text-ink-500">{formatDate(order.paidAt ?? order.createdAt)}</p>
        </div>
      </div>
      <div className="grid gap-6 py-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-500">Bill & ship to</p>
          <p className="mt-2 leading-relaxed">
            {a.fullName}
            <br />
            {a.line1}
            {a.line2 && <>, {a.line2}</>}
            <br />
            {a.city}, {a.state} {a.pincode}
            <br />
            {a.phone} · {order.email}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink-500">Payment</p>
          <p className="mt-2">{order.paymentMethod === "cod" ? "Cash on delivery" : `Online (Razorpay)${order.razorpayPaymentId ? ` · ${order.razorpayPaymentId}` : ""}`}</p>
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-y border-forest-900/15 text-xs uppercase tracking-[0.12em] text-ink-500">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 font-semibold">Pack</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            <th className="py-2 text-right font-semibold">Rate</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.id} className="border-b border-forest-900/5">
              <td className="py-2.5">{it.productName}</td>
              <td className="py-2.5">{formatWeight(it.weightG)}</td>
              <td className="tabular py-2.5 text-right">{it.quantity}</td>
              <td className="tabular py-2.5 text-right">{formatINR(it.unitPrice, true)}</td>
              <td className="tabular py-2.5 text-right">{formatINR(it.lineTotal, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-64 space-y-1.5">
        <div className="flex justify-between">
          <dt className="text-ink-500">Subtotal</dt>
          <dd className="tabular">{formatINR(order.subtotal, true)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-500">Discount</dt>
            <dd className="tabular">−{formatINR(order.discount, true)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-500">Shipping</dt>
          <dd className="tabular">{formatINR(order.shippingFee, true)}</dd>
        </div>
        {order.codFee > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-500">COD fee</dt>
            <dd className="tabular">{formatINR(order.codFee, true)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-forest-900/15 pt-2 font-bold">
          <dt>Total</dt>
          <dd className="tabular">{formatINR(order.total, true)}</dd>
        </div>
      </dl>
      <p className="mt-10 text-xs text-ink-500">All prices are inclusive of applicable GST. Thank you for choosing Ritan Foods — made with tradition, shared with love.</p>
    </div>
  );
}
