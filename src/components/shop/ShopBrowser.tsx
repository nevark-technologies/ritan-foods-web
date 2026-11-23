"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { Category, CategoryId, Product } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { cn, formatWeight } from "@/lib/utils";

const SIZES = [100, 200, 300, 500, 1000];
const PRICES = [
  { id: "0-100", label: "Under ₹100", min: 0, max: 10000 },
  { id: "100-250", label: "₹100 – ₹250", min: 10000, max: 25000 },
  { id: "250-500", label: "₹250 – ₹500", min: 25000, max: 50000 },
  { id: "500-", label: "₹500 and above", min: 50000, max: Infinity },
];
const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
  { id: "name", label: "Name A–Z" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

interface Filters {
  category: CategoryId | "all";
  sizes: number[];
  price: string | null;
  inStock: boolean;
  sort: SortId;
  q: string;
}

function readFilters(sp: URLSearchParams): Filters {
  const sort = sp.get("sort") as SortId | null;
  return {
    category: (sp.get("category") as CategoryId) || "all",
    sizes: (sp.get("size") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => SIZES.includes(n)),
    price: PRICES.some((p) => p.id === sp.get("price")) ? sp.get("price") : null,
    inStock: sp.get("stock") === "1",
    sort: SORTS.some((s) => s.id === sort) ? sort! : "featured",
    q: sp.get("q") ?? "",
  };
}

function toQuery(f: Filters) {
  const sp = new URLSearchParams();
  if (f.category !== "all") sp.set("category", f.category);
  if (f.sizes.length) sp.set("size", f.sizes.join(","));
  if (f.price) sp.set("price", f.price);
  if (f.inStock) sp.set("stock", "1");
  if (f.sort !== "featured") sp.set("sort", f.sort);
  if (f.q.trim()) sp.set("q", f.q.trim());
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const minPrice = (p: Product) => Math.min(...p.variants.filter((v) => v.isActive).map((v) => v.price));

export function ShopBrowser({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const filters = readFilters(new URLSearchParams(sp.toString()));
  const [q, setQ] = useState(filters.q);

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, q, ...patch };
    startTransition(() => router.replace(`${pathname}${toQuery(next)}`, { scroll: false }));
  };

  const results = (() => {
    const query = filters.q.trim().toLowerCase();
    const range = PRICES.find((p) => p.id === filters.price);
    const list = products.filter((p) => {
      if (filters.category !== "all" && p.categoryId !== filters.category) return false;
      const variants = p.variants.filter((v) => v.isActive && (!filters.inStock || v.stock > 0));
      if (!variants.length) return false;
      if (filters.sizes.length && !variants.some((v) => filters.sizes.includes(v.weightG))) return false;
      if (range && !variants.some((v) => v.price >= range.min && v.price < range.max)) return false;
      if (query) {
        const hay = `${p.name} ${p.altName ?? ""} ${p.tagline} ${p.summary} ${p.keyIngredients.join(" ")}`.toLowerCase();
        if (!query.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const sorted = [...list];
    switch (filters.sort) {
      case "price-asc":
        sorted.sort((a, b) => minPrice(a) - minPrice(b));
        break;
      case "price-desc":
        sorted.sort((a, b) => minPrice(b) - minPrice(a));
        break;
      case "rating":
        sorted.sort((a, b) => b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort);
    }
    return sorted;
  })();

  const activeCount = (filters.category !== "all" ? 1 : 0) + filters.sizes.length + (filters.price ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.q ? 1 : 0);

  const panel = (scope: string) => (
    <div className="space-y-9">
      <fieldset>
        <legend className="eyebrow text-ink-500">Category</legend>
        <LayoutGroup id={`cat-filter-${scope}`}>
          <div className="mt-4 flex flex-wrap gap-2 lg:flex-col lg:items-start">
            {[{ id: "all" as const, name: "All products" }, ...categories].map((c) => {
              const on = filters.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update({ category: c.id })}
                  className={cn("relative rounded-full px-4 py-2 text-sm font-semibold transition-colors", on ? "text-cream-50" : "text-forest-800 hover:bg-forest-900/5")}
                >
                  {on && <m.span layoutId={`cat-pill-${scope}`} className="absolute inset-0 rounded-full bg-forest-800" transition={spring.snappy} />}
                  <span className="relative">{c.name}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </fieldset>
      <fieldset>
        <legend className="eyebrow text-ink-500">Pack size</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const on = filters.sizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => update({ sizes: on ? filters.sizes.filter((x) => x !== s) : [...filters.sizes, s] })}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors", on ? "border-forest-800 bg-forest-800 text-cream-50" : "border-forest-900/15 text-forest-800 hover:border-forest-800")}
              >
                {formatWeight(s)}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow text-ink-500">Price</legend>
        <div className="mt-4 space-y-2">
          {PRICES.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-3 text-sm text-ink-700">
              <input
                type="radio"
                name={`price-${scope}`}
                checked={filters.price === p.id}
                onChange={() => update({ price: p.id })}
                onClick={() => filters.price === p.id && update({ price: null })}
                className="size-4 accent-forest-700"
              />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-forest-900">
        In stock only
        <input type="checkbox" role="switch" checked={filters.inStock} onChange={(e) => update({ inStock: e.target.checked })} className="peer sr-only" />
        <span aria-hidden className="relative h-6 w-11 rounded-full bg-forest-900/15 transition-colors peer-checked:bg-leaf-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-leaf-500">
          <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-cream-50 shadow transition-transform duration-300", filters.inStock && "translate-x-5")} />
        </span>
      </label>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
          className="text-sm font-semibold text-chilli-600 underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <section aria-label="Products" className="bg-cream-50 pb-32">
      <div className="container-x grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{panel("side")}</div>
        </aside>

        <div>
          <div className="-mx-[var(--gutter)] mb-8 flex flex-wrap items-center gap-3 bg-cream-50/90 px-[var(--gutter)] py-3 md:sticky md:top-[5.25rem] md:z-20 md:backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                update({ q });
              }}
              className="relative min-w-0 basis-full sm:basis-auto sm:flex-1"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onBlur={() => q !== filters.q && update({ q })}
                placeholder="Search podi, millet, malt…"
                aria-label="Search products"
                className="h-12 w-full rounded-full border border-forest-900/15 bg-cream-50 pl-11 pr-10 text-sm outline-none focus:border-forest-700"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    update({ q: "" });
                  }}
                  className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full hover:bg-forest-900/5"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </form>
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortId })}
              className="h-12 min-w-0 flex-1 rounded-full border border-forest-900/15 bg-cream-50 px-4 text-sm font-semibold text-forest-800 outline-none focus:border-forest-700 sm:flex-none"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" size="sm" className="h-12 lg:hidden" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal className="size-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
            <p className="tabular w-full text-sm text-ink-500 lg:w-auto lg:pl-2" aria-live="polite">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
          </div>

          <h2 className="sr-only">Products</h2>
          {results.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-forest-900/20 px-6 py-20 text-center">
              <p className="font-display text-3xl text-forest-900">Nothing matches just yet</p>
              <p className="mt-2 text-ink-500">Try fewer filters or a different word.</p>
              <Button
                type="button"
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setQ("");
                  startTransition(() => router.replace(pathname, { scroll: false }));
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <m.ul layout className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3 xl:gap-x-8 xl:gap-y-14">
              <AnimatePresence mode="popLayout" initial={false}>
                {results.map((p, i) => (
                  <m.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                    transition={{ ...spring.soft, delay: Math.min(i, 8) * 0.025 }}
                  >
                    {/* Each card hydrates as its own (idle, time-sliced) unit */}
                    <Suspense fallback={null}>
                      <ProductCard product={p} priority={i < 3} />
                    </Suspense>
                  </m.li>
                ))}
              </AnimatePresence>
            </m.ul>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} side="left" label="Filters">
        <div className="flex items-center justify-between border-b border-forest-900/10 px-6 py-5">
          <h2 className="font-display text-2xl text-forest-900">Filters</h2>
          <button type="button" onClick={() => setSheetOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-forest-900/5" aria-label="Close filters">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 px-6 py-8">{panel("sheet")}</div>
        <div className="sticky bottom-0 border-t border-forest-900/10 bg-cream-50 p-5">
          <Button type="button" className="w-full" onClick={() => setSheetOpen(false)}>
            Show {results.length} {results.length === 1 ? "product" : "products"}
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
