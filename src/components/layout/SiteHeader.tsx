"use client";

import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { useHydrated } from "@/components/layout/StoreHydrator";
import { header as headerTokens, squash } from "@/lib/motion/tokens";
import { cartCount, useCart } from "@/lib/store/cart";
import { useUI } from "@/lib/store/ui";
import { useWishlist } from "@/lib/store/wishlist";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/our-story", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {NAV.map((item) => {
        const active = pathname !== null && (pathname === item.href || pathname.startsWith(`${item.href}/`));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative rounded-full px-4 py-2 text-[0.92rem] font-semibold text-forest-800 transition-colors hover:text-forest-950", active && "text-forest-950")}
            >
              {item.label}
              {active && <m.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-leaf-500" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function SiteHeader({ announcement }: { announcement: string | null }) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const bumpKey = useCart((s) => s.bumpKey);
  const openDrawer = useCart((s) => s.openDrawer);
  const wishCount = useWishlist((s) => s.ids.length);
  const setSearch = useUI((s) => s.setSearch);
  const setMenu = useUI((s) => s.setMenu);
  const bagRef = useRef<HTMLButtonElement>(null);
  const count = hydrated ? cartCount(items) : 0;

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        setScrolled(y > 24);
        if (Math.abs(delta) > headerTokens.delta) {
          setHidden(delta > 0 && y > headerTokens.hideAfter);
          lastY.current = y;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!bumpKey) return;
    // Squash-and-stretch via the Web Animations API (native, compositor-friendly).
    const rotate = [0, -8, 6, -3, 0];
    bagRef.current?.animate(
      squash.bump.scaleX.map((sx, i) => ({ transform: `scale(${sx}, ${squash.bump.scaleY[i]}) rotate(${rotate[i]}deg)` })),
      { duration: 650, easing: "ease-out" },
    );
  }, [bumpKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearch]);

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
        hidden ? "-translate-y-full" : scrolled && announcement ? "-translate-y-9" : "translate-y-0",
      )}
    >
      {announcement && (
        <div className="flex h-9 items-center justify-center bg-forest-900 px-4 text-center text-[0.72rem] font-semibold tracking-[0.08em] text-sprout-200">
          <p className="truncate">
            <span>{announcement.split(" · ")[0]}</span>
            {announcement.includes(" · ") && <span className="hidden sm:inline"> · {announcement.split(" · ").slice(1).join(" · ")}</span>}
          </p>
        </div>
      )}
      <div className="container-x pt-3">
        <div
          className={cn(
            "grid h-[4.25rem] grid-cols-[1fr_auto_1fr] items-center rounded-full border px-3 transition-[background-color,border-color,box-shadow] duration-500 sm:px-5",
            scrolled
              ? "border-forest-900/10 bg-cream-50/85 shadow-[0_12px_40px_-24px_rgba(15,42,23,0.5)] backdrop-blur-md"
              : "border-transparent bg-cream-50/0",
          )}
        >
          <nav aria-label="Primary" className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenu(true)}
              className="grid size-11 place-items-center rounded-full text-forest-800 hover:bg-forest-900/5 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <Suspense fallback={<NavLinks pathname={null} />}>
              <ActiveNavLinks />
            </Suspense>
          </nav>

          <Link href="/" aria-label="Ritan Foods — home" className="mx-auto block">
            <Image src="/images/brand/logo.webp" alt="Ritan Foods" width={968} height={714} preload sizes="96px" className="h-12 w-auto sm:h-[3.4rem]" />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="group hidden h-11 items-center gap-2 rounded-full px-3 text-forest-800 hover:bg-forest-900/5 sm:flex"
              aria-keyshortcuts="Control+K"
            >
              <Search className="size-[1.15rem]" aria-hidden />
              <span className="sr-only">Search products</span>
              <kbd aria-hidden className="hidden rounded-md border border-forest-900/15 px-1.5 py-0.5 font-sans text-[0.65rem] font-semibold text-ink-500 xl:inline">Ctrl K</kbd>
            </button>
            <Link href="/account" className="hidden size-11 place-items-center rounded-full text-forest-800 hover:bg-forest-900/5 sm:grid" aria-label="Account">
              <User className="size-[1.15rem]" />
            </Link>
            <Link href="/wishlist" className="relative hidden size-11 place-items-center rounded-full text-forest-800 hover:bg-forest-900/5 sm:grid" aria-label={`Wishlist${hydrated && wishCount ? `, ${wishCount} items` : ""}`}>
              <Heart className="size-[1.15rem]" />
              {hydrated && wishCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-chilli-500" />}
            </Link>
            <Magnetic strength={0.25} innerStrength={0.1}>
              <button
                ref={bagRef}
                type="button"
                data-cart-target
                onClick={openDrawer}
                className="relative ml-1 flex h-11 items-center gap-2 rounded-full bg-forest-700 pl-3.5 pr-4 text-sm font-semibold text-cream-50 shadow-[0_8px_24px_-12px_rgba(15,42,23,0.7)]"
              >
                <ShoppingBag className="size-[1.1rem]" aria-hidden />
                {/* Visible text is part of the accessible name: "Bag, 2 items" */}
                <span className="sr-only sm:not-sr-only">Bag</span>
                <span aria-live="polite" className="tabular grid min-w-5 place-items-center rounded-full bg-cream-50 px-1.5 text-[0.72rem] font-bold text-forest-800">
                  <span aria-hidden>{count}</span>
                  <span className="sr-only">
                    , {count} {count === 1 ? "item" : "items"}
                  </span>
                </span>
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </header>
  );
}
