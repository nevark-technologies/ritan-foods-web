import { Check, Circle, X } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/data/types";
import { cn, formatDate } from "@/lib/utils";

const FLOW: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Order confirmed" },
  { status: "packed", label: "Packed with care" },
  { status: "shipped", label: "On its way" },
  { status: "delivered", label: "Delivered" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Payment failed",
};

/** Vertical status timeline. The fill line scales (transform) with progress. */
export function OrderTimeline({ order }: { order: Order }) {
  if (["cancelled", "refunded", "failed", "pending"].includes(order.status)) {
    return (
      <p className="flex items-center gap-3 rounded-2xl bg-parchment-100 p-4 text-sm font-semibold text-forest-900">
        <span className={cn("grid size-8 place-items-center rounded-full", order.status === "pending" ? "bg-turmeric-500/20 text-clay-600" : "bg-chilli-600/10 text-chilli-600")}>
          {order.status === "pending" ? <Circle className="size-4" /> : <X className="size-4" />}
        </span>
        {STATUS_LABEL[order.status]}
      </p>
    );
  }
  const reached = FLOW.findIndex((f) => f.status === order.status);
  return (
    <ol className="relative space-y-6 pl-1">
      <span aria-hidden className="absolute bottom-3 left-[1.05rem] top-3 w-0.5 rounded-full bg-forest-900/10" />
      <span aria-hidden className="absolute left-[1.05rem] top-3 w-0.5 origin-top rounded-full bg-leaf-500" style={{ height: "calc(100% - 1.5rem)", transform: `scaleY(${reached / (FLOW.length - 1)})` }} />
      {FLOW.map((step, i) => {
        const done = i <= reached;
        const event = order.events.find((e) => e.status === step.status);
        return (
          <li key={step.status} className="relative flex items-start gap-4">
            <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2", done ? "border-leaf-500 bg-leaf-500 text-cream-50" : "border-forest-900/15 bg-cream-50 text-ink-300")}>
              {done ? <Check className="size-4" /> : <Circle className="size-2.5 fill-current" />}
            </span>
            <span className="pt-1">
              <span className={cn("block font-semibold", done ? "text-forest-900" : "text-ink-500")}>{step.label}</span>
              {event && <span className="text-xs text-ink-500">{formatDate(event.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
              {step.status === "shipped" && done && order.courier && (
                <span className="mt-1 block text-sm text-ink-700">
                  {order.courier}
                  {order.trackingNumber ? ` · ${order.trackingNumber}` : ""}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
