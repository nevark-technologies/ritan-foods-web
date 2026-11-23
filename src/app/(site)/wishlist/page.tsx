import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/PageTransition";
import { WishlistView } from "@/components/shop/WishlistView";
import { getCatalog } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const products = await getCatalog();
  return (
    <PageTransition>
      <section className="min-h-[70vh] bg-cream-50 pb-28 pt-[calc(var(--header-h)+4rem)] lg:pt-[calc(var(--header-h)+5.5rem)]">
        <div className="container-x">
          <h1 className="font-display text-display-lg text-forest-900">
            Saved for <em className="display-italic text-leaf-500">later</em>
          </h1>
          <div className="mt-12">
            <WishlistView products={products} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
