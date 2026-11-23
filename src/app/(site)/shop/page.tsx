import type { Metadata } from "next";
import { Suspense, type ComponentProps } from "react";
import { LeafGlyph } from "@/components/home/MarqueeBand";
import { Marquee } from "@/components/motion/Marquee";
import { PageTransition } from "@/components/motion/PageTransition";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { getCatalog, getCategories } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Shop the pantry",
  description: "Shop Ritan Foods podis, rice mixes, sprouted millet health mix, ABC malt, Nendran banana malt and plant-based protein. 5 pack sizes, delivered across India.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const [products, categories] = await Promise.all([getCatalog(), getCategories()]);
  return (
    <PageTransition>
      <section className="relative overflow-hidden bg-cream-50 pb-10 pt-[calc(var(--header-h)+4.5rem)] lg:pt-[calc(var(--header-h)+6rem)]">
        <div aria-hidden inert className="pointer-events-none absolute inset-x-0 top-[calc(var(--header-h)+2rem)] opacity-[0.07]">
          <Marquee speed={30} skew={false}>
            {["Podis", "Rice mixes", "Health mixes", "Malts", "Wellness"].map((w) => (
              <span key={w} className="flex items-center gap-10 pr-10 font-display text-[16vw] italic leading-none text-forest-900">
                {w}
                <LeafGlyph className="h-[0.5em] w-auto" />
              </span>
            ))}
          </Marquee>
        </div>
        <div className="container-x relative">
          <p className="eyebrow text-leaf-600">Shop</p>
          <h1 className="mt-4 font-display text-display-xl text-forest-900">
            <span className="hero-line line-mask block" style={{ ["--i" as string]: 0 }}>
              <span>
                The Ritan <em className="display-italic text-leaf-500">pantry.</em>
              </span>
            </span>
          </h1>
          <p className="fade-up mt-6 max-w-xl text-body-lg text-ink-700" style={{ ["--d" as string]: "350ms" }}>
            Podis, rice mixes, health mixes and malts — each in five pack sizes from 100 g to 1 kg.
          </p>
        </div>
      </section>
      <Suspense fallback={<ShopSkeleton />}>
        <ShopResults searchParams={searchParams} products={products} categories={categories} />
      </Suspense>
    </PageTransition>
  );
}

/**
 * Awaiting the search params renders this boundary per request on the server,
 * so the filtered grid ships as real HTML (with the first pack images ready to
 * paint) instead of being built client-side after hydration.
 */
async function ShopResults({ searchParams, ...props }: { searchParams: PageProps<"/shop">["searchParams"] } & ComponentProps<typeof ShopBrowser>) {
  await searchParams;
  return <ShopBrowser {...props} />;
}

function ShopSkeleton() {
  return (
    <div className="container-x grid grid-cols-2 gap-6 pb-32 lg:grid-cols-[16rem_1fr]">
      <div className="hidden lg:block" />
      <div className="col-span-2 grid grid-cols-2 gap-6 lg:col-span-1 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/5] rounded-[2rem]" />
        ))}
      </div>
    </div>
  );
}
