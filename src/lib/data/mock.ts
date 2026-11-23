import "server-only";
import { randomUUID } from "node:crypto";
import { buildDemoReviews, buildSeedCoupons, buildSeedProducts, categories as seedCategories, defaultSettings } from "./catalog";
import type { DataStore, NewOrderInput, OrderPatch, ProductInput, ReviewInput, VariantPatch } from "./store";
import type {
  Address,
  Category,
  ContactMessage,
  Coupon,
  CustomerSummary,
  Order,
  OrderStatus,
  Product,
  Review,
  Role,
  SavedAddress,
  StoreSettings,
  Variant,
} from "./types";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  passwordHash: string;
  createdAt: string;
}

interface MockState {
  products: Product[];
  categories: Category[];
  reviews: Review[];
  coupons: Coupon[];
  settings: StoreSettings;
  orders: Order[];
  redemptions: { code: string; email: string; orderNumber: string }[];
  users: MockUser[];
  addresses: SavedAddress[];
  wishlists: Record<string, string[]>;
  messages: ContactMessage[];
}

const clone = <T,>(v: T): T => structuredClone(v);
const nowIso = () => new Date().toISOString();

function recomputeRatings(state: MockState) {
  for (const p of state.products) {
    const rs = state.reviews.filter((r) => r.productId === p.id && r.isApproved);
    p.ratingCount = rs.length;
    p.ratingAvg = rs.length ? Math.round((rs.reduce((s, r) => s + r.rating, 0) / rs.length) * 10) / 10 : 0;
  }
}

/** A handful of demo orders so the admin dashboard has something to show. */
function buildDemoOrders(products: Product[]): Order[] {
  const pick = (slug: string, weight: number) => {
    const p = products.find((x) => x.slug === slug)!;
    const v = p.variants.find((x) => x.weightG === weight)!;
    return { p, v };
  };
  const people = [
    { name: "Lakshmi Raman", email: "lakshmi@example.com", phone: "9840012345", city: "Chennai", state: "Tamil Nadu", pin: "600040", zone: "chennai" as const },
    { name: "Arjun Kumar", email: "arjun@example.com", phone: "9886012345", city: "Bengaluru", state: "Karnataka", pin: "560034", zone: "south" as const },
    { name: "Priya Varma", email: "priya@example.com", phone: "9849012345", city: "Hyderabad", state: "Telangana", pin: "500081", zone: "south" as const },
    { name: "Suresh Pillai", email: "suresh@example.com", phone: "9847012345", city: "Kochi", state: "Kerala", pin: "682020", zone: "south" as const },
    { name: "Divya Rao", email: "divya@example.com", phone: "9822012345", city: "Pune", state: "Maharashtra", pin: "411001", zone: "national" as const },
    { name: "Meena Sundaram", email: "meena@example.com", phone: "9443012345", city: "Coimbatore", state: "Tamil Nadu", pin: "641002", zone: "tamil-nadu" as const },
  ];
  const plan: { who: number; items: [string, number, number][]; status: OrderStatus; days: number; method: "razorpay" | "cod"; courier?: "DTDC" | "India Post"; tracking?: string }[] = [
    { who: 0, items: [["idli-podi", 500, 1], ["curry-leaf-rice-mix", 200, 2]], status: "delivered", days: 12, method: "razorpay", courier: "DTDC", tracking: "D10293847" },
    { who: 1, items: [["sprouted-millet-health-mix", 1000, 1]], status: "shipped", days: 4, method: "razorpay", courier: "India Post", tracking: "EK123456789IN" },
    { who: 2, items: [["abc-malt", 500, 2], ["nendran-banana-malt", 300, 1]], status: "packed", days: 2, method: "razorpay" },
    { who: 3, items: [["nendran-banana-malt", 500, 1], ["groundnut-podi", 200, 1]], status: "confirmed", days: 1, method: "cod" },
    { who: 4, items: [["plant-based-protein", 500, 1], ["protein-plus", 500, 1]], status: "confirmed", days: 0, method: "razorpay" },
    { who: 5, items: [["garlic-idli-podi", 200, 2], ["paruppu-podi", 200, 1], ["moringa-rice-mix", 100, 1]], status: "delivered", days: 20, method: "cod", courier: "DTDC", tracking: "D99887766" },
  ];
  // Fixed reference time keeps the seed deterministic (safe during prerendering).
  const ref = Date.UTC(2026, 10, 22, 12);
  return plan.map((o, i) => {
    const who = people[o.who];
    const created = new Date(ref - o.days * 86400000 - (i + 1) * 3600000).toISOString();
    const items = o.items.map(([slug, w, q], k) => {
      const { p, v } = pick(slug, w);
      return { id: `demo-item-${i}-${k}`, productId: p.id, variantId: v.id, productName: p.name, productSlug: p.slug, weightG: w, unitPrice: v.price, quantity: q, lineTotal: v.price * q, image: p.image };
    });
    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const shippingFee = subtotal >= defaultSettings.freeShippingThreshold ? 0 : defaultSettings.zones[who.zone].base;
    const codFee = o.method === "cod" ? defaultSettings.codFee : 0;
    const flow: OrderStatus[] = ["pending", "confirmed", "packed", "shipped", "delivered"];
    const reached = flow.slice(0, flow.indexOf(o.status) + 1);
    return {
      id: `demo-order-${i}`,
      orderNumber: `RF-2611-D${String(i + 1).padStart(4, "0")}`,
      userId: null,
      email: who.email,
      phone: who.phone,
      customerName: who.name,
      shippingAddress: { fullName: who.name, phone: who.phone, line1: `${12 + i}, Demo Street`, line2: null, landmark: null, city: who.city, state: who.state, pincode: who.pin },
      items,
      itemsCount: items.reduce((s, it) => s + it.quantity, 0),
      subtotal,
      discount: 0,
      shippingFee,
      codFee,
      total: subtotal + shippingFee + codFee,
      couponCode: null,
      paymentMethod: o.method,
      paymentStatus: o.method === "cod" ? (o.status === "delivered" ? "paid" : "cod") : "paid",
      status: o.status,
      razorpayOrderId: o.method === "razorpay" ? `order_demo${i}` : null,
      razorpayPaymentId: o.method === "razorpay" ? `pay_demo${i}` : null,
      shippingZone: who.zone,
      courier: o.courier ?? null,
      trackingNumber: o.tracking ?? null,
      notes: "Demo order",
      events: reached.map((s, k) => ({ status: s, note: null, createdAt: new Date(new Date(created).getTime() + k * 7200000).toISOString() })),
      createdAt: created,
      updatedAt: created,
      paidAt: created,
      shippedAt: o.status === "shipped" || o.status === "delivered" ? created : null,
      deliveredAt: o.status === "delivered" ? created : null,
    } satisfies Order;
  });
}

function createState(): MockState {
  const products = buildSeedProducts();
  const state: MockState = {
    products,
    categories: clone(seedCategories),
    reviews: buildDemoReviews(),
    coupons: buildSeedCoupons(),
    settings: clone(defaultSettings),
    orders: buildDemoOrders(products),
    redemptions: [],
    users: [],
    addresses: [],
    wishlists: {},
    messages: [],
  };
  recomputeRatings(state);
  return state;
}

/** Bump when the seed shape changes so dev hot-reloads rebuild the in-memory store. */
const MOCK_VERSION = 2;
const g = globalThis as typeof globalThis & { __ritanMock?: MockState & { __v?: number } };
export function mockState(): MockState {
  if (!g.__ritanMock || g.__ritanMock.__v !== MOCK_VERSION) g.__ritanMock = Object.assign(createState(), { __v: MOCK_VERSION });
  return g.__ritanMock;
}

function findOrder(orderNumber: string) {
  const o = mockState().orders.find((x) => x.orderNumber === orderNumber);
  if (!o) throw new Error(`Order ${orderNumber} not found`);
  return o;
}

export const mockStore: DataStore = {
  kind: "mock",

  async listProducts(opts) {
    const list = mockState().products.filter((p) => opts?.includeInactive || p.isActive);
    return clone(list.sort((a, b) => a.sort - b.sort));
  },
  async getProductBySlug(slug) {
    const p = mockState().products.find((x) => x.slug === slug);
    return p ? clone(p) : null;
  },
  async listCategories() {
    return clone(mockState().categories);
  },
  async upsertProduct(input: ProductInput) {
    const s = mockState();
    const existing = input.id ? s.products.find((p) => p.id === input.id) : undefined;
    const id = existing?.id ?? `p-${input.slug}`;
    const variants: Variant[] = input.variants.map((v) => ({ ...v, id: v.id ?? `v-${input.slug}-${v.weightG}`, productId: id }));
    const next: Product = {
      ...(existing ?? { ratingAvg: 0, ratingCount: 0, createdAt: nowIso() }),
      ...input,
      id,
      variants,
    } as Product;
    if (existing) Object.assign(existing, next);
    else s.products.push(next);
    return clone(next);
  },
  async updateVariant(variantId, patch: VariantPatch) {
    for (const p of mockState().products) {
      const v = p.variants.find((x) => x.id === variantId);
      if (v) {
        Object.assign(v, Object.fromEntries(Object.entries(patch).filter(([, val]) => val !== undefined)));
        v.stock = Math.max(0, Math.floor(v.stock));
        return clone(v);
      }
    }
    throw new Error("Variant not found");
  },
  async bulkUpdateStock(updates) {
    for (const u of updates) await mockStore.updateVariant(u.variantId, { stock: u.stock });
  },

  async listReviews(opts) {
    let list = mockState().reviews;
    if (opts?.productId) list = list.filter((r) => r.productId === opts.productId);
    if (opts?.approvedOnly) list = list.filter((r) => r.isApproved);
    if (opts?.includeDemo === false) list = list.filter((r) => !r.isDemo);
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return clone(opts?.limit ? list.slice(0, opts.limit) : list);
  },
  async createReview(input: ReviewInput) {
    const s = mockState();
    const product = s.products.find((p) => p.id === input.productId);
    const review: Review = { id: randomUUID(), productSlug: product?.slug, isApproved: false, isDemo: false, createdAt: nowIso(), location: null, ...input };
    s.reviews.push(review);
    recomputeRatings(s);
    return clone(review);
  },
  async setReviewApproval(id, approved) {
    const s = mockState();
    const r = s.reviews.find((x) => x.id === id);
    if (r) r.isApproved = approved;
    recomputeRatings(s);
  },
  async deleteReview(id) {
    const s = mockState();
    s.reviews = s.reviews.filter((r) => r.id !== id);
    recomputeRatings(s);
  },

  async getSettings() {
    return clone(mockState().settings);
  },
  async updateSettings(next) {
    mockState().settings = clone(next);
    return clone(next);
  },

  async getCoupon(code) {
    const c = mockState().coupons.find((x) => x.code === code.trim().toUpperCase());
    return c ? clone(c) : null;
  },
  async listCoupons() {
    return clone(mockState().coupons);
  },
  async upsertCoupon(c) {
    const s = mockState();
    const existing = s.coupons.find((x) => x.code === c.code);
    if (existing) {
      Object.assign(existing, c);
      return clone(existing);
    }
    const created: Coupon = { ...c, usedCount: 0, createdAt: nowIso() };
    s.coupons.push(created);
    return clone(created);
  },
  async deleteCoupon(code) {
    const s = mockState();
    s.coupons = s.coupons.filter((c) => c.code !== code);
  },
  async countRedemptions(code, email) {
    return mockState().redemptions.filter((r) => r.code === code && r.email.toLowerCase() === email.toLowerCase()).length;
  },

  async createOrder(input: NewOrderInput) {
    const s = mockState();
    const ts = nowIso();
    const order: Order = {
      ...input,
      id: randomUUID(),
      items: input.items.map((it) => ({ ...it, id: randomUUID() })),
      itemsCount: input.items.reduce((n, it) => n + it.quantity, 0),
      notes: input.notes ?? null,
      paymentStatus: "pending",
      status: "pending",
      razorpayOrderId: null,
      razorpayPaymentId: null,
      courier: null,
      trackingNumber: null,
      events: [{ status: "pending", note: "Order placed", createdAt: ts }],
      createdAt: ts,
      updatedAt: ts,
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
    };
    s.orders.unshift(order);
    return clone(order);
  },
  async getOrderByNumber(orderNumber) {
    const o = mockState().orders.find((x) => x.orderNumber === orderNumber);
    return o ? clone(o) : null;
  },
  async attachRazorpayOrder(orderNumber, razorpayOrderId) {
    findOrder(orderNumber).razorpayOrderId = razorpayOrderId;
  },
  async getOrderByRazorpayOrderId(id) {
    const o = mockState().orders.find((x) => x.razorpayOrderId === id);
    return o ? clone(o) : null;
  },
  async listOrders(filter) {
    let list = mockState().orders;
    if (filter?.userId) list = list.filter((o) => o.userId === filter.userId);
    if (filter?.email) list = list.filter((o) => o.email.toLowerCase() === filter.email!.toLowerCase());
    if (filter?.status && filter.status !== "all") list = list.filter((o) => o.status === filter.status);
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      list = list.filter((o) => o.orderNumber.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.phone.includes(q));
    }
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return clone(filter?.limit ? list.slice(0, filter.limit) : list);
  },
  async confirmOrder(orderNumber, payment) {
    const s = mockState();
    const order = findOrder(orderNumber);
    if (order.status !== "pending" && order.status !== "failed") return { order: clone(order), alreadyConfirmed: true };
    const shortfalls: string[] = [];
    for (const item of order.items) {
      for (const p of s.products) {
        const v = p.variants.find((x) => x.id === item.variantId);
        if (!v) continue;
        if (v.stock < item.quantity) shortfalls.push(`${item.productName} ${item.weightG}g (had ${v.stock})`);
        v.stock = Math.max(0, v.stock - item.quantity);
      }
    }
    if (order.couponCode) {
      const c = s.coupons.find((x) => x.code === order.couponCode);
      if (c) c.usedCount += 1;
      s.redemptions.push({ code: order.couponCode, email: order.email, orderNumber });
    }
    const ts = nowIso();
    order.status = "confirmed";
    order.paymentStatus = payment.method === "cod" ? "cod" : "paid";
    order.razorpayPaymentId = payment.razorpayPaymentId ?? order.razorpayPaymentId;
    order.paidAt = payment.method === "cod" ? null : ts;
    order.updatedAt = ts;
    order.events.push({ status: "confirmed", note: payment.method === "cod" ? "Cash on delivery order confirmed" : "Payment received", createdAt: ts });
    if (shortfalls.length) order.notes = [order.notes, `Stock shortfall: ${shortfalls.join(", ")}`].filter(Boolean).join(" · ");
    return { order: clone(order), alreadyConfirmed: false };
  },
  async markOrderFailed(orderNumber, reason) {
    const o = mockState().orders.find((x) => x.orderNumber === orderNumber);
    if (!o || o.status !== "pending") return o ? clone(o) : null;
    o.status = "failed";
    o.paymentStatus = "failed";
    o.updatedAt = nowIso();
    o.events.push({ status: "failed", note: reason, createdAt: o.updatedAt });
    return clone(o);
  },
  async updateOrder(orderNumber, patch: OrderPatch) {
    const o = findOrder(orderNumber);
    const ts = nowIso();
    if (patch.status && patch.status !== o.status) {
      o.status = patch.status;
      o.events.push({ status: patch.status, note: patch.eventNote ?? null, createdAt: ts });
      if (patch.status === "shipped") o.shippedAt = ts;
      if (patch.status === "delivered") {
        o.deliveredAt = ts;
        if (o.paymentMethod === "cod") o.paymentStatus = "paid";
      }
      if (patch.status === "refunded") o.paymentStatus = "refunded";
    }
    if (patch.paymentStatus) o.paymentStatus = patch.paymentStatus;
    if (patch.courier !== undefined) o.courier = patch.courier;
    if (patch.trackingNumber !== undefined) o.trackingNumber = patch.trackingNumber;
    if (patch.notes !== undefined) o.notes = patch.notes;
    o.updatedAt = ts;
    return clone(o);
  },

  async listCustomers() {
    const s = mockState();
    const map = new Map<string, CustomerSummary>();
    for (const u of s.users) {
      map.set(u.email.toLowerCase(), { key: u.id, userId: u.id, name: u.name, email: u.email, phone: u.phone, ordersCount: 0, totalSpent: 0, lastOrderAt: null, joinedAt: u.createdAt, isRegistered: true });
    }
    for (const o of s.orders) {
      if (o.status === "pending" || o.status === "failed") continue;
      const k = o.email.toLowerCase();
      const c = map.get(k) ?? { key: k, userId: o.userId, name: o.customerName, email: o.email, phone: o.phone, ordersCount: 0, totalSpent: 0, lastOrderAt: null, joinedAt: null, isRegistered: false };
      c.ordersCount += 1;
      c.totalSpent += o.total;
      c.phone ??= o.phone;
      if (!c.lastOrderAt || o.createdAt > c.lastOrderAt) c.lastOrderAt = o.createdAt;
      map.set(k, c);
    }
    return [...map.values()].sort((a, b) => (b.lastOrderAt ?? b.joinedAt ?? "").localeCompare(a.lastOrderAt ?? a.joinedAt ?? ""));
  },
  async listAddresses(userId) {
    return clone(mockState().addresses.filter((a) => a.userId === userId));
  },
  async saveAddress(userId, address) {
    const s = mockState();
    const existing = address.id ? s.addresses.find((a) => a.id === address.id && a.userId === userId) : undefined;
    const isFirst = !s.addresses.some((a) => a.userId === userId);
    const saved: SavedAddress = {
      ...(existing ?? {}),
      ...(address as Address),
      id: existing?.id ?? randomUUID(),
      userId,
      label: address.label ?? existing?.label ?? "Home",
      isDefault: address.isDefault ?? existing?.isDefault ?? isFirst,
    };
    if (saved.isDefault) s.addresses.forEach((a) => a.userId === userId && (a.isDefault = false));
    if (existing) Object.assign(existing, saved);
    else s.addresses.push(saved);
    return clone(saved);
  },
  async deleteAddress(userId, id) {
    const s = mockState();
    s.addresses = s.addresses.filter((a) => !(a.userId === userId && a.id === id));
  },

  async getWishlist(userId) {
    return [...(mockState().wishlists[userId] ?? [])];
  },
  async setWishlist(userId, ids) {
    mockState().wishlists[userId] = [...new Set(ids)];
  },

  async createContactMessage(input) {
    const msg: ContactMessage = { ...input, id: randomUUID(), createdAt: nowIso() };
    mockState().messages.unshift(msg);
    return clone(msg);
  },
  async listContactMessages() {
    return clone(mockState().messages);
  },
};
