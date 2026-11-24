"use client";

import { submitWith } from "@/lib/use-action-submit";
import Image from "next/image";
import { useActionState, useState } from "react";
import { saveProductAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { Category, Product } from "@/lib/data/types";
import { formatWeight } from "@/lib/utils";

const WEIGHTS = [100, 200, 300, 500, 1000];

export function ProductForm({ product, categories, images }: { product?: Product; categories: Category[]; images: string[] }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveProductAction, {});
  const [image, setImage] = useState(product?.image ?? images[0] ?? "");
  const [bg, setBg] = useState(product?.palette.bg ?? "#F1E4C3");
  const v = (w: number) => product?.variants.find((x) => x.weightG === w);

  return (
    <form onSubmit={submitWith(action)} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="space-y-6">
        <section className="rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
          <h2 className="font-display text-2xl text-forest-900">Details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="pf-name">
              <Input id="pf-name" name="name" defaultValue={product?.name} required />
            </Field>
            <Field label="Also known as" htmlFor="pf-alt" optional>
              <Input id="pf-alt" name="altName" defaultValue={product?.altName ?? ""} />
            </Field>
            <Field label="Tagline" htmlFor="pf-tagline">
              <Input id="pf-tagline" name="tagline" defaultValue={product?.tagline} required />
            </Field>
            <Field label="Category" htmlFor="pf-cat">
              <Select id="pf-cat" name="categoryId" defaultValue={product?.categoryId ?? "podis"}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            {!product && (
              <Field label="URL slug" htmlFor="pf-slug" optional hint="Leave empty to generate from the name">
                <Input id="pf-slug" name="slug" />
              </Field>
            )}
            <Field label="Pack type" htmlFor="pf-pack">
              <Select id="pf-pack" name="packType" defaultValue={product?.packType ?? "pouch"}>
                <option value="pouch">Pouch</option>
                <option value="jar">Jar</option>
                <option value="box">Box</option>
              </Select>
            </Field>
            <Field label="Short summary" htmlFor="pf-summary" className="sm:col-span-2">
              <Textarea id="pf-summary" name="summary" defaultValue={product?.summary} className="min-h-20" required />
            </Field>
            <Field label="Story / description" htmlFor="pf-desc" className="sm:col-span-2">
              <Textarea id="pf-desc" name="description" defaultValue={product?.description} required />
            </Field>
            <Field label="Key ingredients" htmlFor="pf-key" hint="Comma separated - shown as chips" className="sm:col-span-2">
              <Input id="pf-key" name="keyIngredients" defaultValue={product?.keyIngredients.join(", ")} />
            </Field>
            <Field label="Full ingredient list" htmlFor="pf-ingr" optional hint="As printed on the pack. Hidden on the site when empty." className="sm:col-span-2">
              <Textarea id="pf-ingr" name="ingredients" defaultValue={product?.ingredients ?? ""} className="min-h-20" />
            </Field>
            <Field label="How to enjoy" htmlFor="pf-use" className="sm:col-span-2">
              <Textarea id="pf-use" name="howToUse" defaultValue={product?.howToUse} className="min-h-20" required />
            </Field>
          </div>
        </section>

        <section className="rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
          <h2 className="font-display text-2xl text-forest-900">Pack sizes, prices & stock</h2>
          <p className="mt-1 text-sm text-ink-500">Prices in ₹, inclusive of GST. Untick a size to hide it from the shop.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
                  <th className="py-2 pr-3 font-semibold">Size</th>
                  <th className="py-2 pr-3 font-semibold">On sale</th>
                  <th className="py-2 pr-3 font-semibold">Price ₹</th>
                  <th className="py-2 pr-3 font-semibold">MRP ₹</th>
                  <th className="py-2 pr-3 font-semibold">Stock</th>
                  <th className="py-2 font-semibold">SKU</th>
                </tr>
              </thead>
              <tbody>
                {WEIGHTS.map((w) => {
                  const variant = v(w);
                  return (
                    <tr key={w} className="border-t border-forest-900/5">
                      <td className="py-2 pr-3 font-semibold">{formatWeight(w)}</td>
                      <td className="py-2 pr-3">
                        <input type="checkbox" name={`v:${w}:enabled`} defaultChecked={variant ? variant.isActive : !product} className="size-4 accent-forest-700" aria-label={`Sell ${formatWeight(w)}`} />
                      </td>
                      <td className="py-2 pr-3">
                        <Input name={`v:${w}:price`} defaultValue={variant ? variant.price / 100 : ""} inputMode="decimal" className="h-10 w-28" aria-label={`${formatWeight(w)} price`} />
                      </td>
                      <td className="py-2 pr-3">
                        <Input name={`v:${w}:mrp`} defaultValue={variant?.mrp ? variant.mrp / 100 : ""} inputMode="decimal" className="h-10 w-28" aria-label={`${formatWeight(w)} MRP`} />
                      </td>
                      <td className="py-2 pr-3">
                        <Input name={`v:${w}:stock`} defaultValue={variant?.stock ?? 0} inputMode="numeric" className="h-10 w-24" aria-label={`${formatWeight(w)} stock`} />
                      </td>
                      <td className="py-2">
                        <Input name={`v:${w}:sku`} defaultValue={variant?.sku ?? ""} className="h-10 w-36" aria-label={`${formatWeight(w)} SKU`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
          <h2 className="font-display text-2xl text-forest-900">Image & colours</h2>
          <div className="mt-4 grid place-items-center rounded-2xl p-4" style={{ background: bg }}>
            {image && <Image src={image} alt="" width={240} height={320} sizes="240px" className="h-56 w-auto object-contain drop-shadow-lg" />}
          </div>
          <Field label="Pack image" htmlFor="pf-image" className="mt-4" hint="Transparent PNG/WebP in /images/products (Supabase uploads when connected)">
            <Select id="pf-image" name="image" value={image} onChange={(e) => setImage(e.target.value)}>
              {images.map((src) => (
                <option key={src} value={src}>
                  {src.split("/").pop()}
                </option>
              ))}
            </Select>
          </Field>
          <input type="hidden" name="scene" value={product?.scene ?? ""} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                ["bg", "Background", bg],
                ["ink", "Text", product?.palette.ink ?? "#1E2A1F"],
                ["accent", "Accent", product?.palette.accent ?? "#C8641E"],
                ["deep", "Deep", product?.palette.deep ?? "#1E4D2B"],
              ] as const
            ).map(([key, label, value]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="color" name={key} defaultValue={value} onChange={key === "bg" ? (e) => setBg(e.target.value) : undefined} className="size-9 cursor-pointer rounded-lg border border-forest-900/15" />
                {label}
              </label>
            ))}
          </div>
        </section>
        <section className="space-y-4 rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} className="size-4 accent-forest-700" /> Live on the shop
          </label>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="size-4 accent-forest-700" /> Featured
          </label>
          <Field label="Sort order" htmlFor="pf-sort">
            <Input id="pf-sort" name="sort" defaultValue={product?.sort ?? 50} inputMode="numeric" />
          </Field>
          {state.error && <p className="text-sm font-semibold text-chilli-600" role="alert">{state.error}</p>}
          {state.message && <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </Button>
        </section>
      </aside>
    </form>
  );
}
