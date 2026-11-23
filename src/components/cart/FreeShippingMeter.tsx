"use client";

import { Truck } from "lucide-react";
import { m } from "motion/react";
import { spring } from "@/lib/motion/tokens";
import { formatINR } from "@/lib/utils";

/** Progress toward free shipping. The bar animates scaleX only. */
export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (!threshold) return null;
  const progress = Math.min(1, subtotal / threshold);
  const remaining = Math.max(0, threshold - subtotal);
  return (
    <div className="rounded-2xl bg-sprout-100 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-forest-800">
        <Truck className="size-4" aria-hidden />
        {remaining > 0 ? (
          <span>
            You&apos;re <span className="tabular">{formatINR(remaining)}</span> away from free shipping
          </span>
        ) : (
          <span>You&apos;ve unlocked free shipping 🌿</span>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-forest-900/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Free shipping progress">
        <m.div className="h-full origin-left rounded-full bg-leaf-500" initial={false} animate={{ scaleX: progress }} transition={spring.bouncy} />
      </div>
    </div>
  );
}
