import { BadgeCheck } from "lucide-react";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { store } from "@/lib/data";
import type { Product, Review } from "@/lib/data/types";
import { formatDate } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";
import { Stars } from "./Stars";

export function ProductReviews({ product, reviews }: { product: Product; reviews: Review[] }) {
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const demo = reviews.some((r) => r.isDemo);

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28">
      <div className="grid gap-12 lg:grid-cols-[22rem_1fr] lg:gap-20">
        <div>
          <h2 id="reviews-heading" className="font-display text-display-sm text-forest-900">
            Reviews
          </h2>
          {reviews.length > 0 ? (
            <div className="mt-6">
              <p className="flex items-end gap-3">
                <span className="tabular font-display text-6xl leading-none text-forest-900">{avg.toFixed(1)}</span>
                <span className="pb-1.5">
                  <Stars value={avg} size="md" />
                  <span className="mt-1 block text-sm text-ink-500">
                    {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                  </span>
                </span>
              </p>
              <ul className="mt-6 space-y-2" aria-label="Rating distribution">
                {counts.map(({ n, c }) => (
                  <li key={n} className="flex items-center gap-3 text-sm text-ink-500">
                    <span className="w-3 tabular">{n}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-forest-900/10">
                      <span className="block h-full origin-left rounded-full bg-turmeric-500" style={{ transform: `scaleX(${reviews.length ? c / reviews.length : 0})` }} />
                    </span>
                    <span className="w-6 text-right tabular">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-ink-500">No reviews yet - be the first to tell other families what you think.</p>
          )}
          <Suspense fallback={<div className="skeleton mt-8 h-12 rounded-full" />}>
            <ReviewComposer product={product} />
          </Suspense>
        </div>

        <ul className="divide-y divide-forest-900/10">
          {reviews.map((r) => (
            <li key={r.id} className="py-7 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Stars value={r.rating} size="md" />
                <span className="text-xs text-ink-500">{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <p className="mt-3 font-display text-2xl text-forest-900">{r.title}</p>}
              <p className="mt-2 leading-relaxed text-ink-700">{r.body}</p>
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-forest-900">{r.authorName}</span>
                {r.location && <span className="text-ink-500">{r.location}</span>}
                {r.verifiedPurchase && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-leaf-600">
                    <BadgeCheck className="size-3.5" /> Verified purchase
                  </span>
                )}
              </p>
            </li>
          ))}
          {demo && <li className="py-5 text-xs text-ink-500">Sample reviews shown in demo mode - replaced by verified customer reviews at launch.</li>}
        </ul>
      </div>
    </section>
  );
}

async function ReviewComposer({ product }: { product: Product }) {
  const user = await getSessionUser();
  let verified = false;
  if (user) {
    const orders = await store.listOrders({ email: user.email });
    verified = orders.some((o) => o.status !== "pending" && o.status !== "failed" && o.items.some((i) => i.productId === product.id));
  }
  return <ReviewForm productId={product.id} productSlug={product.slug} signedIn={Boolean(user)} defaultName={user?.name ?? ""} verified={verified} />;
}
