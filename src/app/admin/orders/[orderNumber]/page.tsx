import { ExternalLink, Mail, MessageCircle, Phone, Printer } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Badge, Card } from "@/components/admin/AdminShell";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderSummaryCard } from "@/components/orders/OrderSummaryCard";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate, whatsappLink } from "@/lib/utils";

export default async function AdminOrderDetail({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  await requireAdmin();
  const { orderNumber } = await params;
  const order = await store.getOrderByNumber(decodeURIComponent(orderNumber));
  if (!order) notFound();
  const a = order.shippingAddress;

  return (
    <>
      <AdminHeader
        title={order.orderNumber}
        subtitle={`Placed ${formatDate(order.createdAt, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge value={order.status} />
            <Badge value={order.paymentStatus} label={order.paymentMethod === "cod" ? `COD · ${order.paymentStatus}` : order.paymentStatus} />
            <Link href={`/admin/orders/${encodeURIComponent(order.orderNumber)}/invoice`} className="inline-flex h-10 items-center gap-2 rounded-full bg-cream-50 px-4 text-sm font-semibold text-forest-800">
              <Printer className="size-4" /> Invoice
            </Link>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <OrderSummaryCard order={order} />
          <Card>
            <h2 className="font-display text-2xl text-forest-900">Customer</h2>
            <div className="mt-4 grid gap-6 text-sm sm:grid-cols-2">
              <div className="space-y-2">
                <p className="font-semibold">{order.customerName}</p>
                <a href={`mailto:${order.email}`} className="flex items-center gap-2 text-forest-800">
                  <Mail className="size-4" /> {order.email}
                </a>
                <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-forest-800">
                  <Phone className="size-4" /> {order.phone}
                </a>
                <a href={whatsappLink(order.phone.length === 10 ? `91${order.phone}` : order.phone, `Hello ${order.customerName.split(" ")[0]}, this is Ritan Foods about your order ${order.orderNumber}.`)} target="_blank" rel="noopener" className="flex items-center gap-2 text-forest-800">
                  <MessageCircle className="size-4" /> WhatsApp customer <ExternalLink className="size-3" />
                </a>
              </div>
              <div>
                <p className="eyebrow text-ink-500">Ship to</p>
                <p className="mt-2 leading-relaxed">
                  {a.fullName} · {a.phone}
                  <br />
                  {a.line1}
                  {a.line2 && <>, {a.line2}</>}
                  {a.landmark && (
                    <>
                      <br />
                      Landmark: {a.landmark}
                    </>
                  )}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                </p>
              </div>
            </div>
            {order.razorpayPaymentId && <p className="mt-5 text-xs text-ink-500">Razorpay payment {order.razorpayPaymentId} · order {order.razorpayOrderId}</p>}
          </Card>
          <Card>
            <h2 className="font-display text-2xl text-forest-900">Timeline</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {[...order.events].reverse().map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-leaf-500" />
                  <span>
                    <span className="font-semibold capitalize">{e.status}</span>
                    {e.note && <span className="text-ink-700"> - {e.note}</span>}
                    <span className="block text-xs text-ink-500">{formatDate(e.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <Card className="self-start">
          <h2 className="font-display text-2xl text-forest-900">Update</h2>
          <div className="mt-4">
            <OrderStatusForm order={order} />
          </div>
        </Card>
      </div>
    </>
  );
}
