import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabaseAdmin, supabasePublic } from "@/lib/supabase/server";
import { defaultSettings } from "./catalog";
import type { DataStore, NewOrderInput, OrderFilter, OrderPatch, ProductInput, ReviewInput, VariantPatch } from "./store";
import type {
  Address,
  Category,
  CategoryId,
  ContactMessage,
  Coupon,
  CouponType,
  Courier,
  CustomerSummary,
  Order,
  OrderEvent,
  OrderItem,
  OrderStatus,
  PackType,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductPalette,
  ProductPhoto,
  Review,
  SavedAddress,
  SpriteId,
  StoreSettings,
  Variant,
  ZoneId,
} from "./types";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

/* ------------------------------------------------------------------ Rows */

interface VariantRow {
  id: string;
  product_id: string;
  weight_g: number;
  sku: string;
  price_paise: number;
  mrp_paise: number | null;
  stock: number;
  is_active: boolean;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  alt_name: string | null;
  category_id: CategoryId;
  tagline: string;
  summary: string;
  description: string;
  key_ingredients: string[] | null;
  ingredients: string | null;
  how_to_use: string;
  pack_type: PackType;
  image: string;
  image_width: number;
  image_height: number;
  /** Missing until supabase/migrations/0002_product_gallery.sql has run. */
  gallery?: ProductPhoto[] | null;
  palette: ProductPalette;
  sprites: SpriteId[] | null;
  featured: boolean;
  is_active: boolean;
  sort: number;
  rating_avg: number | string;
  rating_count: number;
  created_at: string;
  product_variants?: VariantRow[];
}

interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
  verified_purchase: boolean;
  is_approved: boolean;
  is_demo: boolean;
  created_at: string;
  products?: { slug: string } | null;
}

interface CouponRow {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  min_subtotal_paise: number;
  max_discount_paise: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  per_customer_limit: number | null;
  is_active: boolean;
  used_count: number;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_slug: string;
  weight_g: number;
  unit_price_paise: number;
  quantity: number;
  line_total_paise: number;
  image: string | null;
  position: number;
}

interface OrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  phone: string;
  customer_name: string;
  shipping_address: Address;
  items_count: number;
  subtotal_paise: number;
  discount_paise: number;
  shipping_paise: number;
  cod_fee_paise: number;
  total_paise: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  shipping_zone: ZoneId | null;
  courier: Courier | null;
  tracking_number: string | null;
  notes: string | null;
  events: OrderEvent[] | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items?: OrderItemRow[];
}

interface AddressRow {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

/* ------------------------------------------------------------------ Mapping */

const toVariant = (r: VariantRow): Variant => ({
  id: r.id,
  productId: r.product_id,
  weightG: r.weight_g,
  sku: r.sku,
  price: r.price_paise,
  mrp: r.mrp_paise,
  stock: r.stock,
  isActive: r.is_active,
});

const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  altName: r.alt_name,
  categoryId: r.category_id,
  tagline: r.tagline,
  summary: r.summary,
  description: r.description,
  keyIngredients: r.key_ingredients ?? [],
  ingredients: r.ingredients,
  howToUse: r.how_to_use,
  packType: r.pack_type,
  image: r.image,
  imageWidth: r.image_width,
  imageHeight: r.image_height,
  gallery: Array.isArray(r.gallery) ? r.gallery : [],
  palette: r.palette,
  sprites: r.sprites ?? [],
  featured: r.featured,
  isActive: r.is_active,
  sort: r.sort,
  ratingAvg: Number(r.rating_avg) || 0,
  ratingCount: r.rating_count,
  variants: (r.product_variants ?? []).map(toVariant).sort((a, b) => a.weightG - b.weightG),
  createdAt: r.created_at,
});

const toReview = (r: ReviewRow): Review => ({
  id: r.id,
  productId: r.product_id,
  productSlug: r.products?.slug,
  userId: r.user_id,
  authorName: r.author_name,
  location: r.location,
  rating: r.rating,
  title: r.title,
  body: r.body,
  verifiedPurchase: r.verified_purchase,
  isApproved: r.is_approved,
  isDemo: r.is_demo,
  createdAt: r.created_at,
});

const toCoupon = (r: CouponRow): Coupon => ({
  code: r.code,
  description: r.description,
  type: r.type,
  value: r.value,
  minSubtotal: r.min_subtotal_paise,
  maxDiscount: r.max_discount_paise,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  usageLimit: r.usage_limit,
  perCustomerLimit: r.per_customer_limit,
  isActive: r.is_active,
  usedCount: r.used_count,
  createdAt: r.created_at,
});

const toItem = (r: OrderItemRow): OrderItem => ({
  id: r.id,
  productId: r.product_id,
  variantId: r.variant_id,
  productName: r.product_name,
  productSlug: r.product_slug,
  weightG: r.weight_g,
  unitPrice: r.unit_price_paise,
  quantity: r.quantity,
  lineTotal: r.line_total_paise,
  image: r.image,
});

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  orderNumber: r.order_number,
  userId: r.user_id,
  email: r.email,
  phone: r.phone,
  customerName: r.customer_name,
  shippingAddress: r.shipping_address,
  items: [...(r.order_items ?? [])].sort((a, b) => a.position - b.position).map(toItem),
  itemsCount: r.items_count,
  subtotal: r.subtotal_paise,
  discount: r.discount_paise,
  shippingFee: r.shipping_paise,
  codFee: r.cod_fee_paise,
  total: r.total_paise,
  couponCode: r.coupon_code,
  paymentMethod: r.payment_method,
  paymentStatus: r.payment_status,
  status: r.status,
  razorpayOrderId: r.razorpay_order_id,
  razorpayPaymentId: r.razorpay_payment_id,
  shippingZone: r.shipping_zone,
  courier: r.courier,
  trackingNumber: r.tracking_number,
  notes: r.notes,
  events: r.events ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  paidAt: r.paid_at,
  shippedAt: r.shipped_at,
  deliveredAt: r.delivered_at,
});

const toAddress = (r: AddressRow): SavedAddress => ({
  id: r.id,
  userId: r.user_id,
  label: r.label,
  fullName: r.full_name,
  phone: r.phone,
  line1: r.line1,
  line2: r.line2,
  landmark: r.landmark,
  city: r.city,
  state: r.state,
  pincode: r.pincode,
  isDefault: r.is_default,
});

const toMessage = (r: MessageRow): ContactMessage => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, message: r.message, createdAt: r.created_at });

/* ------------------------------------------------------------------ Helpers */

const PRODUCT_SELECT = "*, product_variants(*)";
const ORDER_SELECT = "*, order_items(*)";
const REVIEW_SELECT = "*, products(slug)";
const PAGE = 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Unwraps a PostgREST response, turning errors into readable exceptions. */
function must<T>(res: { data: T | null; error: PostgrestError | null }, what: string): T {
  if (res.error) {
    const friendly = res.error.code === "23505" ? `${what}: that value is already in use (${res.error.details ?? res.error.message})` : `${what}: ${res.error.message}`;
    throw new Error(friendly);
  }
  return res.data as T;
}

/** PostgREST caps a response at 1000 rows; page through for complete admin lists. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>, what: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const rows = must(await page(from, from + PAGE - 1), what) ?? [];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

/** Keeps search text safe inside a PostgREST `or=(…)` filter. */
const searchTerm = (q: string) =>
  q
    .replace(/[^\p{L}\p{N}@.+\- ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

const nowIso = () => new Date().toISOString();
const db = () => supabaseAdmin();
const pub = () => supabasePublic();

async function readOrder(orderNumber: string): Promise<OrderRow | null> {
  return must(await db().from("orders").select(ORDER_SELECT).eq("order_number", orderNumber).maybeSingle<OrderRow>(), "Load order");
}

async function readProduct(id: string): Promise<Product> {
  const row = must(await db().from("products").select(PRODUCT_SELECT).eq("id", id).single<ProductRow>(), "Load product");
  return toProduct(row);
}

/**
 * Optimistic read-modify-write for order changes that append to the event log:
 * the update only lands if nobody touched the order since we read it.
 */
async function mutateOrder(orderNumber: string, change: (o: OrderRow) => Partial<OrderRow> | null): Promise<OrderRow | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readOrder(orderNumber);
    if (!current) return null;
    const patch = change(current);
    if (!patch) return current;
    const { order_items: _items, ...fields } = patch;
    void _items;
    const res = await db().from("orders").update(fields).eq("id", current.id).eq("updated_at", current.updated_at).select("id");
    if (must(res, "Update order").length) return readOrder(orderNumber);
  }
  throw new Error(`Order ${orderNumber} is changing too quickly - please retry.`);
}

function settingsFrom(value: Partial<StoreSettings> | null | undefined): StoreSettings {
  const v = value ?? {};
  return {
    ...defaultSettings,
    ...v,
    zones: { ...defaultSettings.zones, ...(v.zones ?? {}) },
    contact: { ...defaultSettings.contact, ...(v.contact ?? {}) },
  };
}

/* ------------------------------------------------------------------ Store */

export const supabaseStore: DataStore = {
  kind: "supabase",

  // Catalogue ---------------------------------------------------------------
  async listProducts(opts) {
    const client = opts?.includeInactive ? db() : pub();
    let query = client.from("products").select(PRODUCT_SELECT).order("sort");
    if (!opts?.includeInactive) query = query.eq("is_active", true);
    const rows = must(await query.returns<ProductRow[]>(), "List products");
    return rows.map(toProduct);
  },

  async getProductBySlug(slug) {
    const row = must(await pub().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle<ProductRow>(), "Load product");
    return row ? toProduct(row) : null;
  },

  async listCategories() {
    return must(await pub().from("categories").select("*").order("sort").returns<Category[]>(), "List categories");
  },

  async createCategory(input: Category) {
    return must(await db().from("categories").insert(input).select("*").single<Category>(), "Create category");
  },

  async upsertProduct(input: ProductInput) {
    const row = {
      slug: input.slug,
      name: input.name,
      alt_name: input.altName,
      category_id: input.categoryId,
      tagline: input.tagline,
      summary: input.summary,
      description: input.description,
      key_ingredients: input.keyIngredients,
      ingredients: input.ingredients,
      how_to_use: input.howToUse,
      pack_type: input.packType,
      image: input.image,
      image_width: input.imageWidth,
      image_height: input.imageHeight,
      gallery: input.gallery,
      palette: input.palette,
      sprites: input.sprites,
      featured: input.featured,
      is_active: input.isActive,
      sort: input.sort,
    };
    const id = input.id
      ? (must(await db().from("products").update(row).eq("id", input.id).select("id").single<{ id: string }>(), "Save product").id)
      : (must(await db().from("products").insert(row).select("id").single<{ id: string }>(), "Create product").id);

    // Variants: drop removed sizes, update known ones, insert new ones.
    const keep = input.variants.map((v) => v.id).filter((v): v is string => Boolean(v));
    let removal = db().from("product_variants").delete().eq("product_id", id);
    if (keep.length) removal = removal.not("id", "in", `(${keep.join(",")})`);
    must(await removal, "Remove pack sizes");
    for (const v of input.variants) {
      const fields = { product_id: id, weight_g: v.weightG, sku: v.sku, price_paise: v.price, mrp_paise: v.mrp, stock: Math.max(0, Math.floor(v.stock)), is_active: v.isActive };
      if (v.id) must(await db().from("product_variants").update(fields).eq("id", v.id), `Save ${v.weightG} g pack`);
      else must(await db().from("product_variants").insert(fields), `Add ${v.weightG} g pack`);
    }
    return readProduct(id);
  },

  async updateVariant(variantId, patch: VariantPatch) {
    const fields: Partial<VariantRow> = {};
    if (patch.price !== undefined) fields.price_paise = patch.price;
    if (patch.mrp !== undefined) fields.mrp_paise = patch.mrp;
    if (patch.stock !== undefined) fields.stock = Math.max(0, Math.floor(patch.stock));
    if (patch.isActive !== undefined) fields.is_active = patch.isActive;
    if (patch.sku !== undefined) fields.sku = patch.sku;
    const row = must(await db().from("product_variants").update(fields).eq("id", variantId).select("*").single<VariantRow>(), "Update pack size");
    return toVariant(row);
  },

  async bulkUpdateStock(updates) {
    await Promise.all(updates.map((u) => supabaseStore.updateVariant(u.variantId, { stock: u.stock })));
  },

  // Reviews -----------------------------------------------------------------
  async listReviews(opts) {
    // Approved-only lists are public data; the moderation queue needs the service role.
    let query = (opts?.approvedOnly ? pub() : db()).from("reviews").select(REVIEW_SELECT).order("created_at", { ascending: false });
    if (opts?.productId) query = query.eq("product_id", opts.productId);
    if (opts?.approvedOnly) query = query.eq("is_approved", true);
    if (opts?.includeDemo === false) query = query.eq("is_demo", false);
    if (opts?.limit) query = query.limit(opts.limit);
    const rows = must(await query.returns<ReviewRow[]>(), "List reviews");
    return rows.map(toReview);
  },

  async createReview(input: ReviewInput) {
    const row = must(
      await db()
        .from("reviews")
        .insert({
          product_id: input.productId,
          user_id: input.userId,
          author_name: input.authorName,
          location: input.location ?? null,
          rating: input.rating,
          title: input.title,
          body: input.body,
          verified_purchase: input.verifiedPurchase,
          is_approved: false,
        })
        .select(REVIEW_SELECT)
        .single<ReviewRow>(),
      "Save review",
    );
    return toReview(row);
  },

  async setReviewApproval(id, approved) {
    must(await db().from("reviews").update({ is_approved: approved }).eq("id", id), "Moderate review");
  },

  async deleteReview(id) {
    must(await db().from("reviews").delete().eq("id", id), "Delete review");
  },

  // Settings ----------------------------------------------------------------
  async getSettings() {
    const row = must(await pub().from("settings").select("value").eq("key", "store").maybeSingle<{ value: Partial<StoreSettings> }>(), "Load settings");
    return settingsFrom(row?.value);
  },

  async updateSettings(next) {
    must(await db().from("settings").upsert({ key: "store", value: next, updated_at: nowIso() }), "Save settings");
    return settingsFrom(next);
  },

  // Coupons -----------------------------------------------------------------
  async getCoupon(code) {
    const row = must(await db().from("coupons").select("*").eq("code", code.trim().toUpperCase()).maybeSingle<CouponRow>(), "Load coupon");
    return row ? toCoupon(row) : null;
  },

  async listCoupons() {
    const rows = must(await db().from("coupons").select("*").order("created_at").returns<CouponRow[]>(), "List coupons");
    return rows.map(toCoupon);
  },

  async upsertCoupon(c) {
    const row = must(
      await db()
        .from("coupons")
        .upsert(
          {
            code: c.code,
            description: c.description,
            type: c.type,
            value: c.value,
            min_subtotal_paise: c.minSubtotal,
            max_discount_paise: c.maxDiscount,
            starts_at: c.startsAt,
            ends_at: c.endsAt,
            usage_limit: c.usageLimit,
            per_customer_limit: c.perCustomerLimit,
            is_active: c.isActive,
          },
          { onConflict: "code" },
        )
        .select("*")
        .single<CouponRow>(),
      "Save coupon",
    );
    return toCoupon(row);
  },

  async deleteCoupon(code) {
    must(await db().from("coupons").delete().eq("code", code), "Delete coupon");
  },

  async countRedemptions(code, email) {
    const res = await db().from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_code", code).eq("email", email.trim().toLowerCase());
    if (res.error) throw new Error(`Count coupon use: ${res.error.message}`);
    return res.count ?? 0;
  },

  // Orders ------------------------------------------------------------------
  async createOrder(input: NewOrderInput) {
    const order = {
      order_number: input.orderNumber,
      user_id: input.userId,
      email: input.email.trim().toLowerCase(),
      phone: input.phone,
      customer_name: input.customerName,
      shipping_address: input.shippingAddress,
      items_count: input.items.reduce((n, it) => n + it.quantity, 0),
      subtotal_paise: input.subtotal,
      discount_paise: input.discount,
      shipping_paise: input.shippingFee,
      cod_fee_paise: input.codFee,
      total_paise: input.total,
      coupon_code: input.couponCode,
      payment_method: input.paymentMethod,
      shipping_zone: input.shippingZone,
      notes: input.notes ?? null,
      events: [{ status: "pending", note: "Order placed", createdAt: nowIso() }],
    };
    const items = input.items.map((it) => ({
      product_id: it.productId,
      variant_id: it.variantId,
      product_name: it.productName,
      product_slug: it.productSlug,
      weight_g: it.weightG,
      unit_price_paise: it.unitPrice,
      quantity: it.quantity,
      line_total_paise: it.lineTotal,
      image: it.image,
    }));
    must(await db().rpc("create_order", { p_order: order, p_items: items }), "Create order");
    const row = await readOrder(input.orderNumber);
    if (!row) throw new Error("Create order: the order was not saved");
    return toOrder(row);
  },

  async getOrderByNumber(orderNumber) {
    const row = await readOrder(orderNumber);
    return row ? toOrder(row) : null;
  },

  async attachRazorpayOrder(orderNumber, razorpayOrderId) {
    must(await db().from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("order_number", orderNumber), "Attach payment");
  },

  async getOrderByRazorpayOrderId(id) {
    const row = must(await db().from("orders").select(ORDER_SELECT).eq("razorpay_order_id", id).maybeSingle<OrderRow>(), "Load order");
    return row ? toOrder(row) : null;
  },

  async listOrders(filter?: OrderFilter) {
    const build = () => {
      let query = db().from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });
      if (filter?.userId) query = query.eq("user_id", filter.userId);
      if (filter?.email) query = query.eq("email", filter.email.trim().toLowerCase());
      if (filter?.status && filter.status !== "all") query = query.eq("status", filter.status);
      const term = filter?.q ? searchTerm(filter.q) : "";
      if (term) {
        const like = `"%${term}%"`;
        query = query.or(`order_number.ilike.${like},email.ilike.${like},customer_name.ilike.${like},phone.ilike.${like}`);
      }
      return query;
    };
    const rows = filter?.limit
      ? must(await build().limit(filter.limit).returns<OrderRow[]>(), "List orders")
      : await fetchAll<OrderRow>((from, to) => build().range(from, to).returns<OrderRow[]>(), "List orders");
    return rows.map(toOrder);
  },

  async confirmOrder(orderNumber, payment) {
    const res = must(
      await db().rpc("confirm_order", { p_order_number: orderNumber, p_payment_id: payment.razorpayPaymentId ?? null, p_method: payment.method }),
      "Confirm order",
    ) as { order_id: string; already_confirmed: boolean }[] | null;
    const row = await readOrder(orderNumber);
    if (!row) throw new Error(`Order ${orderNumber} not found`);
    return { order: toOrder(row), alreadyConfirmed: Boolean(res?.[0]?.already_confirmed) };
  },

  async markOrderFailed(orderNumber, reason) {
    const row = await mutateOrder(orderNumber, (o) => {
      if (o.status !== "pending") return null;
      const ts = nowIso();
      return { status: "failed", payment_status: "failed", events: [...(o.events ?? []), { status: "failed", note: reason, createdAt: ts }] };
    });
    return row ? toOrder(row) : null;
  },

  async updateOrder(orderNumber, patch: OrderPatch) {
    const row = await mutateOrder(orderNumber, (o) => {
      const ts = nowIso();
      const next: Partial<OrderRow> = {};
      if (patch.status && patch.status !== o.status) {
        next.status = patch.status;
        next.events = [...(o.events ?? []), { status: patch.status, note: patch.eventNote ?? null, createdAt: ts }];
        if (patch.status === "shipped") next.shipped_at = ts;
        if (patch.status === "delivered") {
          next.delivered_at = ts;
          if (o.payment_method === "cod") next.payment_status = "paid";
        }
        if (patch.status === "refunded") next.payment_status = "refunded";
      }
      if (patch.paymentStatus) next.payment_status = patch.paymentStatus;
      if (patch.courier !== undefined) next.courier = patch.courier;
      if (patch.trackingNumber !== undefined) next.tracking_number = patch.trackingNumber;
      if (patch.notes !== undefined) next.notes = patch.notes;
      return Object.keys(next).length ? next : null;
    });
    if (!row) throw new Error(`Order ${orderNumber} not found`);
    return toOrder(row);
  },

  // Customers & addresses ---------------------------------------------------
  async listCustomers() {
    const [profiles, orders] = await Promise.all([
      fetchAll<{ id: string; email: string | null; full_name: string | null; phone: string | null; role: string; created_at: string }>(
        (from, to) => db().from("profiles").select("id, email, full_name, phone, role, created_at").neq("role", "admin").order("created_at").range(from, to),
        "List customers",
      ),
      fetchAll<Pick<OrderRow, "email" | "user_id" | "customer_name" | "phone" | "total_paise" | "created_at">>(
        (from, to) =>
          db().from("orders").select("email, user_id, customer_name, phone, total_paise, created_at").not("status", "in", "(pending,failed)").order("created_at").range(from, to),
        "List customer orders",
      ),
    ]);
    const map = new Map<string, CustomerSummary>();
    for (const p of profiles) {
      const email = (p.email ?? "").toLowerCase();
      map.set(email || p.id, { key: p.id, userId: p.id, name: p.full_name ?? email, email, phone: p.phone, ordersCount: 0, totalSpent: 0, lastOrderAt: null, joinedAt: p.created_at, isRegistered: true });
    }
    for (const o of orders) {
      const k = o.email.toLowerCase();
      const c = map.get(k) ?? { key: k, userId: o.user_id, name: o.customer_name, email: o.email, phone: o.phone, ordersCount: 0, totalSpent: 0, lastOrderAt: null, joinedAt: null, isRegistered: false };
      c.ordersCount += 1;
      c.totalSpent += o.total_paise;
      c.phone ??= o.phone;
      if (!c.lastOrderAt || o.created_at > c.lastOrderAt) c.lastOrderAt = o.created_at;
      map.set(k, c);
    }
    return [...map.values()].sort((a, b) => (b.lastOrderAt ?? b.joinedAt ?? "").localeCompare(a.lastOrderAt ?? a.joinedAt ?? ""));
  },

  async listAddresses(userId) {
    const rows = must(await db().from("addresses").select("*").eq("user_id", userId).order("created_at").returns<AddressRow[]>(), "List addresses");
    return rows.map(toAddress);
  },

  async saveAddress(userId, address) {
    const existing = address.id
      ? must(await db().from("addresses").select("*").eq("id", address.id).eq("user_id", userId).maybeSingle<AddressRow>(), "Load address")
      : null;
    const others = must(await db().from("addresses").select("id").eq("user_id", userId).returns<{ id: string }[]>(), "List addresses");
    const isDefault = address.isDefault ?? existing?.is_default ?? others.length === 0;
    if (isDefault) {
      let reset = db().from("addresses").update({ is_default: false }).eq("user_id", userId);
      if (existing) reset = reset.neq("id", existing.id);
      must(await reset, "Update default address");
    }
    const fields = {
      user_id: userId,
      label: address.label ?? existing?.label ?? "Home",
      full_name: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      landmark: address.landmark ?? null,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      is_default: isDefault,
    };
    const row = existing
      ? must(await db().from("addresses").update(fields).eq("id", existing.id).select("*").single<AddressRow>(), "Save address")
      : must(await db().from("addresses").insert(fields).select("*").single<AddressRow>(), "Save address");
    return toAddress(row);
  },

  async deleteAddress(userId, id) {
    must(await db().from("addresses").delete().eq("user_id", userId).eq("id", id), "Delete address");
  },

  // Wishlist ----------------------------------------------------------------
  async getWishlist(userId) {
    const rows = must(await db().from("wishlists").select("product_id").eq("user_id", userId).order("created_at").returns<{ product_id: string }[]>(), "Load wishlist");
    return rows.map((r) => r.product_id);
  },

  async setWishlist(userId, productIds) {
    const wanted = [...new Set(productIds)].filter((id) => UUID.test(id));
    const known = wanted.length
      ? must(await db().from("products").select("id").in("id", wanted).returns<{ id: string }[]>(), "Check wishlist").map((r) => r.id)
      : [];
    if (known.length) {
      must(await db().from("wishlists").upsert(known.map((product_id) => ({ user_id: userId, product_id })), { onConflict: "user_id,product_id", ignoreDuplicates: true }), "Save wishlist");
    }
    let prune = db().from("wishlists").delete().eq("user_id", userId);
    if (known.length) prune = prune.not("product_id", "in", `(${known.join(",")})`);
    must(await prune, "Save wishlist");
  },

  // Contact -----------------------------------------------------------------
  async createContactMessage(input) {
    const row = must(await db().from("contact_messages").insert(input).select("*").single<MessageRow>(), "Save message");
    return toMessage(row);
  },

  async listContactMessages() {
    const rows = await fetchAll<MessageRow>((from, to) => db().from("contact_messages").select("*").order("created_at", { ascending: false }).range(from, to), "List messages");
    return rows.map(toMessage);
  },
};
