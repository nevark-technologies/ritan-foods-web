import { PackageSearch } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { OrderSummaryCard } from "@/components/orders/OrderSummaryCard";
import { OrderTimeline, STATUS_LABEL } from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { store } from "@/lib/data";
import { trackingUrl } from "@/lib/email/templates";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Track your order", description: "Check the status of your Ritan Foods order with your order number and email." };

export default function TrackOrderPage(props: PageProps<"/track-order">) {
  return (
    <PageTransition>
      <section className="min-h-[80vh] bg-cream-50 pb-28 pt-[calc(var(--header-h)+4rem)] lg:pt-[calc(var(--header-h)+5.5rem)]">
        <div className="container-x max-w-4xl">
          <PackageSearch className="size-10 text-leaf-500" />
          <h1 className="mt-5 font-display text-display-lg text-forest-900">
            Track your <em className="display-italic text-leaf-500">order</em>
          </h1>
          <p className="mt-3 text-body-lg text-ink-700">Enter your order number and the email you used at checkout.</p>
          <Suspense fallback={<div className="skeleton mt-10 h-48 rounded-[2rem]" />}>
            <Tracker {...props} />
          </Suspense>
        </div>
      </section>
    </PageTransition>
  );
}

async function Tracker({ searchParams }: PageProps<"/track-order">) {
  const sp = await searchParams;
  const orderNumber = typeof sp.order === "string" ? sp.order.trim().toUpperCase() : "";
  const email = typeof sp.email === "string" ? sp.email.trim().toLowerCase() : "";
  const order = orderNumber && email ? await store.getOrderByNumber(orderNumber) : null;
  const match = order && order.email.toLowerCase() === email ? order : null;
  const link = match ? trackingUrl(match.courier, match.trackingNumber) : null;

  return (
    <>
      <form action="/track-order" className="mt-10 grid gap-4 rounded-[2rem] border border-forest-900/10 bg-parchment-100/60 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Order number" htmlFor="t-order">
          <Input id="t-order" name="order" defaultValue={orderNumber} placeholder="RF-2611-XXXXX" required className="uppercase" />
        </Field>
        <Field label="Email" htmlFor="t-email">
          <Input id="t-email" name="email" type="email" defaultValue={email} required autoComplete="email" />
        </Field>
        <Button type="submit" className="h-12">
          Track
        </Button>
      </form>

      {orderNumber && email && !match && (
        <p className="mt-6 rounded-2xl bg-turmeric-500/10 p-4 text-sm font-semibold text-clay-600" role="alert">
          We couldn&apos;t find an order with those details. Check the order number in your confirmation email.
        </p>
      )}

      {match && (
        <div className="mt-12 grid select-text gap-10 lg:grid-cols-[18rem_1fr]">
          <div>
            <p className="eyebrow text-ink-500">Order {match.orderNumber}</p>
            <p className="mt-2 font-display text-3xl text-forest-900">{STATUS_LABEL[match.status]}</p>
            <p className="mt-1 text-sm text-ink-500">Placed {formatDate(match.createdAt)}</p>
            <div className="mt-8">
              <OrderTimeline order={match} />
            </div>
            {link && (
              <a href={link} target="_blank" rel="noopener" className="mt-6 inline-flex text-sm font-semibold text-forest-800 underline underline-offset-4">
                Track with {match.courier} →
              </a>
            )}
          </div>
          <OrderSummaryCard order={match} showAddress={false} />
        </div>
      )}
    </>
  );
}
