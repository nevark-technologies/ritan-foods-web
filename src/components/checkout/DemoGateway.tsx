"use client";

import { CreditCard, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { formatINR } from "@/lib/utils";

/** Stand-in for Razorpay when no keys are configured (demo mode only). */
export function DemoGateway({ open, amount, orderNumber, busy, onResult, onClose }: { open: boolean; amount: number; orderNumber: string; busy: boolean; onResult: (outcome: "success" | "failure") => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} side="center" label="Demo payment">
      <div className="flex items-center justify-between bg-forest-900 px-6 py-5 text-cream-50">
        <div>
          <p className="eyebrow text-sprout-300">Demo payment</p>
          <p className="mt-1 font-display text-2xl">Ritan Foods</p>
        </div>
        <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-cream-50/10" aria-label="Cancel payment">
          <X className="size-5" />
        </button>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between rounded-2xl bg-parchment-100 p-4">
          <span className="text-sm text-ink-500">Order {orderNumber}</span>
          <span className="tabular font-display text-3xl text-forest-900">{formatINR(amount)}</span>
        </div>
        <p className="mt-5 flex items-start gap-3 text-sm text-ink-700">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-leaf-500" />
          Razorpay keys aren&apos;t connected yet, so this simulates the payment step. No money is charged. Once keys are added, customers see the real Razorpay checkout (UPI, cards,
          netbanking, wallets).
        </p>
        <div className="mt-6 grid gap-3">
          <Button type="button" size="lg" disabled={busy} onClick={() => onResult("success")}>
            <CreditCard className="size-4" /> {busy ? "Processing…" : `Simulate successful payment`}
          </Button>
          <button type="button" disabled={busy} onClick={() => onResult("failure")} className="h-12 rounded-full text-sm font-semibold text-chilli-600 hover:bg-chilli-600/5">
            Simulate a declined payment
          </button>
        </div>
      </div>
    </Sheet>
  );
}
