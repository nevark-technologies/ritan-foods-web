import { deleteCouponAction } from "@/app/admin/actions";
import { AdminHeader, Badge, Card } from "@/components/admin/AdminShell";
import { CouponForm } from "@/components/admin/CouponForm";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons({ searchParams }: PageProps<"/admin/coupons">) {
  await requireAdmin();
  const sp = await searchParams;
  const coupons = await store.listCoupons();
  const editing = typeof sp.edit === "string" ? coupons.find((c) => c.code === sp.edit) : undefined;
  return (
    <>
      <AdminHeader title="Coupons" subtitle="Discount codes customers can apply in the bag or at checkout" />
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <Card className="overflow-x-auto p-2 sm:p-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
                <th className="px-3 py-2 font-semibold">Code</th>
                <th className="px-3 py-2 font-semibold">Offer</th>
                <th className="px-3 py-2 font-semibold">Min order</th>
                <th className="px-3 py-2 font-semibold">Used</th>
                <th className="px-3 py-2 font-semibold">Valid</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code} className="border-t border-forest-900/5">
                  <td className="px-3 py-3 font-semibold tracking-[0.08em] text-forest-900">{c.code}</td>
                  <td className="px-3 py-3">
                    {c.type === "percent" ? `${c.value}% off${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ""}` : c.type === "flat" ? `${formatINR(c.value)} off` : "Free shipping"}
                  </td>
                  <td className="tabular px-3 py-3">{formatINR(c.minSubtotal)}</td>
                  <td className="tabular px-3 py-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-3 py-3 text-xs text-ink-500">{c.endsAt ? `until ${formatDate(c.endsAt)}` : "No expiry"}</td>
                  <td className="px-3 py-3">
                    <Badge value={c.isActive ? "delivered" : "pending"} label={c.isActive ? "Active" : "Off"} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-semibold">
                    <a href={`/admin/coupons?edit=${c.code}`} className="mr-3 text-forest-800 underline underline-offset-4">
                      Edit
                    </a>
                    <form action={deleteCouponAction} className="inline">
                      <input type="hidden" name="code" value={c.code} />
                      <button type="submit" className="text-chilli-600 underline underline-offset-4">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="self-start">
          <h2 className="font-display text-2xl text-forest-900">{editing ? `Edit ${editing.code}` : "New coupon"}</h2>
          <div className="mt-5">
            <CouponForm key={editing?.code ?? "new"} coupon={editing} />
          </div>
        </Card>
      </div>
    </>
  );
}
