/** Money is integer paise throughout the app. */
export type Paise = number;

export type CategoryId = "podis" | "rice-mixes" | "health-mixes" | "wellness";

export type SpriteId =
  | "curryLeaf"
  | "chilli"
  | "cardamom"
  | "peanut"
  | "uradDal"
  | "chanaDal"
  | "millet"
  | "mustard"
  | "sesame"
  | "garlic"
  | "almond"
  | "cashew"
  | "moringa"
  | "bananaSlice"
  | "carrotSlice"
  | "beetSlice"
  | "appleSlice"
  | "mungBean"
  | "soybean"
  | "date"
  | "horseGram";

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  sort: number;
}

export interface ProductPalette {
  /** Stage / card background */
  bg: string;
  /** Text on bg */
  ink: string;
  /** Highlight colour sampled from the pack */
  accent: string;
  /** Deep tone for giant type on the stage */
  deep: string;
}

export type PackType = "pouch" | "jar" | "box";

export interface Variant {
  id: string;
  productId: string;
  weightG: number;
  sku: string;
  price: Paise;
  mrp: Paise | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Secondary name shown under the title, e.g. "Fried Gram Dhal Powder" */
  altName: string | null;
  categoryId: CategoryId;
  tagline: string;
  summary: string;
  description: string;
  keyIngredients: string[];
  /** Full ingredient declaration (admin-maintained). Hidden when empty. */
  ingredients: string | null;
  howToUse: string;
  packType: PackType;
  /** Transparent pack cut-out */
  image: string;
  /** Intrinsic size of the cut-out (for layout / aspect ratio) */
  imageWidth: number;
  imageHeight: number;
  /** Lifestyle / scene photo */
  scene: string | null;
  palette: ProductPalette;
  sprites: SpriteId[];
  featured: boolean;
  isActive: boolean;
  sort: number;
  ratingAvg: number;
  ratingCount: number;
  variants: Variant[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productSlug?: string;
  userId: string | null;
  authorName: string;
  location?: string | null;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  isDemo: boolean;
  createdAt: string;
}

export type CouponType = "percent" | "flat" | "free_shipping";

export interface Coupon {
  code: string;
  description: string;
  type: CouponType;
  /** percent (0-100) for `percent`, paise for `flat`, ignored for `free_shipping` */
  value: number;
  minSubtotal: Paise;
  maxDiscount: Paise | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface SavedAddress extends Address {
  id: string;
  userId: string;
  label: string;
  isDefault: boolean;
}

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded" | "failed";
export type PaymentMethod = "razorpay" | "cod";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cod";
export type Courier = "DTDC" | "India Post";

export type ZoneId = "chennai" | "tamil-nadu" | "south" | "national" | "remote";

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  productSlug: string;
  weightG: number;
  unitPrice: Paise;
  quantity: number;
  lineTotal: Paise;
  image: string | null;
}

export interface OrderEvent {
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  email: string;
  phone: string;
  customerName: string;
  shippingAddress: Address;
  items: OrderItem[];
  itemsCount: number;
  subtotal: Paise;
  discount: Paise;
  shippingFee: Paise;
  codFee: Paise;
  total: Paise;
  couponCode: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  shippingZone: ZoneId | null;
  courier: Courier | null;
  trackingNumber: string | null;
  notes: string | null;
  events: OrderEvent[];
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface ZoneRate {
  label: string;
  /** Fee for the first 500 g */
  base: Paise;
  /** Fee for each additional 500 g */
  perExtra500g: Paise;
  eta: string;
}

export interface StoreSettings {
  freeShippingThreshold: Paise;
  codEnabled: boolean;
  codFee: Paise;
  codMaxOrder: Paise;
  lowStockThreshold: number;
  announcement: string | null;
  zones: Record<ZoneId, ZoneRate>;
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    gstin: string;
  };
}

export type Role = "customer" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
}

export interface CustomerSummary {
  key: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: Paise;
  lastOrderAt: string | null;
  joinedAt: string | null;
  isRegistered: boolean;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
}

/** Minimal product shape used by client islands (search, cart suggestions). */
export interface ProductLite {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  categoryId: CategoryId;
  image: string;
  palette: ProductPalette;
  fromPrice: Paise;
  keyIngredients: string[];
  inStock: boolean;
}
