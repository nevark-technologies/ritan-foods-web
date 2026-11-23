import type { MetadataRoute } from "next";
import { POLICIES } from "@/lib/content/policies";
import { getCatalog } from "@/lib/data/queries";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getCatalog();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/our-story`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    ...["podis", "rice-mixes", "health-mixes", "wellness"].map((c) => ({ url: `${base}/shop?category=${c}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
  return [
    ...pages,
    ...products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: [`${base}${p.image}`],
    })),
    ...POLICIES.map((p) => ({ url: `${base}/policies/${p.slug}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
