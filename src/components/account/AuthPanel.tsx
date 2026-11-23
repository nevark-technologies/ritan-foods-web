"use client";

import { AnimatePresence, LayoutGroup, m } from "motion/react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPasswordAction, signInAction, signUpAction, type FormState } from "@/app/(site)/account/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

type Tab = "signin" | "signup" | "reset";

export function AuthPanel({ next, demo }: { next: string; demo: boolean }) {
  const [tab, setTab] = useState<Tab>("signin");
  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-cream-50 p-7 shadow-[0_40px_80px_-40px_rgba(15,42,23,0.45)] sm:p-10">
      {tab !== "reset" && (
        <LayoutGroup id="auth-tabs">
          <div role="tablist" aria-label="Account" className="grid grid-cols-2 rounded-full bg-parchment-100 p-1">
            {(["signin", "signup"] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative h-11 rounded-full text-sm font-semibold", tab === t ? "text-cream-50" : "text-forest-800")}>
                {tab === t && <m.span layoutId="auth-pill" className="absolute inset-0 rounded-full bg-forest-800" transition={spring.snappy} />}
                <span className="relative">{t === "signin" ? "Sign in" : "Create account"}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      )}
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="mt-8">
          {tab === "signin" && <SignIn next={next} onForgot={() => setTab("reset")} />}
          {tab === "signup" && <SignUp next={next} />}
          {tab === "reset" && <Reset onBack={() => setTab("signin")} demo={demo} />}
        </m.div>
      </AnimatePresence>
      <p className="mt-8 border-t border-forest-900/10 pt-6 text-center text-sm text-ink-500">
        No account needed to shop —{" "}
        <Link href="/shop" className="font-semibold text-forest-800 underline underline-offset-4">
          continue as a guest
        </Link>
        .
      </p>
    </div>
  );
}

function Message({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p className="rounded-2xl bg-chilli-600/10 p-3 text-sm font-semibold text-chilli-600" role="alert">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p className="rounded-2xl bg-sprout-100 p-3 text-sm font-semibold text-forest-800" role="status">
        {state.message}
      </p>
    );
  return null;
}

function SignIn({ next, onForgot }: { next: string; onForgot: () => void }) {
  const [state, action, pending] = useActionState(signInAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Email" htmlFor="si-email" error={state.fieldErrors?.email}>
        <Input id="si-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="si-password" error={state.fieldErrors?.password}>
        <Input id="si-password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Message state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <button type="button" onClick={onForgot} className="block w-full text-center text-sm font-semibold text-forest-800 underline underline-offset-4">
        Forgot your password?
      </button>
    </form>
  );
}

function SignUp({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUpAction, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <Field label="Your name" htmlFor="su-name" error={state.fieldErrors?.name}>
        <Input id="su-name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="su-email" error={state.fieldErrors?.email}>
        <Input id="su-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Mobile number" htmlFor="su-phone" error={state.fieldErrors?.phone} optional>
        <Input id="su-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" />
      </Field>
      <Field label="Password" htmlFor="su-password" error={state.fieldErrors?.password} hint="At least 8 characters">
        <Input id="su-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <Message state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}

function Reset({ onBack, demo }: { onBack: () => void; demo: boolean }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-5">
      <h2 className="font-display text-3xl text-forest-900">Reset your password</h2>
      <p className="text-sm text-ink-500">{demo ? "Password reset emails start working once Supabase is connected." : "We'll email you a link to choose a new password."}</p>
      <Field label="Email" htmlFor="rp-email" error={state.fieldErrors?.email}>
        <Input id="rp-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Message state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <button type="button" onClick={onBack} className="block w-full text-center text-sm font-semibold text-forest-800 underline underline-offset-4">
        Back to sign in
      </button>
    </form>
  );
}
