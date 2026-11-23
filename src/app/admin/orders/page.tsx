import Link from "next/link";
import { AdminHeader, Card } from "@/components/admin/AdminShell";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import type { OrderStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Orders" };

const TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "To pack" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "pending", label: "Awaiting payment" },
  { id: "cancelled", label: "Cancelled" },
];

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "all") as OrderStatus | "all";
  const q = typeof sp.q === "string" ? sp.q : "";
  const [orders, all] = await Promise.all([store.listOrders({ status, q }), store.listOrders()]);
  const count = (s: OrderStatus | "all") => (s === "all" ? all.length : all.filter((o) => o.status === s).length);

  return (
    <>
      <AdminHeader title="Orders" subtitle={`${all.length} orders in total`} />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/orders${t.id === "all" ? "" : `?status=${t.id}`}`}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold", status === t.id ? "bg-forest-800 text-cream-50" : "bg-cream-50 text-forest-800 hover:bg-parchment-100")}
          >
            {t.label} <span className="tabular opacity-70">{count(t.id)}</span>
          </Link>
        ))}
        <form className="ml-auto" action="/admin/orders">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Search order #, name, email, phone"
            aria-label="Search orders"
            className="h-10 w-72 rounded-full border border-forest-900/15 bg-cream-50 px-4 text-sm outline-none focus:border-forest-700"
          />
        </form>
      </div>
      <Card>
        <OrdersTable orders={orders} />
      </Card>
    </>
  );
}
