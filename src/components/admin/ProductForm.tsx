"use client";

import { submitWith } from "@/lib/use-action-submit";
import { ImageUp } from "lucide-react";
import Image from "next/image";
import { useActionState, useState, type ChangeEvent } from "react";
import { saveProductAction, uploadProductImageAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { Category, Product } from "@/lib/data/types";
import { formatWeight } from "@/lib/utils";

const WEIGHTS = [100, 200, 300, 500, 1000];
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Category select value for "add a new category" (handled in saveProductAction). */
const NEW_CATEGORY = "__new";

export interface PackImage {
  src: string;
  width: number;
  height: number;
}

const imageLabel = (src: string) => (src.startsWith("data:") ? "Uploaded image" : decodeURIComponent(src.split("/").pop() ?? src));

export function ProductForm({ product, categories, images }: { product?: Product; categories: Category[]; images: PackImage[] }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveProductAction, {});
  const [options, setOptions] = useState(images);
  const [image, setImage] = useState<PackImage | undefined>(product ? { src: product.image, width: product.imageWidth, height: product.imageHeight } : images[0]);
  const [upload, setUpload] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});
  const [bg, setBg] = useState(product?.palette.bg ?? "#F1E4C3");
  const [category, setCategory] = useState(product?.categoryId ?? categories[0]?.id ?? NEW_CATEGORY);
  // After a save that created a category, select it (the refreshed list now includes it).
  const [savedState, setSavedState] = useState(state);
  if (state !== savedState) {
    setSavedState(state);
    if (state.ok && state.categoryId) setCategory(state.categoryId);
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    const name = (input.form?.elements.namedItem("name") as HTMLInputElement | null)?.value ?? product?.name ?? "";
    input.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) return setUpload({ error: "That image is over 4 MB - export it smaller (WebP works well)." });
    setUpload({ busy: true });
    let width: number, height: number;
    try {
      const bitmap = await createImageBitmap(file);
      ({ width, height } = bitmap);
      bitmap.close();
    } catch {
      return setUpload({ error: "That file isn't an image this browser can open - try a PNG, WebP or JPG." });
    }
    const fd = new FormData();
    fd.set("file", file);
    fd.set("width", String(width));
    fd.set("height", String(height));
    fd.set("name", name);
    try {
      const res = await uploadProductImageAction(fd);
      if (!res.url || !res.width || !res.height) return setUpload({ error: res.error ?? "The upload didn't go through - try again." });
      const added = { src: res.url, width: res.width, height: res.height };
      setOptions((list) => [added, ...list.filter((o) => o.src !== added.src)]);
      setImage(added);
      setUpload({ done: true });
    } catch {
      setUpload({ error: "The upload didn't go through - check the connection and try again." });
    }
  }
  const v = (w: number) => product?.variants.find((x) => x.weightG === w);

  return (
    <form
      onSubmit={(e) => {
        setUpload({});
        submitWith(action)(e);
      }}
      className="grid gap-6 xl:grid-cols-[1fr_22rem]"
    >
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
              <Select id="pf-cat" name="categoryId" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>+ New category…</option>
              </Select>
            </Field>
            {category === NEW_CATEGORY && (
              <>
                <Field label="New category name" htmlFor="pf-newcat" hint="Shown in the shop filters, e.g. Sweets">
                  <Input id="pf-newcat" name="newCategoryName" required minLength={2} maxLength={40} autoFocus />
                </Field>
                <Field label="Category description" htmlFor="pf-newcat-blurb" optional>
                  <Input id="pf-newcat-blurb" name="newCategoryBlurb" maxLength={160} />
                </Field>
              </>
            )}
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
            {image && <Image src={image.src} alt="" width={image.width} height={image.height} sizes="240px" className="h-56 w-auto object-contain drop-shadow-lg" />}
          </div>
          <input type="hidden" name="image" value={image?.src ?? ""} />
          <input type="hidden" name="imageWidth" value={image?.width ?? ""} />
          <input type="hidden" name="imageHeight" value={image?.height ?? ""} />
          <Field label="Pack image" htmlFor="pf-image" className="mt-4">
            <Select id="pf-image" value={image?.src ?? ""} onChange={(e) => setImage(options.find((o) => o.src === e.target.value))}>
              {options.map((o) => (
                <option key={o.src} value={o.src}>
                  {imageLabel(o.src)}
                </option>
              ))}
            </Select>
          </Field>
          <label
            className={`mt-3 flex items-center justify-center gap-2 rounded-full border border-forest-900/15 px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-leaf-500 ${upload.busy ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-forest-900/5"}`}
          >
            <ImageUp className="size-4" aria-hidden />
            {upload.busy ? "Uploading…" : "Upload new image"}
            <input type="file" accept="image/png,image/webp,image/jpeg,image/avif" className="sr-only" onChange={onPickFile} disabled={upload.busy} />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">PNG or WebP with a transparent background looks best, up to 4 MB.</p>
          {upload.error && (
            <p className="mt-2 text-sm font-semibold text-chilli-600" role="alert">
              {upload.error}
            </p>
          )}
          {upload.done && (
            <p className="mt-2 text-sm font-semibold text-leaf-600" role="status">
              Uploaded - press {product ? "Save changes" : "Create product"} to put it on the shop.
            </p>
          )}
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
