import { BarChart3, Boxes, LayoutDashboard, MessageSquare, Package, Settings, Star, Tag, Users } from "lucide-react";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/products", label: "Products", icon: "products" },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
  { href: "/admin/customers", label: "Customers", icon: "customers" },
  { href: "/admin/coupons", label: "Coupons", icon: "coupons" },
  { href: "/admin/reviews", label: "Reviews", icon: "reviews" },
  { href: "/admin/messages", label: "Messages", icon: "messages" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
] as const;

export const ADMIN_ICONS = { dashboard: LayoutDashboard, orders: Package, products: BarChart3, inventory: Boxes, customers: Users, coupons: Tag, reviews: Star, messages: MessageSquare, settings: Settings };
