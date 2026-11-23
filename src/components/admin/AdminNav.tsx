"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_ICONS, ADMIN_NAV } from "./nav";

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-4">
      {ADMIN_NAV.map((item) => {
        const Icon = ADMIN_ICONS[item.icon];
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-cream-50 text-forest-900" : "text-cream-50/75 hover:bg-cream-50/10 hover:text-cream-50",
            )}
          >
            <Icon className="size-4" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
