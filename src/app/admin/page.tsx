import { AlertTriangle, ArrowRight, IndianRupee, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { AdminHeader, Badge, Card } from "@/components/admin/AdminShell";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { RevenueChart, type DayPoint } from "@/components/admin/RevenueChart";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate, formatINR, formatWeight } from "@/lib/utils";

const COUNTED = new Set(["confirmed", "packed", "shipped", "delivered"]);
const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default async function AdminOverview() {
  await requireAdmin();
  const [orders, products, settings, reviews, messages] = await Promise.all([
    store.listOrders(),
    store.listProducts({ includeInactive: true }),
    store.getSettings(),
    store.listReviews({ approvedOnly: false }),
    store.listContactMessages(),
  ]);
  const now = new Date();
  const counted = orders.filter((o) => COUNTED.has(o.status));
  const sumSince = (days: number) => counted.filter((o) => now.getTime() - new Date(o.createdAt).getTime() < days * 86400000).reduce((s, o) => s + o.total, 0);
  const today = dayKey(now.toISOString());
  const todayOrders = counted.filter((o) => dayKey(o.createdAt) === today);
  const toShip = orders.filter((o) => o.status === "confirmed" || o.status === "packed");
  const lowStock = products.flatMap((p) => p.variants.filter((v) => v.isActive && v.stock <= settings.lowStockThreshold).map((v) => ({ p, v })));
  const pendingReviews = reviews.filter((r) => !r.isApproved).length;

  const series: DayPoint[] = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(now.getTime() - (13 - k) * 86400000);
    const key = dayKey(d.toISOString());
    const dayOrders = counted.filter((o) => dayKey(o.createdAt) === key);
    return {
      date: key,
      label: d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" }),
      long: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    };
  });

  const kpis = [
    { label: "Revenue today", value: formatINR(todayOrders.reduce((s, o) => s + o.total, 0)), sub: `${todayOrders.length} orders`, icon: IndianRupee },
    { label: "Last 7 days", value: formatINR(sumSince(7)), sub: `30 days: ${formatINR(sumSince(30))}`, icon: ShoppingBag },
    { label: "To pack & ship", value: String(toShip.length), sub: "confirmed or packed", icon: Truck, href: "/admin/orders?status=confirmed" },
    { label: "Low stock", value: String(lowStock.length), sub: `pack sizes at ≤ ${settings.lowStockThreshold}`, icon: AlertTriangle, href: "/admin/inventory", warn: lowStock.length > 0 },
  ];

  return (
    <>
      <AdminHeader title="Overview" subtitle={formatDate(now.toISOString(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <Card className="h-full">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-500">{k.label}</p>
                <span className={`grid size-9 place-items-center rounded-full ${k.warn ? "bg-turmeric-500/20 text-clay-600" : "bg-sprout-100 text-forest-700"}`}>
                  <k.icon className="size-4" />
                </span>
              </div>
              <p className="tabular mt-4 font-display text-4xl text-forest-900">{k.value}</p>
              <p className="mt-1 text-xs text-ink-500">{k.sub}</p>
            </Card>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="block transition-transform hover:-translate-y-0.5">
              {body}
            </Link>
          ) : (
            <div key={k.label}>{body}</div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <h2 className="font-display text-2xl text-forest-900">Revenue, last 14 days</h2>
          <p className="text-xs text-ink-500">Confirmed orders, including shipping. Hover or tab through the bars for details.</p>
          <div className="mt-4">
            <RevenueChart data={series} />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-forest-900">Low stock</h2>
            <Link href="/admin/inventory" className="text-xs font-semibold text-forest-800">
              Inventory →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-500">
              <PackageCheck className="size-4 text-leaf-500" /> Everything is well stocked.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-forest-900/5">
              {lowStock.slice(0, 8).map(({ p, v }) => (
                <li key={v.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>
                    {p.name} <span className="text-ink-500">· {formatWeight(v.weightG)}</span>
                  </span>
                  <Badge value={v.stock === 0 ? "cancelled" : "confirmed"} label={v.stock === 0 ? "Out of stock" : `${v.stock} left`} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Link href="/admin/reviews" className="rounded-2xl bg-parchment-100 p-4">
              <span className="tabular block font-display text-2xl text-forest-900">{pendingReviews}</span>
              <span className="text-ink-500">reviews to moderate</span>
            </Link>
            <Link href="/admin/messages" className="rounded-2xl bg-parchment-100 p-4">
              <span className="tabular block font-display text-2xl text-forest-900">{messages.length}</span>
              <span className="text-ink-500">contact messages</span>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest-900">Recent orders</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800">
            All orders <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <OrdersTable orders={orders.slice(0, 8)} />
      </Card>
    </>
  );
}
