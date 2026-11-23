import { AdminHeader } from "@/components/admin/AdminShell";
import { InventoryForm } from "@/components/admin/InventoryForm";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";

export const metadata = { title: "Inventory" };

export default async function AdminInventory() {
  await requireAdmin();
  const [products, settings] = await Promise.all([store.listProducts({ includeInactive: true }), store.getSettings()]);
  const sizes = products.flatMap((p) => p.variants.filter((v) => v.isActive));
  return (
    <>
      <AdminHeader title="Inventory" subtitle={`${sizes.length} pack sizes · ${sizes.filter((v) => v.stock === 0).length} out of stock · ${sizes.filter((v) => v.stock > 0 && v.stock <= settings.lowStockThreshold).length} low`} />
      <InventoryForm products={products} lowStock={settings.lowStockThreshold} />
    </>
  );
}
