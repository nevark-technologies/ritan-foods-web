import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteAddressAction } from "@/app/(site)/account/actions";
import { NewAddress } from "@/components/account/AccountForms";
import { AccountFrame, AccountShell } from "@/components/account/AccountShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/data";

export const metadata: Metadata = { title: "Your addresses", robots: { index: false } };

export default function AddressesPage() {
  return (
    <PageTransition>
      <AccountFrame>
        <div className="container-x">
          <Suspense fallback={<div className="skeleton h-96 rounded-[2rem]" />}>
            <Addresses />
          </Suspense>
        </div>
      </AccountFrame>
    </PageTransition>
  );
}

async function Addresses() {
  const user = await requireUser("/account/addresses");
  const addresses = await store.listAddresses(user.id);
  return (
    <AccountShell user={user} active="/account/addresses" title="Saved addresses">
      <ul className="mb-8 grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-[1.75rem] border border-forest-900/10 p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-forest-900">{a.label}</p>
              {a.isDefault && <span className="rounded-full bg-sprout-100 px-2.5 py-1 text-xs font-bold text-forest-800">Default</span>}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              {a.fullName} · {a.phone}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
            <form action={deleteAddressAction} className="mt-4">
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="text-sm font-semibold text-chilli-600 underline underline-offset-4">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>
      {addresses.length === 0 && <p className="mb-6 text-ink-500">Save an address to check out faster next time.</p>}
      <NewAddress />
    </AccountShell>
  );
}
