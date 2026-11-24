import { ChevronDown, ChevronRight, Leaf, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { Reveal } from "@/components/motion/Reveal";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductReviews } from "@/components/product/ProductReviews";
import { Stars } from "@/components/product/Stars";
import { buildSeedProducts } from "@/lib/data/catalog";
import { getCatalog, getCategories, getProduct, getProductReviews, getStoreSettings } from "@/lib/data/queries";
import { siteUrl } from "@/lib/site";
import { readableOn } from "@/lib/utils";

export async function generateStaticParams() {
  return buildSeedProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.name} - ${p.tagline}`,
    description: p.summary,
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title: `${p.name} · Ritan Foods`, description: p.summary, images: [{ url: p.image, width: p.imageWidth, height: p.imageHeight, alt: p.name }] },
  };
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <PageTransition>
      <Suspense fallback={<PdpSkeleton />}>
        <ProductContent {...props} />
      </Suspense>
    </PageTransition>
  );
}

function PdpSkeleton() {
  return (
    <section className="bg-cream-50 pb-24 pt-[calc(var(--header-h)+6rem)]">
      <div className="container-x grid gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-16">
        <div className="skeleton aspect-[5/6] rounded-[2.25rem]" />
        <div className="space-y-5">
          <div className="skeleton h-4 w-40 rounded-full" />
          <div className="skeleton h-16 w-3/4 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-12 rounded-full" />
          <div className="skeleton h-14 rounded-full" />
        </div>
      </div>
    </section>
  );
}

async function ProductContent({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, catalog, categories, settings] = await Promise.all([getProduct(slug), getCatalog(), getCategories(), getStoreSettings()]);
  if (!product) notFound();
  const reviews = await getProductReviews(product.id);
  const category = categories.find((c) => c.id === product.categoryId);
  const related = [...catalog.filter((p) => p.id !== product.id && p.categoryId === product.categoryId), ...catalog.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId && p.featured)].slice(0, 4);
  const active = product.variants.filter((v) => v.isActive);
  const prices = active.map((v) => v.price / 100);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.summary,
    image: `${siteUrl()}${product.image}`,
    brand: { "@type": "Brand", name: "Ritan Foods" },
    category: category?.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: active.length,
      availability: active.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(reviews.length && !reviews.some((r) => r.isDemo)
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1), reviewCount: reviews.length } }
      : {}),
  };

  const details = [
    { title: "The story", body: <p>{product.description}</p>, open: true },
    { title: "How to enjoy", body: <p>{product.howToUse}</p> },
    ...(product.ingredients ? [{ title: "Ingredients", body: <p>{product.ingredients}</p> }] : []),
    { title: "Storage", body: <p>Store in a cool, dry place away from sunlight. Always use a clean, dry spoon and close the pack tightly after use.</p> },
    {
      title: "Shipping & returns",
      body: (
        <p>
          Delivered across India in 3–5 days with DTDC or India Post. Free shipping on orders above ₹{settings.freeShippingThreshold / 100}. If your order arrives damaged, tell us within
          48 hours for a replacement or refund - see our{" "}
          <Link href="/policies/refund-returns" className="font-semibold underline underline-offset-4">
            returns policy
          </Link>
          .
        </p>
      ),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-cream-50 pb-24 pt-[calc(var(--header-h)+2.5rem)] lg:pt-[calc(var(--header-h)+3.5rem)]">
        <div className="container-x">
          <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-ink-500">
            <Link href="/" className="hover:text-forest-800">
              Home
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href="/shop" className="hover:text-forest-800">
              Shop
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/shop?category=${product.categoryId}`} className="hover:text-forest-800">
              {category?.name}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span aria-current="page" className="text-forest-900">
              {product.name}
            </span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[1.08fr_1fr] lg:gap-16 xl:gap-24">
            <Suspense fallback={null}>
              <ProductGallery product={product} />
            </Suspense>

            <div>
              <p className="eyebrow" style={{ color: readableOn(product.palette.accent, "#fbf7ee", product.palette.ink) }}>
                {category?.name} · {product.tagline}
              </p>
              <h1 className="mt-4 font-display text-display-lg text-forest-900">{product.name}</h1>
              {product.altName && <p className="mt-2 font-display text-xl italic text-ink-500">{product.altName}</p>}
              {product.ratingCount > 0 && (
                <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-forest-800">
                  <Stars value={product.ratingAvg} size="md" />
                  <span className="tabular">
                    {product.ratingAvg.toFixed(1)} · {product.ratingCount} {product.ratingCount === 1 ? "review" : "reviews"}
                  </span>
                </a>
              )}
              <p className="mt-6 text-body-lg text-ink-700">{product.summary}</p>
              {product.keyIngredients.length > 0 && (
                <div className="mt-6">
                  <p className="eyebrow text-ink-500">Made with</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {product.keyIngredients.map((k) => (
                      <li key={k} className="inline-flex items-center gap-1.5 rounded-full bg-sprout-100 px-3.5 py-1.5 text-sm font-semibold text-forest-800">
                        <Leaf className="size-3.5 text-leaf-500" /> {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-9 border-t border-forest-900/10 pt-8">
                <Suspense fallback={null}>
                  <BuyBox product={product} lowStock={settings.lowStockThreshold} />
                </Suspense>
              </div>
              <ul className="mt-8 grid gap-3 text-sm text-ink-700 sm:grid-cols-3">
                <li className="flex items-center gap-2">
                  <Truck className="size-4 text-leaf-500" /> 3–5 day delivery
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-leaf-500" /> Secure Razorpay checkout
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCcw className="size-4 text-leaf-500" /> Damaged? Replaced.
                </li>
              </ul>
              <div className="mt-10 divide-y divide-forest-900/10 border-y border-forest-900/10">
                {details.map((d) => (
                  <details key={d.title} open={d.open} className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-xl text-forest-900 [&::-webkit-details-marker]:hidden">
                      {d.title}
                      <ChevronDown className="size-5 text-forest-700 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="pb-5 leading-relaxed text-ink-700">{d.body}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cv-auto border-t border-forest-900/10 bg-cream-50 py-24">
        <div className="container-x">
          <Suspense fallback={null}>
            <ProductReviews product={product} reviews={reviews} />
          </Suspense>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="cv-auto bg-parchment-100 py-24 lg:py-32">
          <div className="container-x">
            <h2 id="related-title" className="font-display text-display-md text-forest-900">
              You might also <em className="display-italic text-leaf-500">love</em>
            </h2>
            <Suspense fallback={null}>
              <Reveal as="ul" className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8" stagger={0.07}>
                {related.map((p) => (
                  <li key={p.id} data-reveal-item>
                    <ProductCard product={p} />
                  </li>
                ))}
              </Reveal>
            </Suspense>
          </div>
        </section>
      )}
    </>
  );
}
