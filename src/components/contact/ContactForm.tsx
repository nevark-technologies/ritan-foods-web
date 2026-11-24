"use client";

import { CheckCircle2, Send } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { spring } from "@/lib/motion/tokens";

type Errors = Partial<Record<"name" | "email" | "phone" | "message" | "form", string>>;

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Errors>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setErrors({});
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    }).catch(() => null);
    if (!res) {
      setErrors({ form: "Couldn't reach us - please check your connection and try again." });
      setState("idle");
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors(data.errors ?? { form: data.error ?? "Something went wrong. Please try again." });
      setState("idle");
      return;
    }
    setState("sent");
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === "sent" ? (
        <m.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={spring.bouncy} className="py-10 text-center" role="status">
          <CheckCircle2 className="mx-auto size-14 text-leaf-500" />
          <p className="mt-4 font-display text-3xl text-forest-900">Thank you!</p>
          <p className="mt-2 text-ink-500">Your message is with us. We&apos;ll be in touch soon.</p>
        </m.div>
      ) : (
        <m.form key="form" exit={{ opacity: 0, y: -10 }} onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" htmlFor="c-name" error={errors.name}>
              <Input id="c-name" name="name" autoComplete="name" required aria-invalid={Boolean(errors.name)} />
            </Field>
            <Field label="Phone" htmlFor="c-phone" error={errors.phone} optional>
              <Input id="c-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
            </Field>
          </div>
          <Field label="Email" htmlFor="c-email" error={errors.email}>
            <Input id="c-email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} />
          </Field>
          <Field label="How can we help?" htmlFor="c-message" error={errors.message}>
            <Textarea id="c-message" name="message" required aria-invalid={Boolean(errors.message)} />
          </Field>
          {errors.form && (
            <p className="text-sm font-semibold text-chilli-600" role="alert">
              {errors.form}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send message"} <Send className="size-4" />
          </Button>
        </m.form>
      )}
    </AnimatePresence>
  );
}
