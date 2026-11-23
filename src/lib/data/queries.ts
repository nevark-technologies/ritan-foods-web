import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { showDemoContent, store } from ".";
import type { Product, ProductLite, Review } from "./types";

/** Cached catalogue reads. Mutations call updateTag/revalidateTag("catalog"). */

export async function getCatalog(): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  return store.listProducts();
}

export async function getProduct(slug: string): Promise<Product | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", `product:${slug}`);
  return store.getProductBySlug(slug);
}

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return store.listCategories();
}

export async function getStoreSettings() {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  return store.getSettings();
}

export async function getProductReviews(productId: string): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews");
  return store.listReviews({ productId, approvedOnly: true, includeDemo: showDemoContent });
}

export async function getHighlightReviews(limit = 8): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews");
  const all = await store.listReviews({ approvedOnly: true, includeDemo: showDemoContent });
  return all.filter((r) => r.rating >= 4).slice(0, limit);
}

export function toLite(p: Product): ProductLite {
  const active = p.variants.filter((v) => v.isActive);
  const prices = active.map((v) => v.price);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    categoryId: p.categoryId,
    image: p.image,
    palette: p.palette,
    fromPrice: prices.length ? Math.min(...prices) : 0,
    keyIngredients: p.keyIngredients,
    inStock: active.some((v) => v.stock > 0),
  };
}

export async function getCatalogLite(): Promise<ProductLite[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog");
  const products = await store.listProducts();
  return products.map(toLite);
}
