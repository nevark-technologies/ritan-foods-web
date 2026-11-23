import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { PageTransition } from "@/components/motion/PageTransition";
import { getCatalogLite } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default async function CartPage() {
  const catalog = await getCatalogLite();
  return (
    <PageTransition>
      <section className="min-h-[70vh] bg-cream-50 pb-28 pt-[calc(var(--header-h)+4rem)] lg:pt-[calc(var(--header-h)+5.5rem)]">
        <div className="container-x">
          <h1 className="font-display text-display-lg text-forest-900">
            Your <em className="display-italic text-leaf-500">bag</em>
          </h1>
          <div className="mt-10">
            <CartView suggestions={catalog.filter((p) => p.inStock)} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
