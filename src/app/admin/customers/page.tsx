import { AdminHeader, Badge, Card } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Customers" };

export default async function AdminCustomers() {
  await requireAdmin();
  const customers = await store.listCustomers();
  return (
    <>
      <AdminHeader title="Customers" subtitle={`${customers.length} customers · ${customers.filter((c) => c.isRegistered).length} with accounts`} />
      <Card className="overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
              <th className="px-3 py-2 font-semibold">Customer</th>
              <th className="px-3 py-2 font-semibold">Phone</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Orders</th>
              <th className="px-3 py-2 font-semibold">Last order</th>
              <th className="px-3 py-2 text-right font-semibold">Total spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.key} className="border-t border-forest-900/5">
                <td className="px-3 py-3">
                  <span className="block font-semibold text-forest-900">{c.name}</span>
                  <a href={`mailto:${c.email}`} className="text-xs text-ink-500 hover:underline">
                    {c.email}
                  </a>
                </td>
                <td className="px-3 py-3 text-ink-700">{c.phone ?? "-"}</td>
                <td className="px-3 py-3">
                  <Badge value={c.isRegistered ? "shipped" : "pending"} label={c.isRegistered ? "Account" : "Guest"} />
                </td>
                <td className="tabular px-3 py-3">{c.ordersCount}</td>
                <td className="px-3 py-3 text-ink-700">{c.lastOrderAt ? formatDate(c.lastOrderAt) : "-"}</td>
                <td className="tabular px-3 py-3 text-right font-semibold">{formatINR(c.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-500">No customers yet.</p>}
      </Card>
    </>
  );
}
