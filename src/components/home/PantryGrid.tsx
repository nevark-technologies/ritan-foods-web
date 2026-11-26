"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { Suspense, useMemo, useState } from "react";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import type { Category, CategoryId, Product } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

/** Category tabs with a sliding pill; cards re-flow with FLIP layout springs. */
export function PantryGrid({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [tab, setTab] = useState<CategoryId | "all">("all");
  const tabs = [{ id: "all" as const, name: "All" }, ...categories];
  const shown = useMemo(() => {
    const list = tab === "all" ? [...products].sort((a, b) => Number(b.featured) - Number(a.featured) || a.sort - b.sort) : products.filter((p) => p.categoryId === tab);
    return list.slice(0, 8);
  }, [tab, products]);

  return (
    <section aria-labelledby="pantry-title" className="relative bg-cream-50 py-28 lg:py-40">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow text-leaf-600">The Ritan pantry</p>
            <SplitReveal as="h2" className="mt-4 max-w-3xl font-display text-display-lg text-forest-900">
              Countless recipes, one <em className="display-italic text-leaf-500">kitchen.</em>
            </SplitReveal>
          </div>
          <LayoutGroup id="pantry-tabs">
            <div role="tablist" aria-label="Filter by category" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:px-0">
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", active ? "text-cream-50" : "text-forest-800 hover:text-forest-950")}
                  >
                    {active && <m.span layoutId="pantry-pill" className="absolute inset-0 -z-0 rounded-full bg-forest-800" transition={spring.snappy} />}
                    <span className="relative">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>

        <m.ul layout className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((p, i) => (
              <m.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
                transition={{ ...spring.soft, delay: i * 0.03 }}
              >
                <Suspense fallback={null}>
                  <ProductCard product={p} />
                </Suspense>
              </m.li>
            ))}
          </AnimatePresence>
        </m.ul>

        <div className="mt-16 flex justify-center">
          <ButtonLink href={tab === "all" ? "/shop" : `/shop?category=${tab}`} variant="outline" size="lg">
            Shop the full pantry <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
