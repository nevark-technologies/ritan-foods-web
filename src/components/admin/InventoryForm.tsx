"use client";

import { submitWith } from "@/lib/use-action-submit";
import Image from "next/image";
import { useActionState, useState } from "react";
import { saveInventoryAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/data/types";
import { cn, formatWeight } from "@/lib/utils";

/** Bulk stock & price editor. Out-of-stock = 0; one click zeroes or restocks a size. */
export function InventoryForm({ products, lowStock }: { products: Product[]; lowStock: number }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveInventoryAction, {});
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [stocks, setStocks] = useState<Record<string, number>>(() => Object.fromEntries(products.flatMap((p) => p.variants.map((v) => [v.id, v.stock]))));

  const rows = products.flatMap((p) =>
    p.variants
      .filter((v) => v.isActive)
      .filter((v) => (filter === "out" ? stocks[v.id] === 0 : filter === "low" ? stocks[v.id] <= lowStock : true))
      .map((v) => ({ p, v })),
  );

  return (
    <form onSubmit={submitWith(action)}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "low", "out"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-full px-4 py-2 text-sm font-semibold", filter === f ? "bg-forest-800 text-cream-50" : "bg-cream-50 text-forest-800")}>
            {f === "all" ? "All sizes" : f === "low" ? `Low (≤ ${lowStock})` : "Out of stock"}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          {state.message && <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save inventory"}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-forest-900/10 bg-cream-50 p-2 sm:p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
              <th className="px-3 py-2 font-semibold">Product</th>
              <th className="px-3 py-2 font-semibold">Size</th>
              <th className="px-3 py-2 font-semibold">SKU</th>
              <th className="px-3 py-2 font-semibold">Price ₹</th>
              <th className="px-3 py-2 font-semibold">Stock</th>
              <th className="px-3 py-2 font-semibold">Availability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, v }) => {
              const s = stocks[v.id] ?? 0;
              return (
                <tr key={v.id} className="border-t border-forest-900/5">
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-lg" style={{ background: p.palette.bg }}>
                        <Image src={p.image} alt="" width={40} height={40} sizes="40px" className="h-8 w-auto object-contain" />
                      </span>
                      {p.name}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-semibold">{formatWeight(v.weightG)}</td>
                  <td className="px-3 py-2.5 text-xs text-ink-500">{v.sku}</td>
                  <td className="px-3 py-2.5">
                    <input name={`price:${v.id}`} defaultValue={v.price / 100} inputMode="decimal" aria-label={`${p.name} ${formatWeight(v.weightG)} price`} className="h-9 w-24 rounded-xl border border-forest-900/15 bg-cream-50 px-3 text-sm" />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      name={`stock:${v.id}`}
                      value={s}
                      onChange={(e) => setStocks((m) => ({ ...m, [v.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                      inputMode="numeric"
                      aria-label={`${p.name} ${formatWeight(v.weightG)} stock`}
                      className="h-9 w-20 rounded-xl border border-forest-900/15 bg-cream-50 px-3 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", s === 0 ? "bg-chilli-600/15 text-chilli-600" : s <= lowStock ? "bg-turmeric-500/20 text-clay-600" : "bg-sprout-100 text-forest-800")}>
                        {s === 0 ? "Out of stock" : s <= lowStock ? "Low" : "In stock"}
                      </span>
                      <button type="button" onClick={() => setStocks((m) => ({ ...m, [v.id]: s === 0 ? 25 : 0 }))} className="text-xs font-semibold text-forest-800 underline underline-offset-4">
                        {s === 0 ? "Restock 25" : "Mark out"}
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-500">Nothing here — nice.</p>}
      </div>
    </form>
  );
}
