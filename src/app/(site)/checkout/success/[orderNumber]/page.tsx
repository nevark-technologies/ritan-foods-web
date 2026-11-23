import { CheckCircle2, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessConfetti } from "@/components/checkout/SuccessConfetti";
import { PageTransition } from "@/components/motion/PageTransition";
import { OrderSummaryCard } from "@/components/orders/OrderSummaryCard";
import { ButtonLink } from "@/components/ui/Button";
import { getSessionUser } from "@/lib/auth";
import { verifyOrderToken } from "@/lib/commerce/order-token";
import { store } from "@/lib/data";
import type { SpriteId } from "@/lib/data/types";
import { formatINR, whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default function SuccessPage(props: PageProps<"/checkout/success/[orderNumber]">) {
  return (
    <PageTransition>
      <section className="min-h-[85vh] bg-cream-50 pb-28 pt-[calc(var(--header-h)+4rem)]">
        <div className="container-x max-w-4xl">
          <Suspense fallback={<div className="skeleton h-96 rounded-[2rem]" />}>
            <SuccessContent {...props} />
          </Suspense>
        </div>
      </section>
    </PageTransition>
  );
}

async function SuccessContent({ params, searchParams }: PageProps<"/checkout/success/[orderNumber]">) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : null;
  const number = decodeURIComponent(orderNumber);
  const order = await store.getOrderByNumber(number);
  const user = order ? await getSessionUser() : null;
  const allowed = Boolean(order && (verifyOrderToken(number, token) || (user && (user.id === order.userId || user.email === order.email))));

  if (!order || !allowed) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-16 text-leaf-500" />
        <h1 className="mt-6 font-display text-display-md text-forest-900">Thank you for your order</h1>
        <p className="mt-3 text-ink-700">Your confirmation and order details are in your email. You can also track your order any time.</p>
        <ButtonLink href="/track-order" className="mt-8">
          Track an order
        </ButtonLink>
      </div>
    );
  }

  const settings = await store.getSettings();
  const products = await store.listProducts({ includeInactive: true });
  const sprites = [...new Set(order.items.flatMap((i) => products.find((p) => p.id === i.productId)?.sprites ?? []))].slice(0, 4) as SpriteId[];
  const eta = order.shippingZone ? settings.zones[order.shippingZone]?.eta : null;
  const firstName = order.customerName.split(" ")[0];

  return (
    <>
      <SuccessConfetti sprites={sprites} />
      <div className="text-center">
        <span className="hero-pack mx-auto grid size-20 place-items-center rounded-full bg-leaf-500 text-cream-50 shadow-[0_20px_40px_-16px_rgba(78,143,47,0.8)]">
          <CheckCircle2 className="size-10" />
        </span>
        <p className="eyebrow mt-8 text-leaf-600">Order {order.status === "pending" ? "received" : "confirmed"}</p>
        <h1 className="mt-3 font-display text-display-lg text-forest-900">
          Thank you, <em className="display-italic text-leaf-500">{firstName}!</em>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-ink-700">
          Order <strong className="tabular text-forest-900">{order.orderNumber}</strong> is with our kitchen. We&apos;ve sent a confirmation to <strong>{order.email}</strong>
          {eta ? `, and it should reach you in ${eta} after dispatch` : ""}.
        </p>
        {order.paymentMethod === "cod" && <p className="mt-3 text-sm font-semibold text-clay-600">Cash on delivery · please keep {formatINR(order.total)} ready.</p>}
      </div>
      <div className="mt-12">
        <OrderSummaryCard order={order} />
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/track-order?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`}>Track this order</ButtonLink>
        <ButtonLink href="/shop" variant="outline">
          Continue shopping
        </ButtonLink>
        <a
          href={whatsappLink(settings.contact.whatsapp, `Hi Ritan Foods! About my order ${order.orderNumber}`)}
          target="_blank"
          rel="noopener"
          className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-forest-800 hover:bg-forest-900/5"
        >
          <MessageCircle className="size-4" /> WhatsApp us
        </a>
      </div>
    </>
  );
}
