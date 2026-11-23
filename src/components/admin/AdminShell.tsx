import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOutAction } from "@/app/(site)/account/actions";
import type { SessionUser } from "@/lib/data/types";
import { AdminNav } from "./AdminNav";


export function AdminShell({ user, demo, children }: { user: SessionUser; demo: boolean; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4efe3] text-ink-900 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="no-print border-b border-forest-900/10 bg-forest-900 text-cream-50 lg:sticky lg:top-0 lg:h-screen lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5 lg:px-6 lg:py-7">
          <Image src="/images/brand/logo.webp" alt="" width={968} height={714} sizes="56px" className="h-11 w-auto" />
          <div>
            <p className="font-display text-xl leading-none">Ritan Foods</p>
            <p className="mt-1 text-xs text-sprout-300">Admin</p>
          </div>
        </div>
        <AdminNav />
        <div className="hidden border-t border-cream-50/10 px-6 py-5 text-sm lg:block">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-xs text-cream-50/60">{user.email}</p>
          <div className="mt-4 flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-sprout-300" target="_blank">
              View store <ExternalLink className="size-3" />
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-xs font-semibold text-cream-50/70 hover:text-cream-50">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        {demo && (
          <p className="no-print bg-turmeric-500/20 px-6 py-2.5 text-center text-xs font-semibold text-clay-600">
            Demo mode — data lives in memory and resets when the server restarts. Connect Supabase to make it permanent.
          </p>
        )}
        <main className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</main>
      </div>
    </div>
  );
}

export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl text-forest-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-forest-900/10 bg-cream-50 p-6 ${className}`}>{children}</div>;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-ink-300/20 text-ink-700",
  confirmed: "bg-turmeric-500/20 text-clay-600",
  packed: "bg-sprout-200 text-forest-800",
  shipped: "bg-leaf-500/20 text-forest-800",
  delivered: "bg-forest-700 text-cream-50",
  cancelled: "bg-chilli-600/15 text-chilli-600",
  refunded: "bg-chilli-600/15 text-chilli-600",
  failed: "bg-chilli-600/15 text-chilli-600",
  paid: "bg-leaf-500/20 text-forest-800",
  cod: "bg-turmeric-500/20 text-clay-600",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[value] ?? "bg-parchment-200 text-ink-700"}`}>{label ?? value.replace("_", " ")}</span>;
}
