import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountFrame, AccountShell } from "@/components/account/AccountShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { OrderSummaryCard } from "@/components/orders/OrderSummaryCard";
import { OrderTimeline, STATUS_LABEL } from "@/components/orders/OrderTimeline";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/data";
import { trackingUrl } from "@/lib/email/templates";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default function OrderDetailPage(props: PageProps<"/account/orders/[orderNumber]">) {
  return (
    <PageTransition>
      <AccountFrame>
        <div className="container-x">
          <Suspense fallback={<div className="skeleton h-96 rounded-[2rem]" />}>
            <Detail {...props} />
          </Suspense>
        </div>
      </AccountFrame>
    </PageTransition>
  );
}

async function Detail({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await requireUser("/account/orders");
  const order = await store.getOrderByNumber(decodeURIComponent(orderNumber));
  if (!order || (order.userId !== user.id && order.email.toLowerCase() !== user.email.toLowerCase())) notFound();
  const link = trackingUrl(order.courier, order.trackingNumber);
  return (
    <AccountShell user={user} active="/account/orders" title={<span className="tabular">{order.orderNumber}</span>}>
      <div className="grid gap-10 xl:grid-cols-[17rem_1fr]">
        <div>
          <p className="font-display text-3xl text-forest-900">{STATUS_LABEL[order.status]}</p>
          <p className="text-sm text-ink-500">Placed {formatDate(order.createdAt)}</p>
          <div className="mt-8">
            <OrderTimeline order={order} />
          </div>
          {link && (
            <a href={link} target="_blank" rel="noopener" className="mt-6 inline-flex text-sm font-semibold text-forest-800 underline underline-offset-4">
              Track with {order.courier} →
            </a>
          )}
        </div>
        <OrderSummaryCard order={order} />
      </div>
    </AccountShell>
  );
}
