"use client";

import { submitWith } from "@/lib/use-action-submit";
import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { saveAddressAction, updateProfileAction, type FormState } from "@/app/(site)/account/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { INDIAN_STATES } from "@/lib/commerce/shipping";
import type { SavedAddress, SessionUser } from "@/lib/data/types";

function Status({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm font-semibold text-chilli-600" role="alert">{state.error}</p>;
  if (state.message) return <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>;
  return null;
}

export function ProfileForm({ user }: { user: SessionUser }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  return (
    <form onSubmit={submitWith(action)} className="max-w-xl space-y-5 rounded-[2rem] bg-parchment-100 p-7">
      <Field label="Name" htmlFor="pf-name" error={state.fieldErrors?.name}>
        <Input id="pf-name" name="name" defaultValue={user.name} autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="pf-email" hint="Contact us to change your login email.">
        <Input id="pf-email" value={user.email} disabled readOnly />
      </Field>
      <Field label="Mobile number" htmlFor="pf-phone" error={state.fieldErrors?.phone} optional>
        <Input id="pf-phone" name="phone" defaultValue={user.phone ?? ""} type="tel" autoComplete="tel" />
      </Field>
      <Status state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

export function AddressForm({ address, onDone }: { address?: SavedAddress; onDone?: () => void }) {
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await saveAddressAction(prev, fd);
    if (res.ok) onDone?.();
    return res;
  }, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 rounded-[2rem] bg-parchment-100 p-6 sm:grid-cols-2">
      {address && <input type="hidden" name="id" value={address.id} />}
      <Field label="Label" htmlFor="ad-label" optional>
        <Input id="ad-label" name="label" defaultValue={address?.label ?? "Home"} placeholder="Home, Office…" />
      </Field>
      <Field label="Recipient name" htmlFor="ad-name" error={e.fullName}>
        <Input id="ad-name" name="fullName" defaultValue={address?.fullName} autoComplete="name" required />
      </Field>
      <Field label="Mobile number" htmlFor="ad-phone" error={e.phone}>
        <Input id="ad-phone" name="phone" defaultValue={address?.phone} type="tel" autoComplete="tel" required />
      </Field>
      <Field label="PIN code" htmlFor="ad-pin" error={e.pincode}>
        <Input id="ad-pin" name="pincode" defaultValue={address?.pincode} inputMode="numeric" maxLength={6} autoComplete="postal-code" required />
      </Field>
      <Field label="House, building, street" htmlFor="ad-line1" error={e.line1} className="sm:col-span-2">
        <Input id="ad-line1" name="line1" defaultValue={address?.line1} autoComplete="address-line1" required />
      </Field>
      <Field label="Area, locality" htmlFor="ad-line2" optional>
        <Input id="ad-line2" name="line2" defaultValue={address?.line2 ?? ""} autoComplete="address-line2" />
      </Field>
      <Field label="Landmark" htmlFor="ad-landmark" optional>
        <Input id="ad-landmark" name="landmark" defaultValue={address?.landmark ?? ""} />
      </Field>
      <Field label="City" htmlFor="ad-city" error={e.city}>
        <Input id="ad-city" name="city" defaultValue={address?.city} autoComplete="address-level2" required />
      </Field>
      <Field label="State" htmlFor="ad-state">
        <Select id="ad-state" name="state" defaultValue={address?.state ?? "Tamil Nadu"}>
          {INDIAN_STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </Field>
      <label className="flex items-center gap-3 text-sm text-ink-700 sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="size-4 accent-forest-700" /> Use as my default address
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function NewAddress() {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add an address
      </Button>
    );
  return <AddressForm onDone={() => setOpen(false)} />;
}
