import type { Totals } from "@/lib/commerce/pricing";
import { formatINR } from "@/lib/utils";

/** Subtotal → discount → shipping → COD → total rows (all server-computed). */
export function SummaryRows({ totals, loading, pincodeKnown }: { totals: Totals | null; loading?: boolean; pincodeKnown: boolean }) {
  if (!totals) return <div className="skeleton h-40 rounded-2xl" />;
  return (
    <dl className={`space-y-3 text-sm transition-opacity ${loading ? "opacity-60" : ""}`}>
      <div className="flex justify-between">
        <dt className="text-ink-500">Subtotal</dt>
        <dd className="tabular font-semibold">{formatINR(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between text-leaf-600">
          <dt>Discount{totals.coupon?.ok ? ` (${totals.coupon.code})` : ""}</dt>
          <dd className="tabular font-semibold">−{formatINR(totals.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink-500">
          Shipping
          {totals.shipping && <span className="block text-xs">{totals.shipping.zoneLabel} · {totals.shipping.eta}</span>}
        </dt>
        <dd className="tabular font-semibold">{!pincodeKnown || !totals.shipping ? <span className="font-normal text-ink-500">Enter PIN code</span> : totals.shippingFee === 0 ? "Free" : formatINR(totals.shippingFee)}</dd>
      </div>
      {totals.codFee > 0 && (
        <div className="flex justify-between">
          <dt className="text-ink-500">Cash on delivery fee</dt>
          <dd className="tabular font-semibold">{formatINR(totals.codFee)}</dd>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-forest-900/10 pt-4">
        <dt className="font-semibold text-forest-900">Total</dt>
        <dd className="tabular font-display text-3xl text-forest-900">{formatINR(totals.total)}</dd>
      </div>
      <p className="text-xs text-ink-500">Inclusive of all taxes.</p>
    </dl>
  );
}
