import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toggleProductAction } from "@/app/admin/actions";
import { AdminHeader, Badge, Card } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Products" };

export default async function AdminProducts() {
  await requireAdmin();
  const [products, categories] = await Promise.all([store.listProducts({ includeInactive: true }), store.listCategories()]);
  return (
    <>
      <AdminHeader
        title="Products"
        subtitle={`${products.filter((p) => p.isActive).length} live · ${products.length} total`}
        actions={
          <Link href="/admin/products/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-forest-800 px-5 text-sm font-semibold text-cream-50">
            <Plus className="size-4" /> Add product
          </Link>
        }
      />
      <Card className="overflow-x-auto p-2 sm:p-4">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
              <th className="px-3 py-2 font-semibold">Product</th>
              <th className="px-3 py-2 font-semibold">Category</th>
              <th className="px-3 py-2 font-semibold">Price range</th>
              <th className="px-3 py-2 font-semibold">Stock</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const active = p.variants.filter((v) => v.isActive);
              const prices = active.map((v) => v.price);
              const stock = active.reduce((s, v) => s + v.stock, 0);
              const out = active.filter((v) => v.stock === 0).length;
              return (
                <tr key={p.id} className="border-t border-forest-900/5">
                  <td className="px-3 py-3">
                    <Link href={`/admin/products/${encodeURIComponent(p.id)}`} className="flex items-center gap-3">
                      <span className="grid size-12 place-items-center rounded-xl" style={{ background: p.palette.bg }}>
                        <Image src={p.image} alt="" width={48} height={48} sizes="48px" className="h-10 w-auto object-contain" />
                      </span>
                      <span>
                        <span className="block font-semibold text-forest-900 hover:underline">{p.name}</span>
                        <span className="text-xs text-ink-500">{p.tagline}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-ink-700">{categories.find((c) => c.id === p.categoryId)?.name}</td>
                  <td className="tabular px-3 py-3">{prices.length ? `${formatINR(Math.min(...prices))} – ${formatINR(Math.max(...prices))}` : "—"}</td>
                  <td className="px-3 py-3">
                    <span className="tabular">{stock}</span>
                    {out > 0 && <span className="ml-2 text-xs font-semibold text-chilli-600">{out} size{out > 1 ? "s" : ""} out</span>}
                  </td>
                  <td className="px-3 py-3">
                    <Badge value={p.isActive ? "delivered" : "pending"} label={p.isActive ? "Live" : "Hidden"} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <form action={toggleProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-xs font-semibold text-forest-800 underline underline-offset-4">
                        {p.isActive ? "Hide" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
