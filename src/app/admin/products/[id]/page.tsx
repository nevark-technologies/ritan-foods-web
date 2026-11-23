import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const [products, categories] = await Promise.all([store.listProducts({ includeInactive: true }), store.listCategories()]);
  const isNew = id === "new";
  const product = isNew ? undefined : products.find((p) => p.id === decodeURIComponent(id));
  if (!isNew && !product) notFound();
  const images = [...new Set(products.map((p) => p.image))];
  return (
    <>
      <AdminHeader
        title={product ? product.name : "New product"}
        subtitle={sp.created ? "Created — it's live on the shop if marked Live." : product ? `/${product.slug}` : "Add a new product to the pantry"}
        actions={
          product && (
            <Link href={`/products/${product.slug}`} target="_blank" className="text-sm font-semibold text-forest-800 underline underline-offset-4">
              View on shop ↗
            </Link>
          )
        }
      />
      <ProductForm key={product?.id ?? "new"} product={product} categories={categories} images={images} />
    </>
  );
}
