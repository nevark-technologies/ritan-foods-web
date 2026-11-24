import { ArrowRight, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountFrame, AccountShell } from "@/components/account/AccountShell";
import { AuthPanel } from "@/components/account/AuthPanel";
import { PageTransition } from "@/components/motion/PageTransition";
import { STATUS_LABEL } from "@/components/orders/OrderTimeline";
import { getSessionUser } from "@/lib/auth";
import { isDemoMode, store } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function AccountPage(props: PageProps<"/account">) {
  return (
    <PageTransition>
      <AccountFrame>
        <div className="container-x">
          <Suspense fallback={<div className="skeleton mx-auto h-[32rem] max-w-md rounded-[2rem]" />}>
            <AccountGate {...props} />
          </Suspense>
        </div>
      </AccountFrame>
    </PageTransition>
  );
}

async function AccountGate({ searchParams }: PageProps<"/account">) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const next = typeof sp.next === "string" ? sp.next : "/account";

  if (!user) {
    return (
      <div>
        <div className="mx-auto mb-10 max-w-md text-center">
          <h1 className="font-display text-display-md text-forest-900">
            Welcome <em className="display-italic text-leaf-500">home.</em>
          </h1>
          <p className="mt-3 text-ink-700">Sign in to see your orders, saved addresses and wishlist.</p>
          {sp.denied === "1" && <p className="mt-3 text-sm font-semibold text-chilli-600">That area is for the Ritan Foods team only.</p>}
        </div>
        <AuthPanel next={next} demo={isDemoMode} />
      </div>
    );
  }

  const orders = await store.listOrders({ email: user.email, limit: 3 });
  return (
    <AccountShell user={user} active="/account" title="Your account">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] bg-parchment-100 p-7">
          <p className="eyebrow text-ink-500">Profile</p>
          <p className="mt-3 font-display text-2xl text-forest-900">{user.name}</p>
          <p className="text-ink-700">{user.email}</p>
          {user.phone && <p className="text-ink-700">{user.phone}</p>}
          <Link href="/account/profile" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-forest-800">
            Edit profile <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="rounded-[2rem] bg-forest-900 p-7 text-cream-50">
          <p className="eyebrow text-sprout-300">Need a hand?</p>
          <p className="mt-3 font-display text-2xl">We&apos;re a message away.</p>
          <p className="mt-1 text-sm text-cream-50/75">Questions about an order? Reach us on WhatsApp or the contact page.</p>
          <Link href="/contact" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-sprout-300">
            Contact us <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl text-forest-900">Recent orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-forest-800">
            View all →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-forest-900/20 p-8 text-center text-ink-500">
            <Package className="mx-auto mb-3 size-8 text-leaf-500" />
            No orders yet.{" "}
            <Link href="/shop" className="font-semibold text-forest-800 underline">
              Start with a family favourite
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-forest-900/10 rounded-[2rem] border border-forest-900/10">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${encodeURIComponent(o.orderNumber)}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 hover:bg-parchment-100/60">
                  <span>
                    <span className="tabular block select-text font-semibold text-forest-900">{o.orderNumber}</span>
                    <span className="text-sm text-ink-500">
                      {formatDate(o.createdAt)} · {o.itemsCount} {o.itemsCount === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span className="rounded-full bg-sprout-100 px-3 py-1 text-xs font-bold text-forest-800">{STATUS_LABEL[o.status]}</span>
                    <span className="tabular font-semibold">{formatINR(o.total)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountShell>
  );
}
