"use client";

import { submitWith } from "@/lib/use-action-submit";
import { useActionState } from "react";
import { saveSettingsAction, type AdminFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import type { StoreSettings, ZoneId } from "@/lib/data/types";

const ZONES: ZoneId[] = ["chennai", "tamil-nadu", "south", "national", "remote"];

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState<AdminFormState, FormData>(saveSettingsAction, {});
  return (
    <form onSubmit={submitWith(action)} className="space-y-6">
      <section className="rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
        <h2 className="font-display text-2xl text-forest-900">Shipping rates</h2>
        <p className="mt-1 text-sm text-ink-500">Charged automatically from the delivery PIN code and the order weight (first 500 g, then each extra 500 g).</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.12em] text-ink-500">
                <th className="py-2 pr-3 font-semibold">Zone</th>
                <th className="py-2 pr-3 font-semibold">First 500 g (₹)</th>
                <th className="py-2 pr-3 font-semibold">Each extra 500 g (₹)</th>
                <th className="py-2 font-semibold">Delivery estimate</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((z) => (
                <tr key={z} className="border-t border-forest-900/5">
                  <td className="py-2 pr-3 font-semibold">{settings.zones[z].label}</td>
                  <td className="py-2 pr-3">
                    <Input name={`zone:${z}:base`} defaultValue={settings.zones[z].base / 100} inputMode="decimal" className="h-10 w-28" aria-label={`${settings.zones[z].label} first 500 g`} />
                  </td>
                  <td className="py-2 pr-3">
                    <Input name={`zone:${z}:extra`} defaultValue={settings.zones[z].perExtra500g / 100} inputMode="decimal" className="h-10 w-28" aria-label={`${settings.zones[z].label} extra 500 g`} />
                  </td>
                  <td className="py-2">
                    <Input name={`zone:${z}:eta`} defaultValue={settings.zones[z].eta} className="h-10 w-36" aria-label={`${settings.zones[z].label} estimate`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Free shipping above (₹)" htmlFor="st-free" hint="Set 0 to turn off free shipping">
            <Input id="st-free" name="freeShippingThreshold" defaultValue={settings.freeShippingThreshold / 100} inputMode="decimal" />
          </Field>
          <Field label="Low-stock alert at" htmlFor="st-low">
            <Input id="st-low" name="lowStockThreshold" defaultValue={settings.lowStockThreshold} inputMode="numeric" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
        <h2 className="font-display text-2xl text-forest-900">Cash on delivery</h2>
        <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="codEnabled" defaultChecked={settings.codEnabled} className="size-4 accent-forest-700" /> Offer cash on delivery
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="COD handling fee (₹)" htmlFor="st-codfee">
            <Input id="st-codfee" name="codFee" defaultValue={settings.codFee / 100} inputMode="decimal" />
          </Field>
          <Field label="Max order value for COD (₹)" htmlFor="st-codmax">
            <Input id="st-codmax" name="codMaxOrder" defaultValue={settings.codMaxOrder / 100} inputMode="decimal" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-forest-900/10 bg-cream-50 p-6">
        <h2 className="font-display text-2xl text-forest-900">Store details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Announcement bar" htmlFor="st-ann" optional className="sm:col-span-2" hint="Separate phrases with · (only the first shows on phones)">
            <Input id="st-ann" name="announcement" defaultValue={settings.announcement ?? ""} />
          </Field>
          <Field label="Email" htmlFor="st-email">
            <Input id="st-email" name="contactEmail" defaultValue={settings.contact.email} type="email" />
          </Field>
          <Field label="Phone" htmlFor="st-phone">
            <Input id="st-phone" name="contactPhone" defaultValue={settings.contact.phone} />
          </Field>
          <Field label="WhatsApp number" htmlFor="st-wa" hint="With country code, e.g. +917010460911">
            <Input id="st-wa" name="contactWhatsapp" defaultValue={settings.contact.whatsapp} />
          </Field>
          <Field label="GSTIN" htmlFor="st-gst" hint="Contact support to change">
            <Input id="st-gst" value={settings.contact.gstin} readOnly disabled />
          </Field>
          <Field label="Registered address" htmlFor="st-addr" className="sm:col-span-2">
            <Textarea id="st-addr" name="contactAddress" defaultValue={settings.contact.address} className="min-h-20" />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {state.message && <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>}
        {state.error && <p className="text-sm font-semibold text-chilli-600" role="alert">{state.error}</p>}
      </div>
    </form>
  );
}
