"use client";

import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { ProductLite } from "@/lib/data/types";
import { useUI } from "@/lib/store/ui";
import { formatINR, slugLabel } from "@/lib/utils";

const CATEGORY_LABEL: Record<string, string> = {
  podis: "Podi",
  "rice-mixes": "Rice mix",
  "health-mixes": "Health mix",
  wellness: "Wellness",
};

/** Lightweight fuzzy score: prefix > word-start > substring > subsequence. */
function score(q: string, p: ProductLite) {
  const hay = `${p.name} ${p.tagline} ${p.keyIngredients.join(" ")} ${CATEGORY_LABEL[p.categoryId] ?? slugLabel(p.categoryId)}`.toLowerCase();
  const name = p.name.toLowerCase();
  if (name.startsWith(q)) return 100;
  if (name.split(/\s+/).some((w) => w.startsWith(q))) return 80;
  if (hay.includes(q)) return 60;
  let i = 0;
  for (const ch of hay) if (ch === q[i]) i++;
  return i === q.length ? 20 : 0;
}

export function SearchPalette({ products }: { products: ProductLite[] }) {
  const open = useUI((s) => s.searchOpen);
  const setSearch = useUI((s) => s.setSearch);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products.slice(0, 6);
    return products
      .map((p) => ({ p, s: score(query, p) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.p)
      .slice(0, 8);
  }, [q, products]);

  const close = () => {
    setSearch(false);
    setQ("");
    setActive(0);
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <Sheet open={open} onClose={close} side="center" label="Search products" className="p-0">
      <div className="flex items-center gap-3 border-b border-forest-900/10 px-5">
        <Search className="size-5 text-forest-700" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const hit = results[active];
              go(hit ? `/products/${hit.slug}` : `/shop?q=${encodeURIComponent(q)}`);
            }
          }}
          placeholder="Search idli podi, millet, malt…"
          aria-label="Search products"
          role="combobox"
          aria-expanded="true"
          aria-controls="search-results"
          aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
          className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-500"
        />
        <kbd className="rounded-md border border-forest-900/15 px-2 py-1 text-[0.7rem] font-semibold text-ink-500">Esc</kbd>
      </div>
      <ul id="search-results" role="listbox" aria-label="Results" className="max-h-[60dvh] overflow-y-auto p-2">
        {results.length === 0 && <li className="px-4 py-10 text-center text-ink-500">No matches for “{q}”. Try “podi” or “millet”.</li>}
        {results.map((p, i) => (
          <li key={p.id} id={`sr-${p.id}`} role="option" aria-selected={i === active}>
            <button
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => go(`/products/${p.slug}`)}
              className="flex w-full items-center gap-4 rounded-2xl p-2.5 text-left transition-colors aria-selected:bg-sprout-100 data-[active=true]:bg-sprout-100"
              data-active={i === active}
            >
              <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: p.palette.bg }}>
                <Image src={p.image} alt="" width={64} height={64} sizes="64px" className="h-14 w-auto object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight text-forest-900">{p.name}</span>
                <span className="block truncate text-sm text-ink-500">
                  {CATEGORY_LABEL[p.categoryId] ?? slugLabel(p.categoryId)} · {p.tagline}
                </span>
              </span>
              <span className="tabular text-sm font-semibold text-forest-800">from {formatINR(p.fromPrice)}</span>
              {i === active && <CornerDownLeft className="size-4 text-ink-300" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => go(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop")}
        className="flex items-center justify-between border-t border-forest-900/10 px-6 py-4 text-sm font-semibold text-forest-800 hover:bg-sprout-100"
      >
        {q ? `See all results for “${q}”` : "Browse the full pantry"}
        <ArrowRight className="size-4" />
      </button>
    </Sheet>
  );
}
