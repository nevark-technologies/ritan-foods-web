import type {
  Address,
  Category,
  ContactMessage,
  Coupon,
  Courier,
  CustomerSummary,
  Order,
  OrderItem,
  OrderStatus,
  Paise,
  PaymentMethod,
  PaymentStatus,
  Product,
  Review,
  SavedAddress,
  StoreSettings,
  Variant,
  ZoneId,
} from "./types";

export interface NewOrderInput {
  orderNumber: string;
  userId: string | null;
  email: string;
  phone: string;
  customerName: string;
  shippingAddress: Address;
  items: Omit<OrderItem, "id">[];
  subtotal: Paise;
  discount: Paise;
  shippingFee: Paise;
  codFee: Paise;
  total: Paise;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  shippingZone: ZoneId | null;
  notes?: string | null;
}

export interface OrderFilter {
  userId?: string;
  email?: string;
  status?: OrderStatus | "all";
  q?: string;
  limit?: number;
}

export interface OrderPatch {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  courier?: Courier | null;
  trackingNumber?: string | null;
  notes?: string | null;
  eventNote?: string | null;
}

export interface ProductInput {
  id?: string;
  slug: string;
  name: string;
  altName: string | null;
  categoryId: Product["categoryId"];
  tagline: string;
  summary: string;
  description: string;
  keyIngredients: string[];
  ingredients: string | null;
  howToUse: string;
  packType: Product["packType"];
  image: string;
  imageWidth: number;
  imageHeight: number;
  scene: string | null;
  palette: Product["palette"];
  sprites: Product["sprites"];
  featured: boolean;
  isActive: boolean;
  sort: number;
  variants: Array<Omit<Variant, "id" | "productId"> & { id?: string }>;
}

export interface VariantPatch {
  price?: Paise;
  mrp?: Paise | null;
  stock?: number;
  isActive?: boolean;
  sku?: string;
}

export interface ReviewInput {
  productId: string;
  userId: string | null;
  authorName: string;
  location?: string | null;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
}

/**
 * Storage contract. `mock.ts` keeps everything in memory for demo mode;
 * `supabase.ts` talks to Postgres. Server code only ever imports `store`.
 */
export interface DataStore {
  readonly kind: "mock" | "supabase";

  // Catalogue
  listProducts(opts?: { includeInactive?: boolean }): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  listCategories(): Promise<Category[]>;
  upsertProduct(input: ProductInput): Promise<Product>;
  updateVariant(variantId: string, patch: VariantPatch): Promise<Variant>;
  bulkUpdateStock(updates: { variantId: string; stock: number }[]): Promise<void>;

  // Reviews
  listReviews(opts?: { productId?: string; approvedOnly?: boolean; includeDemo?: boolean; limit?: number }): Promise<Review[]>;
  createReview(input: ReviewInput): Promise<Review>;
  setReviewApproval(id: string, approved: boolean): Promise<void>;
  deleteReview(id: string): Promise<void>;

  // Settings
  getSettings(): Promise<StoreSettings>;
  updateSettings(next: StoreSettings): Promise<StoreSettings>;

  // Coupons
  getCoupon(code: string): Promise<Coupon | null>;
  listCoupons(): Promise<Coupon[]>;
  upsertCoupon(coupon: Omit<Coupon, "usedCount" | "createdAt">): Promise<Coupon>;
  deleteCoupon(code: string): Promise<void>;
  countRedemptions(code: string, email: string): Promise<number>;

  // Orders
  createOrder(input: NewOrderInput): Promise<Order>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  attachRazorpayOrder(orderNumber: string, razorpayOrderId: string): Promise<void>;
  getOrderByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null>;
  listOrders(filter?: OrderFilter): Promise<Order[]>;
  /** Idempotent: decrements stock, records coupon use, marks confirmed. */
  confirmOrder(orderNumber: string, payment: { razorpayPaymentId?: string | null; method: PaymentMethod }): Promise<{ order: Order; alreadyConfirmed: boolean }>;
  markOrderFailed(orderNumber: string, reason: string): Promise<Order | null>;
  updateOrder(orderNumber: string, patch: OrderPatch): Promise<Order>;

  // Customers & addresses
  listCustomers(): Promise<CustomerSummary[]>;
  listAddresses(userId: string): Promise<SavedAddress[]>;
  saveAddress(userId: string, address: Address & { id?: string; label?: string; isDefault?: boolean }): Promise<SavedAddress>;
  deleteAddress(userId: string, id: string): Promise<void>;

  // Wishlist
  getWishlist(userId: string): Promise<string[]>;
  setWishlist(userId: string, productIds: string[]): Promise<void>;

  // Contact
  createContactMessage(input: Omit<ContactMessage, "id" | "createdAt">): Promise<ContactMessage>;
  listContactMessages(): Promise<ContactMessage[]>;
}
