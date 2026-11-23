import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountFrame, AccountShell } from "@/components/account/AccountShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { STATUS_LABEL } from "@/components/orders/OrderTimeline";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <PageTransition>
      <AccountFrame>
        <div className="container-x">
          <Suspense fallback={<div className="skeleton h-96 rounded-[2rem]" />}>
            <Orders />
          </Suspense>
        </div>
      </AccountFrame>
    </PageTransition>
  );
}

async function Orders() {
  const user = await requireUser("/account/orders");
  const orders = (await store.listOrders({ email: user.email })).filter((o) => o.status !== "pending");
  return (
    <AccountShell user={user} active="/account/orders" title="Your orders">
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-forest-900/20 p-10 text-center text-ink-500">
          You haven&apos;t placed any orders yet.{" "}
          <Link href="/shop" className="font-semibold text-forest-800 underline">
            Browse the pantry
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${encodeURIComponent(o.orderNumber)}`} className="block rounded-[1.75rem] border border-forest-900/10 p-6 transition-colors hover:bg-parchment-100/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="tabular font-semibold text-forest-900">{o.orderNumber}</span>
                  <span className="rounded-full bg-sprout-100 px-3 py-1 text-xs font-bold text-forest-800">{STATUS_LABEL[o.status]}</span>
                </div>
                <p className="mt-2 text-sm text-ink-500">
                  {formatDate(o.createdAt)} · {o.items.map((i) => i.productName).join(", ")}
                </p>
                <p className="tabular mt-3 font-display text-2xl text-forest-900">{formatINR(o.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
