"use client";

import { ArrowUpRight, MessageCircle, Phone, Search, X } from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { useUI } from "@/lib/store/ui";
import { whatsappLink } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=podis", label: "Podis" },
  { href: "/shop?category=health-mixes", label: "Health mixes" },
  { href: "/our-story", label: "Our story" },
  { href: "/contact", label: "Contact" },
  { href: "/track-order", label: "Track order" },
  { href: "/account", label: "Account" },
  { href: "/wishlist", label: "Wishlist" },
];

export function MobileMenu({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);
  const setSearch = useUI((s) => s.setSearch);

  return (
    <Sheet open={open} onClose={() => setMenu(false)} side="left" label="Menu" className="bg-forest-900 text-cream-50">
      <div className="flex items-center justify-between px-6 pt-6">
        <span className="eyebrow text-sprout-300">Ritan Foods</span>
        <button type="button" onClick={() => setMenu(false)} className="grid size-11 place-items-center rounded-full bg-cream-50/10" aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setSearch(true)}
        className="mx-6 mt-6 flex h-12 items-center gap-3 rounded-full border border-cream-50/15 px-5 text-left text-sm text-cream-50/70"
      >
        <Search className="size-4" /> Search podis, malts, mixes…
      </button>
      <nav aria-label="Mobile" className="flex-1 px-6 py-8">
        <ul className="space-y-1">
          {LINKS.map((l, i) => (
            <m.li key={l.href} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.045, type: "spring", stiffness: 260, damping: 26 }}>
              <Link href={l.href} onClick={() => setMenu(false)} className="group flex items-baseline justify-between border-b border-cream-50/10 py-3 font-display text-[2rem] leading-tight">
                {l.label}
                <ArrowUpRight className="size-5 text-sprout-300 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </m.li>
          ))}
        </ul>
      </nav>
      <div className="grid grid-cols-2 gap-3 px-6 pb-8">
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex h-12 items-center justify-center gap-2 rounded-full bg-cream-50/10 text-sm font-semibold">
          <Phone className="size-4" /> Call us
        </a>
        <a href={whatsappLink(whatsapp, "Hi Ritan Foods!")} target="_blank" rel="noopener" className="flex h-12 items-center justify-center gap-2 rounded-full bg-leaf-500 text-sm font-semibold text-forest-950">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
      </div>
    </Sheet>
  );
}
