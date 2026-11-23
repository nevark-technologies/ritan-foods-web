import { LogOut, MapPin, Package, Shield, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/(site)/account/actions";
import type { SessionUser } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
];

export function AccountShell({ user, active, title, children }: { user: SessionUser; active: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
      <nav aria-label="Account" className="lg:sticky lg:top-32 lg:self-start">
        <p className="font-display text-2xl text-forest-900">Hello, {user.name.split(" ")[0]}</p>
        <p className="truncate text-sm text-ink-500">{user.email}</p>
        <ul className="mt-6 flex gap-1 overflow-x-auto lg:flex-col">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active === l.href ? "page" : undefined}
                className={cn("flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors", active === l.href ? "bg-forest-800 text-cream-50" : "text-forest-800 hover:bg-forest-900/5")}
              >
                <l.icon className="size-4" /> {l.label}
              </Link>
            </li>
          ))}
          {user.role === "admin" && (
            <li>
              <Link href="/admin" className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-gold-500 hover:bg-forest-900/5">
                <Shield className="size-4" /> Admin dashboard
              </Link>
            </li>
          )}
          <li>
            <form action={signOutAction}>
              <button type="submit" className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-ink-500 hover:bg-forest-900/5 hover:text-chilli-600">
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </li>
        </ul>
      </nav>
      <div>
        <h1 className="font-display text-display-md text-forest-900">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function AccountFrame({ children }: { children: ReactNode }) {
  return <section className="min-h-[80vh] bg-cream-50 pb-28 pt-[calc(var(--header-h)+4rem)] lg:pt-[calc(var(--header-h)+5.5rem)]">{children}</section>;
}
