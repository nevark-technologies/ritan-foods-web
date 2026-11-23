import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { PageTransition } from "@/components/motion/PageTransition";
import { getSessionUser } from "@/lib/auth";
import { razorpayConfigured } from "@/lib/commerce/razorpay";
import { isDemoMode, store } from "@/lib/data";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <PageTransition>
      <section className="min-h-[80vh] bg-cream-50 pb-28 pt-[calc(var(--header-h)+3.5rem)] lg:pt-[calc(var(--header-h)+5rem)]">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-display-lg text-forest-900">Checkout</h1>
            <p className="flex items-center gap-2 pb-2 text-sm text-ink-500">
              <Lock className="size-4 text-leaf-500" /> Secure checkout
            </p>
          </div>
          <div className="mt-10">
            <Suspense fallback={<div className="skeleton h-[36rem] rounded-[2rem]" />}>
              <CheckoutLoader />
            </Suspense>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}

async function CheckoutLoader() {
  const user = await getSessionUser();
  const addresses = user ? await store.listAddresses(user.id) : [];
  const razorpayEnabled = razorpayConfigured();
  // Online payment needs Razorpay keys (demo mode simulates the gateway instead).
  return <CheckoutFlow user={user} addresses={addresses} razorpayEnabled={razorpayEnabled} onlinePayments={razorpayEnabled || isDemoMode} />;
}
