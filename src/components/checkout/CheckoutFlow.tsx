"use client";

import { AlertTriangle, Banknote, CreditCard, Lock, MapPin, Plus, ShieldCheck, User } from "lucide-react";
import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useMemo, useState } from "react";
import { CouponField } from "@/components/cart/CouponField";
import { SummaryRows } from "@/components/cart/SummaryRows";
import { useCartQuote } from "@/components/cart/useCartQuote";
import { useHydrated } from "@/components/layout/StoreHydrator";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { INDIAN_STATES } from "@/lib/commerce/shipping";
import type { Address, PaymentMethod, SavedAddress, SessionUser } from "@/lib/data/types";
import { spring } from "@/lib/motion/tokens";
import { useCart } from "@/lib/store/cart";
import { cn, formatINR, formatWeight } from "@/lib/utils";
import { DemoGateway } from "./DemoGateway";

type RazorpayHandlerResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (resp: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const EMPTY: Address = { fullName: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "Tamil Nadu", pincode: "" };

export function CheckoutFlow({
  user,
  addresses,
  razorpayEnabled,
  onlinePayments,
}: {
  user: SessionUser | null;
  addresses: SavedAddress[];
  razorpayEnabled: boolean;
  /** false until Razorpay keys are set on a real database: only cash on delivery is offered */
  onlinePayments: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const coupon = useCart((s) => s.couponCode);
  const pincode = useCart((s) => s.pincode);
  const setPincode = useCart((s) => s.setPincode);
  const clear = useCart((s) => s.clear);

  const defaultSaved = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [savedId, setSavedId] = useState<string | "new">(defaultSaved?.id ?? "new");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState<Address>(() => ({ ...EMPTY, fullName: user?.name ?? "", phone: user?.phone ?? "", pincode: pincode ?? "" }));
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(onlinePayments ? "razorpay" : "cod");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [demo, setDemo] = useState<{ orderNumber: string; amount: number } | null>(null);

  const selected = savedId !== "new" ? addresses.find((a) => a.id === savedId) ?? null : null;
  const effectiveAddress: Address = selected ?? address;
  const list = useMemo(() => (hydrated ? items : []), [hydrated, items]);
  const { quote, loading } = useCartQuote({ items: list, coupon, pincode: effectiveAddress.pincode || pincode, email, paymentMethod: method, enabled: hydrated });
  const codAvailable = Boolean(quote?.cod.enabled);

  const setField = (key: keyof Address, value: string) => {
    setAddress((a) => ({ ...a, [key]: value }));
    if (key === "pincode" && /^[1-8]\d{5}$/.test(value)) setPincode(value);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email address.";
    const ph = (selected ? selected.phone : phone).replace(/[\s-]/g, "");
    if (!/^(\+?91)?[6-9]\d{9}$/.test(ph)) e.phone = "Enter a valid 10-digit mobile number.";
    if (!selected) {
      if (address.fullName.trim().length < 2) e["address.fullName"] = "Enter the recipient's name.";
      if (address.line1.trim().length < 4) e["address.line1"] = "Enter your house / street.";
      if (address.city.trim().length < 2) e["address.city"] = "Enter your city.";
      if (!/^[1-8]\d{5}$/.test(address.pincode)) e["address.pincode"] = "Enter a valid 6-digit PIN code.";
    }
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(Object.keys(e)[0].replace(".", "-"))?.focus();
      return false;
    }
    return true;
  };

  const finish = (orderNumber: string, token: string) => {
    // The confirmation page can take a moment to load; without this the emptied cart
    // would show "Your bag is empty" in the meantime.
    setPlaced(true);
    clear();
    router.push(`/checkout/success/${encodeURIComponent(orderNumber)}?t=${token}`);
  };

  const verify = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Payment could not be confirmed.");
    return data as { orderNumber: string; token: string };
  };

  const placeOrder = async () => {
    setFormError(null);
    if (!validate() || busy) return;
    setBusy(true);
    const contactPhone = selected ? selected.phone : phone;
    const res = await fetch("/api/checkout/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: list.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        coupon,
        email,
        phone: contactPhone,
        address: { ...effectiveAddress, phone: effectiveAddress.phone || contactPhone },
        paymentMethod: method,
        saveAddress: Boolean(user && !selected && saveAddress),
        notes,
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) {
      setBusy(false);
      setErrors(data.fieldErrors ?? {});
      setFormError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    if (data.confirmed) return finish(data.orderNumber, data.token);
    if (data.demo) {
      setDemo({ orderNumber: data.orderNumber, amount: data.amount });
      setBusy(false);
      return;
    }
    if (data.razorpay && window.Razorpay) {
      const rzp = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: "INR",
        name: "Ritan Foods",
        description: `Order ${data.orderNumber}`,
        image: `${window.location.origin}/images/brand/logo-email.png`,
        order_id: data.razorpay.orderId,
        prefill: data.razorpay.prefill,
        notes: { order_number: data.orderNumber },
        theme: { color: "#1E4D2B" },
        retry: { enabled: true, max_count: 3 },
        modal: { confirm_close: true, ondismiss: () => setBusy(false) },
        handler: async (resp: RazorpayHandlerResponse) => {
          try {
            const ok = await verify({ orderNumber: data.orderNumber, ...resp });
            finish(ok.orderNumber, ok.token);
          } catch (err) {
            setBusy(false);
            setFormError((err as Error).message);
          }
        },
      });
      rzp.on("payment.failed", (resp) => setFormError(resp.error?.description ?? "Payment failed. Please try again."));
      rzp.open();
      return;
    }
    setBusy(false);
    setFormError("The payment window couldn't load. Check your connection and try again.");
  };

  const summaryItems = list;

  if (!hydrated) return <div className="skeleton h-[32rem] rounded-[2rem]" />;
  if (placed) {
    return (
      <div role="status" className="rounded-[2rem] bg-parchment-100 px-6 py-20 text-center">
        <p className="font-display text-4xl text-forest-900">Order placed</p>
        <p className="mt-2 text-ink-500">Opening your order confirmation…</p>
      </div>
    );
  }
  if (!list.length) {
    return (
      <div className="rounded-[2rem] bg-parchment-100 px-6 py-20 text-center">
        <p className="font-display text-4xl text-forest-900">Your bag is empty</p>
        <p className="mt-2 text-ink-500">Add something delicious before checking out.</p>
        <ButtonLink href="/shop" className="mt-8">
          Shop the pantry
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      {razorpayEnabled && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <div className="grid gap-12 lg:grid-cols-[1fr_26rem] lg:gap-16">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void placeOrder();
          }}
          className="space-y-6"
        >
          {/* Contact */}
          <Step n={1} title="Contact" icon={User}>
            {user ? (
              <p className="text-sm text-ink-700">
                Signed in as <strong>{user.name}</strong> ({user.email})
              </p>
            ) : (
              <p className="text-sm text-ink-500">
                Checking out as a guest.{" "}
                <Link href="/account?next=/checkout" className="font-semibold text-forest-800 underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to use saved addresses and see your order history.
              </p>
            )}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="email" error={errors.email} hint="For your order confirmation">
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(errors.email)} />
              </Field>
              <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="For delivery updates">
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" aria-invalid={Boolean(errors.phone)} />
              </Field>
            </div>
          </Step>

          {/* Address */}
          <Step n={2} title="Delivery address" icon={MapPin}>
            {addresses.length > 0 && (
              <div className="mb-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Saved addresses">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={savedId === a.id}
                    onClick={() => {
                      setSavedId(a.id);
                      setPincode(a.pincode);
                    }}
                    className={cn("rounded-2xl border p-4 text-left text-sm transition-colors", savedId === a.id ? "border-forest-700 bg-sprout-100" : "border-forest-900/15 hover:border-forest-700")}
                  >
                    <span className="font-semibold text-forest-900">{a.label}</span>
                    <span className="mt-1 block text-ink-700">
                      {a.fullName}, {a.line1}, {a.city} {a.pincode}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={savedId === "new"}
                  onClick={() => setSavedId("new")}
                  className={cn("flex items-center gap-2 rounded-2xl border border-dashed p-4 text-sm font-semibold", savedId === "new" ? "border-forest-700 bg-sprout-100" : "border-forest-900/25")}
                >
                  <Plus className="size-4" /> New address
                </button>
              </div>
            )}
            {savedId === "new" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="address-fullName" error={errors["address.fullName"]} className="sm:col-span-2">
                  <Input id="address-fullName" autoComplete="name" value={address.fullName} onChange={(e) => setField("fullName", e.target.value)} aria-invalid={Boolean(errors["address.fullName"])} />
                </Field>
                <Field label="House, building, street" htmlFor="address-line1" error={errors["address.line1"]} className="sm:col-span-2">
                  <Input id="address-line1" autoComplete="address-line1" value={address.line1} onChange={(e) => setField("line1", e.target.value)} aria-invalid={Boolean(errors["address.line1"])} />
                </Field>
                <Field label="Area, locality" htmlFor="address-line2" optional>
                  <Input id="address-line2" autoComplete="address-line2" value={address.line2 ?? ""} onChange={(e) => setField("line2", e.target.value)} />
                </Field>
                <Field label="Landmark" htmlFor="address-landmark" optional>
                  <Input id="address-landmark" value={address.landmark ?? ""} onChange={(e) => setField("landmark", e.target.value)} />
                </Field>
                <Field label="City" htmlFor="address-city" error={errors["address.city"]}>
                  <Input id="address-city" autoComplete="address-level2" value={address.city} onChange={(e) => setField("city", e.target.value)} aria-invalid={Boolean(errors["address.city"])} />
                </Field>
                <Field label="PIN code" htmlFor="address-pincode" error={errors["address.pincode"]}>
                  <Input
                    id="address-pincode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, ""))}
                    aria-invalid={Boolean(errors["address.pincode"])}
                  />
                </Field>
                <Field label="State" htmlFor="address-state" className="sm:col-span-2">
                  <Select id="address-state" autoComplete="address-level1" value={address.state} onChange={(e) => setField("state", e.target.value)}>
                    {INDIAN_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>
                </Field>
                {user && (
                  <label className="flex items-center gap-3 text-sm text-ink-700 sm:col-span-2">
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="size-4 accent-forest-700" />
                    Save this address to my account
                  </label>
                )}
              </div>
            )}
            <Field label="Delivery instructions" htmlFor="notes" optional className="mt-4">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} className="min-h-20" placeholder="e.g. Call before delivery" />
            </Field>
          </Step>

          {/* Payment */}
          <Step n={3} title="Payment" icon={CreditCard}>
            <div className="grid gap-3" role="radiogroup" aria-label="Payment method">
              <PayOption
                active={method === "razorpay"}
                disabled={!onlinePayments}
                onClick={() => onlinePayments && setMethod("razorpay")}
                icon={CreditCard}
                title="Pay online"
                body={onlinePayments ? "UPI, cards, netbanking and wallets - secured by Razorpay" : "Coming soon - please pay on delivery for now"}
              />
              <PayOption
                active={method === "cod"}
                disabled={!codAvailable}
                onClick={() => codAvailable && setMethod("cod")}
                icon={Banknote}
                title="Cash on delivery"
                body={codAvailable ? `Pay when it arrives · ${formatINR(quote?.cod.fee ?? 0)} handling fee` : "Not available for this order"}
              />
            </div>
          </Step>

          {formError && (
            <p className="flex items-start gap-2 rounded-2xl bg-chilli-600/10 p-4 text-sm font-semibold text-chilli-600" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {formError}
            </p>
          )}

          <div className="lg:hidden">
            <SummaryRows totals={quote?.totals ?? null} loading={loading} pincodeKnown={Boolean(effectiveAddress.pincode)} />
          </div>
          <Button type="submit" size="lg" className="h-16 w-full text-base" disabled={busy || loading || !quote || (quote?.problems.length ?? 0) > 0}>
            <Lock className="size-4" />
            {busy ? "Working on it…" : method === "cod" ? `Place order · ${quote ? formatINR(quote.totals.total) : ""}` : `Pay ${quote ? formatINR(quote.totals.total) : ""} securely`}
          </Button>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-ink-500">
            <ShieldCheck className="size-4 text-leaf-500" /> By placing your order you agree to our{" "}
            <Link href="/policies/terms" className="underline">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/policies/refund-returns" className="underline">
              returns policy
            </Link>
            .
          </p>
        </form>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[2rem] bg-parchment-100 p-6 sm:p-8">
            <h2 className="font-display text-2xl text-forest-900">Your order</h2>
            <ul className="mt-5 space-y-4">
              {summaryItems.map((i) => (
                <li key={i.variantId} className="flex items-center gap-4">
                  <span className="relative grid size-16 shrink-0 place-items-center rounded-xl" style={{ background: i.palette.bg }}>
                    <Image src={i.image} alt="" width={64} height={64} sizes="64px" className="h-14 w-auto object-contain" />
                    <span className="tabular absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-forest-800 text-xs font-bold text-cream-50">{i.quantity}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-forest-900">{i.name}</span>
                    <span className="text-sm text-ink-500">{formatWeight(i.weightG)}</span>
                  </span>
                  <span className="tabular text-sm font-semibold">{formatINR(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <CouponField result={quote?.totals.coupon} />
            </div>
            <div className="mt-2 hidden lg:block">
              <SummaryRows totals={quote?.totals ?? null} loading={loading} pincodeKnown={Boolean(effectiveAddress.pincode)} />
            </div>
          </div>
        </aside>
      </div>

      {demo && (
        <DemoGateway
          open={Boolean(demo)}
          amount={demo.amount}
          orderNumber={demo.orderNumber}
          busy={busy}
          onClose={() => setDemo(null)}
          onResult={async (outcome) => {
            setBusy(true);
            try {
              const ok = await verify({ orderNumber: demo.orderNumber, demo: true, outcome });
              setDemo(null);
              finish(ok.orderNumber, ok.token);
            } catch (err) {
              setBusy(false);
              setDemo(null);
              setFormError((err as Error).message);
            }
          }}
        />
      )}
    </>
  );
}

function Step({ n, title, icon: Icon, children }: { n: number; title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <m.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring.soft, delay: n * 0.06 }} className="rounded-[2rem] border border-forest-900/10 bg-cream-50 p-6 sm:p-8">
      <h2 className="flex items-center gap-3 font-display text-2xl text-forest-900">
        <span className="tabular grid size-9 place-items-center rounded-full bg-forest-800 font-sans text-sm font-bold text-cream-50">{n}</span>
        {title}
        <Icon className="ml-auto size-5 text-leaf-500" aria-hidden />
      </h2>
      <div className="mt-5">{children}</div>
    </m.section>
  );
}

function PayOption({ active, disabled, onClick, icon: Icon, title, body }: { active: boolean; disabled?: boolean; onClick: () => void; icon: typeof User; title: string; body: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
        active ? "border-forest-700 bg-sprout-100" : "border-forest-900/15 hover:border-forest-700",
        disabled && "cursor-not-allowed opacity-50 hover:border-forest-900/15",
      )}
    >
      <span className={cn("grid size-11 place-items-center rounded-full", active ? "bg-forest-800 text-cream-50" : "bg-parchment-100 text-forest-800")}>
        <Icon className="size-5" />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-forest-900">{title}</span>
        <span className="text-sm text-ink-500">{body}</span>
      </span>
      <span className={cn("grid size-5 place-items-center rounded-full border-2", active ? "border-forest-700" : "border-forest-900/25")}>{active && <span className="size-2.5 rounded-full bg-forest-700" />}</span>
    </button>
  );
}
