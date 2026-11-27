"use client";

import { submitWith } from "@/lib/use-action-submit";
import { ImageUp, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useState, type ChangeEvent } from "react";
import { saveProductAction, uploadProductImageAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { Category, Product, ProductPhoto } from "@/lib/data/types";
import { shrinkImage } from "@/lib/shrink-image";
import { formatWeight } from "@/lib/utils";

const WEIGHTS = [100, 200, 300, 500, 1000];
/** Largest file the picker takes; it is shrunk in the browser before upload. */
const MAX_PICK_BYTES = 25 * 1024 * 1024;
/** Upload limit after shrinking (keep in step with uploadProductImageAction). */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Category select value for "add a new category" (handled in saveProductAction). */
const NEW_CATEGORY = "__new";
const ACCEPT = "image/png,image/webp,image/jpeg,image/avif";

export type PackImage = ProductPhoto;

interface UploadStatus {
  busy?: boolean;
  error?: string;
  /** confirmation shown under the image */
  note?: string;
  /** the photo just deleted, so it can be put back */
  removed?: ProductPhoto;
}

const imageLabel = (src: string) => (src.startsWith("data:") ? "Uploaded image" : decodeURIComponent(src.split("/").pop() ?? src));

/** Shrinks the file in the browser, then uploads it. */
async function uploadImage(file: File, folder: "packs" | "photos", name: string): Promise<{ image?: ProductPhoto; error?: string }> {
  if (file.size > MAX_PICK_BYTES) return { error: "That file is over 25 MB - pick a smaller photo." };
  let shrunk;
  try {
    shrunk = await shrinkImage(file);
  } catch {
    return { error: "That file isn't an image this browser can open - try a PNG, WebP or JPG." };
  }
  if (shrunk.file.size > MAX_UPLOAD_BYTES) return { error: "That image is still over 4 MB after shrinking - export it smaller (WebP works well)." };
  const fd = new FormData();
  fd.set("file", shrunk.file, shrunk.file === file ? file.name : "upload.webp");
  fd.set("width", String(shrunk.width));
  fd.set("height", String(shrunk.height));
  fd.set("name", name);
  fd.set("folder", folder);
  try {
    const res = await uploadProductImageAction(fd);
    if (!res.url || !res.width || !res.height) return { error: res.error ?? "The upload didn't go through - try again." };
    return { image: { src: res.url, width: res.width, height: res.height } };
  } catch {
    return { error: "The upload didn't go through - check the connection and try again." };
  }
}

/** Reads the chosen file and the product name from a file input, then clears it so the same file can be picked again. */
function takeFile(e: ChangeEvent<HTMLInputElement>, fallbackName: string) {
  const input = e.currentTarget;
  const file = input.files?.[0];
  const name = (input.form?.elements.namedItem("name") as HTMLInputElement | null)?.value ?? fallbackName;
  input.value = "";
  return { file, name };
}

export function ProductForm({ product, categories, images }: { product?: Product; categories: Category[]; images: PackImage[] }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveProductAction, {});
  const [options, setOptions] = useState(images);
  const [image, setImage] = useState<PackImage | undefined>(product ? { src: product.image, width: product.imageWidth, height: product.imageHeight } : images[0]);
  const [upload, setUpload] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});
  // Two product page photo slots; empty slots are dropped when saving.
  const [photos, setPhotos] = useState<(ProductPhoto | null)[]>(() => [product?.gallery[0] ?? null, product?.gallery[1] ?? null]);
  const [photoStatus, setPhotoStatus] = useState<UploadStatus[]>([{}, {}]);
  const [bg, setBg] = useState(product?.palette.bg ?? "#F1E4C3");
  const saveLabel = product ? "Save changes" : "Create product";
  const [category, setCategory] = useState(product?.categoryId ?? categories[0]?.id ?? NEW_CATEGORY);
  // After a save that created a category, select it (the refreshed list now includes it).
  const [savedState, setSavedState] = useState(state);
  if (state !== savedState) {
    setSavedState(state);
    if (state.ok && state.categoryId) setCategory(state.categoryId);
  }

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const { file, name } = takeFile(e, product?.name ?? "");
    if (!file) return;
    setUpload({ busy: true });
    const res = await uploadImage(file, "packs", name);
    const added = res.image;
    if (!added) return setUpload({ error: res.error });
    setOptions((list) => [added, ...list.filter((o) => o.src !== added.src)]);
    setImage(added);
    setUpload({ done: true });
  }

  const setSlot = (slot: number, photo: ProductPhoto | null, status: UploadStatus) => {
    setPhotos((list) => list.map((p, i) => (i === slot ? photo : p)));
    setPhotoStatus((list) => list.map((s, i) => (i === slot ? status : s)));
  };
  const setSlotStatus = (slot: number, status: UploadStatus) => setPhotoStatus((list) => list.map((s, i) => (i === slot ? status : s)));

  async function onPickPhoto(slot: number, e: ChangeEvent<HTMLInputElement>) {
    const { file, name } = takeFile(e, product?.name ?? "");
    if (!file) return;
    setSlotStatus(slot, { busy: true });
    const res = await uploadImage(file, "photos", name);
    if (!res.image) return setSlotStatus(slot, { error: res.error });
    setSlot(slot, res.image, { note: `Uploaded - press ${saveLabel} to put it on the shop.` });
  }

  const v = (w: number) => product?.variants.find((x) => x.weightG === w);

  return (
    <form
      onSubmit={(e) => {
        setUpload({});
        setPhotoStatus([{}, {}]);
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
            <input type="file" accept={ACCEPT} className="sr-only" onChange={onPickFile} disabled={upload.busy} />
          </label>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">PNG or WebP with a transparent background looks best. Large photos are shrunk automatically before upload.</p>
          {upload.error && (
            <p className="mt-2 text-sm font-semibold text-chilli-600" role="alert">
              {upload.error}
            </p>
          )}
          {upload.done && (
            <p className="mt-2 text-sm font-semibold text-leaf-600" role="status">
              Uploaded - press {saveLabel} to put it on the shop.
            </p>
          )}

          <div className="mt-6 border-t border-forest-900/10 pt-5">
            <h3 className="text-sm font-bold text-forest-900">Product page photos</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">Shown only on this product&apos;s page, after the pack. Optional.</p>
            <input type="hidden" name="gallery" value={JSON.stringify(photos.filter(Boolean))} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {photos.map((photo, slot) => {
                const status = photoStatus[slot];
                const label = `Photo ${slot + 2}`;
                return (
                  <div key={slot}>
                    <div className={`relative aspect-[4/5] overflow-hidden rounded-2xl ${photo ? "" : "border-2 border-dashed border-forest-900/20"}`} style={{ background: bg }}>
                      {photo ? (
                        <div className="absolute inset-2 flex items-center justify-center">
                          <Image src={photo.src} alt={label} width={photo.width} height={photo.height} sizes="160px" className="h-auto max-h-full w-auto max-w-full rounded-lg object-contain" />
                        </div>
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-forest-800/60">{label}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <label
                        className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-forest-900/15 px-3 py-2 text-xs font-semibold text-forest-800 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-leaf-500 ${status.busy ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-forest-900/5"}`}
                      >
                        <ImageUp className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{status.busy ? "Uploading…" : photo ? "Replace" : "Add photo"}</span>
                        <input type="file" accept={ACCEPT} className="sr-only" aria-label={`${photo ? "Replace" : "Add"} ${label.toLowerCase()}`} onChange={(e) => onPickPhoto(slot, e)} disabled={status.busy} />
                      </label>
                      {photo && !status.busy && (
                        <button
                          type="button"
                          onClick={() => setSlot(slot, null, { note: `Deleted - press ${saveLabel} to take it off the shop.`, removed: photo })}
                          className="grid size-8 shrink-0 place-items-center rounded-full border border-forest-900/15 text-chilli-600 transition-colors hover:bg-chilli-600/10 focus-visible:ring-2 focus-visible:ring-leaf-500"
                          aria-label={`Delete ${label.toLowerCase()}`}
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    {status.error && (
                      <p className="mt-1.5 text-xs font-semibold text-chilli-600" role="alert">
                        {status.error}
                      </p>
                    )}
                    {status.note && (
                      <p className="mt-1.5 text-xs font-semibold text-leaf-600" role="status">
                        {status.note}
                        {status.removed && !photo && (
                          <>
                            {" "}
                            <button type="button" onClick={() => setSlot(slot, status.removed!, {})} className="underline underline-offset-2">
                              Undo
                            </button>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
