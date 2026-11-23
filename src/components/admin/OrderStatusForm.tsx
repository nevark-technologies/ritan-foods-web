"use client";

import { submitWith } from "@/lib/use-action-submit";
import { useActionState, useState } from "react";
import { updateOrderAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { Order, OrderStatus } from "@/lib/data/types";

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Awaiting payment" },
  { value: "confirmed", label: "Confirmed — to pack" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Payment failed" },
];

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(updateOrderAction, {});
  const [status, setStatus] = useState<OrderStatus>(order.status);
  return (
    <form onSubmit={submitWith(action)} className="space-y-4">
      <input type="hidden" name="orderNumber" value={order.orderNumber} />
      <Field label="Status" htmlFor="os-status">
        <Select id="os-status" name="status" defaultValue={order.status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Courier" htmlFor="os-courier">
          <Select id="os-courier" name="courier" defaultValue={order.courier ?? ""}>
            <option value="">—</option>
            <option>DTDC</option>
            <option>India Post</option>
          </Select>
        </Field>
        <Field label="Tracking number" htmlFor="os-tracking">
          <Input id="os-tracking" name="trackingNumber" defaultValue={order.trackingNumber ?? ""} />
        </Field>
      </div>
      {status === "shipped" && order.status !== "shipped" && (
        <label className="flex items-center gap-3 text-sm text-ink-700">
          <input type="checkbox" name="notify" defaultChecked className="size-4 accent-forest-700" /> Email the customer their tracking details
        </label>
      )}
      <Field label="Note for the timeline" htmlFor="os-note" optional>
        <Input id="os-note" name="eventNote" placeholder="e.g. Handed to DTDC Villivakkam" />
      </Field>
      <Field label="Internal notes" htmlFor="os-notes" optional>
        <Textarea id="os-notes" name="notes" defaultValue={order.notes ?? ""} className="min-h-20" />
      </Field>
      {state.error && <p className="text-sm font-semibold text-chilli-600" role="alert">{state.error}</p>}
      {state.message && <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Update order"}
      </Button>
    </form>
  );
}
