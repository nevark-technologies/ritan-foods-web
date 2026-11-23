"use client";

import { submitWith } from "@/lib/use-action-submit";
import { useActionState, useState } from "react";
import { saveCouponAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import type { Coupon } from "@/lib/data/types";

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveCouponAction, {});
  const [type, setType] = useState(coupon?.type ?? "percent");
  const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : "");
  return (
    <form onSubmit={submitWith(action)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Code" htmlFor="cp-code">
        <Input id="cp-code" name="code" defaultValue={coupon?.code} readOnly={Boolean(coupon)} className="uppercase tracking-[0.12em]" required />
      </Field>
      <Field label="Type" htmlFor="cp-type">
        <Select id="cp-type" name="type" value={type} onChange={(e) => setType(e.target.value as Coupon["type"])}>
          <option value="percent">% off</option>
          <option value="flat">₹ off</option>
          <option value="free_shipping">Free shipping</option>
        </Select>
      </Field>
      <Field label="Description" htmlFor="cp-desc" className="sm:col-span-2">
        <Input id="cp-desc" name="description" defaultValue={coupon?.description} placeholder="Shown to staff only" />
      </Field>
      {type !== "free_shipping" && (
        <Field label={type === "percent" ? "Percent off" : "Amount off (₹)"} htmlFor="cp-value">
          <Input id="cp-value" name="value" inputMode="decimal" defaultValue={coupon ? (coupon.type === "flat" ? coupon.value / 100 : coupon.value) : ""} required />
        </Field>
      )}
      {type === "percent" && (
        <Field label="Max discount (₹)" htmlFor="cp-max" optional>
          <Input id="cp-max" name="maxDiscount" inputMode="decimal" defaultValue={coupon?.maxDiscount ? coupon.maxDiscount / 100 : ""} />
        </Field>
      )}
      {type === "free_shipping" && <input type="hidden" name="value" value="0" />}
      <Field label="Minimum order (₹)" htmlFor="cp-min">
        <Input id="cp-min" name="minSubtotal" inputMode="decimal" defaultValue={coupon ? coupon.minSubtotal / 100 : 0} />
      </Field>
      <Field label="Starts" htmlFor="cp-start" optional>
        <Input id="cp-start" name="startsAt" type="date" defaultValue={day(coupon?.startsAt)} />
      </Field>
      <Field label="Ends" htmlFor="cp-end" optional>
        <Input id="cp-end" name="endsAt" type="date" defaultValue={day(coupon?.endsAt)} />
      </Field>
      <Field label="Total uses allowed" htmlFor="cp-limit" optional>
        <Input id="cp-limit" name="usageLimit" inputMode="numeric" defaultValue={coupon?.usageLimit ?? ""} />
      </Field>
      <Field label="Uses per customer" htmlFor="cp-per" optional>
        <Input id="cp-per" name="perCustomerLimit" inputMode="numeric" defaultValue={coupon?.perCustomerLimit ?? ""} />
      </Field>
      <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
        <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="size-4 accent-forest-700" /> Active
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : coupon ? "Save coupon" : "Create coupon"}
        </Button>
        {state.error && <p className="text-sm font-semibold text-chilli-600" role="alert">{state.error}</p>}
        {state.message && <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>}
      </div>
    </form>
  );
}
