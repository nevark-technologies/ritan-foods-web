"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { notifyOrderShipped } from "@/lib/commerce/notify";
import { isDemoMode, store } from "@/lib/data";
import type { CategoryId, Courier, OrderStatus, PackType, SpriteId, ZoneId } from "@/lib/data/types";
import { supabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export interface AdminFormState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** product form: the category the product was saved in (a new one included) */
  categoryId?: string;
}

const rupeesToPaise = (v: FormDataEntryValue | null) => Math.round(Number(String(v ?? "0").replace(/[^\d.]/g, "")) * 100) || 0;

// ---------------------------------------------------------------- Orders
const STATUSES: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded", "failed"];

export async function updateOrderAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!STATUSES.includes(status)) return { error: "Choose a valid status." };
  const courierRaw = String(formData.get("courier") ?? "");
  const courier = courierRaw === "DTDC" || courierRaw === "India Post" ? (courierRaw as Courier) : null;
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim() || null;
  if (status === "shipped" && (!courier || !trackingNumber)) return { error: "Add the courier and tracking number before marking as shipped." };
  const before = await store.getOrderByNumber(orderNumber);
  if (!before) return { error: "Order not found." };
  const updated = await store.updateOrder(orderNumber, {
    status,
    courier,
    trackingNumber,
    notes: String(formData.get("notes") ?? "").trim() || null,
    eventNote: String(formData.get("eventNote") ?? "").trim() || null,
  });
  if (status === "shipped" && before.status !== "shipped" && formData.get("notify") === "on") await notifyOrderShipped(updated);
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin");
  return { ok: true, message: status === "shipped" && before.status !== "shipped" ? "Marked as shipped - customer notified." : "Order updated." };
}

// ---------------------------------------------------------------- Inventory
export async function saveInventoryAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const updates: { variantId: string; stock: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("stock:")) continue;
    const stock = Math.max(0, Math.floor(Number(value)));
    if (Number.isFinite(stock)) updates.push({ variantId: key.slice(6), stock });
  }
  await store.bulkUpdateStock(updates);
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("price:")) await store.updateVariant(key.slice(6), { price: rupeesToPaise(value) });
  }
  updateTag("catalog");
  revalidatePath("/admin/inventory");
  return { ok: true, message: `Saved ${updates.length} pack sizes.` };
}

export async function setVariantStockAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("variantId") ?? "");
  const stock = Math.max(0, Math.floor(Number(formData.get("stock"))));
  if (id) await store.updateVariant(id, { stock });
  updateTag("catalog");
  revalidatePath("/admin/inventory");
}

// ---------------------------------------------------------------- Products
const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(80).optional(),
  altName: z.string().trim().max(80).optional(),
  categoryId: z.string().trim().min(1).max(60),
  newCategoryName: z.string().trim().max(40).optional(),
  newCategoryBlurb: z.string().trim().max(160).optional(),
  tagline: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(10).max(400),
  description: z.string().trim().min(10).max(2000),
  keyIngredients: z.string().trim().max(300),
  ingredients: z.string().trim().max(1500).optional(),
  howToUse: z.string().trim().min(5).max(600),
  packType: z.enum(["pouch", "jar", "box"]),
  image: z.string().trim().min(1),
  imageWidth: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(32).max(10000).optional()),
  imageHeight: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(32).max(10000).optional()),
  scene: z.string().trim().optional(),
  bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  ink: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  deep: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sort: z.coerce.number().int().min(0).max(999),
});

/** Category select value meaning "add a new category" (see ProductForm). */
const NEW_CATEGORY = "__new";

const STORAGE_BUCKET = "product-images";
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // keep in step with serverActions.bodySizeLimit in next.config.ts
const storagePrefix = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`;

/** Site images, our own storage bucket, or (demo mode only) an inline upload - never an arbitrary URL. */
function isUsableImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  if (isDemoMode) return src.startsWith("data:image/");
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && src.startsWith(storagePrefix());
}

/** Image type from the file's first bytes (the browser's claimed type is not trusted). */
function sniffImage(b: Uint8Array): { ext: string; type: string } | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return { ext: "png", type: "image/png" };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return { ext: "avif", type: "image/avif" };
  return null;
}

export interface UploadedImage {
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}

/**
 * Pack image upload from the product editor. The file goes to the public
 * "product-images" bucket in Supabase Storage; its size comes from the browser
 * (it decoded the file to measure it). Demo mode keeps the image inline instead.
 */
export async function uploadProductImageAction(formData: FormData): Promise<UploadedImage> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file first." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That image is over 4 MB - export it smaller (WebP works well)." };
  const width = Math.round(Number(formData.get("width")));
  const height = Math.round(Number(formData.get("height")));
  if (!(width >= 32 && width <= 10000 && height >= 32 && height <= 10000)) return { error: "Couldn't read the image size - try a PNG, WebP or JPG." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { error: "Only PNG, WebP, JPG or AVIF images can be uploaded." };

  if (isDemoMode) return { url: `data:${kind.type};base64,${Buffer.from(bytes).toString("base64")}`, width, height };

  const base = slugify(String(formData.get("name") ?? "")).slice(0, 48) || "pack";
  const path = `packs/${base}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}.${kind.ext}`;
  const { error } = await supabaseAdmin().storage.from(STORAGE_BUCKET).upload(path, bytes, { contentType: kind.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[admin] image upload failed:", error.message);
    return { error: /bucket/i.test(error.message) ? `Image storage isn't set up yet (bucket "${STORAGE_BUCKET}" missing in Supabase).` : `Upload failed: ${error.message}` };
  }
  return { url: storagePrefix() + path, width, height };
}

export async function saveProductAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const d = parsed.data;
  if (!isUsableImage(d.image)) return { error: "Pick a pack image from the list or upload one." };

  // Category: an existing one, or "__new" to add one from this form (reusing a match instead of duplicating it).
  const categories = await store.listCategories();
  let newCategory: { id: string; name: string; blurb: string; sort: number } | null = null;
  let categoryId = d.categoryId;
  if (categoryId === NEW_CATEGORY) {
    const name = (d.newCategoryName ?? "").replace(/\s+/g, " ");
    if (name.length < 2) return { error: "Type a name for the new category (at least 2 letters)." };
    const id = slugify(name).slice(0, 60);
    if (!id) return { error: "Use letters or numbers in the new category name." };
    const match = categories.find((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase());
    if (match) categoryId = match.id;
    else {
      newCategory = { id, name, blurb: d.newCategoryBlurb ?? "", sort: Math.max(0, ...categories.map((c) => c.sort)) + 1 };
      categoryId = id;
    }
  } else if (!categories.some((c) => c.id === categoryId)) return { error: "Choose a category from the list." };

  const all = await store.listProducts({ includeInactive: true });
  const existing = d.id ? all.find((p) => p.id === d.id) : undefined;
  const slug = existing?.slug ?? (d.slug ? slugify(d.slug) : slugify(d.name));
  if (!existing && all.some((p) => p.slug === slug)) return { error: `The web address "${slug}" is already used by another product.` };

  // SKUs must be unique across the catalogue; generated ones use the slug's initials (garlic-idli-podi → GIP).
  const taken = new Set(all.filter((p) => p.id !== existing?.id).flatMap((p) => p.variants.map((v) => v.sku.toUpperCase())));
  const words = slug.split("-").filter(Boolean);
  const base = (words.length > 1 ? words.map((w) => w[0]).join("") : slug.slice(0, 3)).toUpperCase();
  let code = base;
  for (let n = 2; [100, 200, 300, 500, 1000].some((w) => taken.has(`RF-${code}-${w}`)); n++) code = `${base}${n}`;

  const weights = [100, 200, 300, 500, 1000];
  const variants = weights
    .filter((w) => formData.get(`v:${w}:enabled`) === "on" || formData.get(`v:${w}:price`))
    .map((w) => {
      const prev = existing?.variants.find((v) => v.weightG === w);
      return {
        id: prev?.id,
        weightG: w,
        sku: String(formData.get(`v:${w}:sku`) || prev?.sku || `RF-${code}-${w}`)
          .trim()
          .toUpperCase(),
        price: rupeesToPaise(formData.get(`v:${w}:price`)),
        mrp: formData.get(`v:${w}:mrp`) ? rupeesToPaise(formData.get(`v:${w}:mrp`)) : null,
        stock: Math.max(0, Math.floor(Number(formData.get(`v:${w}:stock`) ?? prev?.stock ?? 0))),
        isActive: formData.get(`v:${w}:enabled`) === "on",
      };
    })
    .filter((v) => v.price > 0);
  if (!variants.some((v) => v.isActive)) return { error: "Enable at least one pack size with a price." };
  const clash = variants.find((v, i) => taken.has(v.sku) || variants.findIndex((x) => x.sku === v.sku) !== i);
  if (clash) return { error: `SKU ${clash.sku} is already in use - give each pack size its own SKU.` };

  let saved;
  try {
    if (newCategory) await store.createCategory(newCategory);
    saved = await store.upsertProduct({
      id: existing?.id,
      slug,
      name: d.name,
      altName: d.altName || null,
      categoryId: categoryId as CategoryId,
      tagline: d.tagline,
      summary: d.summary,
      description: d.description,
      keyIngredients: d.keyIngredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      ingredients: d.ingredients || null,
      howToUse: d.howToUse,
      packType: d.packType as PackType,
      image: d.image,
      imageWidth: d.imageWidth ?? existing?.imageWidth ?? 1200,
      imageHeight: d.imageHeight ?? existing?.imageHeight ?? 1800,
      scene: d.scene || null,
      palette: { bg: d.bg, ink: d.ink, accent: d.accent, deep: d.deep },
      sprites: (existing?.sprites ?? ["curryLeaf", "chilli", "uradDal"]) as SpriteId[],
      featured: formData.get("featured") === "on",
      isActive: formData.get("isActive") === "on",
      sort: d.sort,
      variants,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "The product couldn't be saved." };
  }
  updateTag("catalog");
  revalidatePath("/admin/products");
  if (!existing) redirect(`/admin/products/${encodeURIComponent(saved.id)}?created=1`);
  return { ok: true, message: newCategory ? `Product saved in the new "${newCategory.name}" category - the shop is updated.` : "Product saved - the shop is updated.", categoryId };
}

export async function toggleProductAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const product = (await store.listProducts({ includeInactive: true })).find((p) => p.id === id);
  if (!product) return;
  const { ratingAvg: _a, ratingCount: _c, createdAt: _d, ...rest } = product;
  void _a;
  void _c;
  void _d;
  await store.upsertProduct({ ...rest, isActive: !product.isActive });
  updateTag("catalog");
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------- Coupons
export async function saveCouponAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = z
    .object({
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9]{3,20}$/, "Codes are 3–20 letters/numbers."),
      description: z.string().trim().max(160),
      type: z.enum(["percent", "flat", "free_shipping"]),
      value: z.coerce.number().min(0),
      minSubtotal: z.coerce.number().min(0),
      maxDiscount: z.string().optional(),
      startsAt: z.string().optional(),
      endsAt: z.string().optional(),
      usageLimit: z.string().optional(),
      perCustomerLimit: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.type === "percent" && (d.value <= 0 || d.value > 90)) return { error: "Percentage must be between 1 and 90." };
  await store.upsertCoupon({
    code: d.code,
    description: d.description,
    type: d.type,
    value: d.type === "percent" ? Math.round(d.value) : d.type === "flat" ? Math.round(d.value * 100) : 0,
    minSubtotal: Math.round(d.minSubtotal * 100),
    maxDiscount: d.maxDiscount ? Math.round(Number(d.maxDiscount) * 100) : null,
    startsAt: d.startsAt ? new Date(d.startsAt).toISOString() : null,
    endsAt: d.endsAt ? new Date(`${d.endsAt}T23:59:59`).toISOString() : null,
    usageLimit: d.usageLimit ? Math.max(1, Number(d.usageLimit)) : null,
    perCustomerLimit: d.perCustomerLimit ? Math.max(1, Number(d.perCustomerLimit)) : null,
    isActive: formData.get("isActive") === "on",
  });
  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${d.code} saved.` };
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  await store.deleteCoupon(String(formData.get("code")));
  revalidatePath("/admin/coupons");
}

// ---------------------------------------------------------------- Reviews
export async function moderateReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const op = String(formData.get("op"));
  if (op === "approve") await store.setReviewApproval(id, true);
  if (op === "hide") await store.setReviewApproval(id, false);
  if (op === "delete") await store.deleteReview(id);
  updateTag("reviews");
  updateTag("catalog");
  revalidatePath("/admin/reviews");
}

// ---------------------------------------------------------------- Settings
export async function saveSettingsAction(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const current = await store.getSettings();
  const zones = { ...current.zones };
  for (const z of Object.keys(zones) as ZoneId[]) {
    zones[z] = {
      ...zones[z],
      base: rupeesToPaise(formData.get(`zone:${z}:base`)),
      perExtra500g: rupeesToPaise(formData.get(`zone:${z}:extra`)),
      eta: String(formData.get(`zone:${z}:eta`) || zones[z].eta).slice(0, 30),
    };
  }
  await store.updateSettings({
    ...current,
    freeShippingThreshold: rupeesToPaise(formData.get("freeShippingThreshold")),
    codEnabled: formData.get("codEnabled") === "on",
    codFee: rupeesToPaise(formData.get("codFee")),
    codMaxOrder: rupeesToPaise(formData.get("codMaxOrder")),
    lowStockThreshold: Math.max(0, Math.floor(Number(formData.get("lowStockThreshold")) || 0)),
    announcement: String(formData.get("announcement") ?? "").trim() || null,
    zones,
    contact: {
      ...current.contact,
      email: String(formData.get("contactEmail") || current.contact.email),
      phone: String(formData.get("contactPhone") || current.contact.phone),
      whatsapp: String(formData.get("contactWhatsapp") || current.contact.whatsapp),
      address: String(formData.get("contactAddress") || current.contact.address),
    },
  });
  updateTag("settings");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved." };
}
