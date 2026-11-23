"use client";

import { PenLine, Star } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId, productSlug, signedIn, defaultName, verified }: { productId: string; productSlug: string; signedIn: boolean; defaultName: string; verified: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <p className="mt-8 rounded-2xl bg-parchment-100 p-5 text-sm text-ink-700">
        <Link href={`/account?next=/products/${productSlug}%23reviews`} className="font-semibold text-forest-800 underline underline-offset-4">
          Sign in
        </Link>{" "}
        to write a review.
      </p>
    );
  }
  if (state === "done") {
    return (
      <m.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-sprout-100 p-5 text-sm font-semibold text-forest-800" role="status">
        Thank you! Your review will appear once it has been checked.
      </m.p>
    );
  }

  return (
    <div className="mt-8">
      {!open && (
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          <PenLine className="size-4" /> Write a review
        </Button>
      )}
      <AnimatePresence>
        {open && (
          <m.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring.soft}
            className="space-y-4 rounded-3xl border border-forest-900/10 bg-parchment-100/60 p-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setState("sending");
              const form = Object.fromEntries(new FormData(e.currentTarget));
              const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, rating, productId }),
              }).catch(() => null);
              if (res?.ok) setState("done");
              else {
                const data = await res?.json().catch(() => null);
                setError(data?.error ?? "Couldn't save your review. Please try again.");
                setState("idle");
              }
            }}
          >
            <fieldset>
              <legend className="text-sm font-semibold text-forest-900">Your rating</legend>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <m.button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    whileTap={{ scale: 0.8 }}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                    className="p-0.5"
                  >
                    <Star className={cn("size-7 text-turmeric-500 transition-colors", n <= (hover || rating) && "fill-turmeric-500")} />
                  </m.button>
                ))}
              </div>
            </fieldset>
            <Field label="Name shown with your review" htmlFor="rv-name">
              <Input id="rv-name" name="authorName" defaultValue={defaultName} required maxLength={60} />
            </Field>
            <Field label="Title" htmlFor="rv-title" optional>
              <Input id="rv-title" name="title" maxLength={80} />
            </Field>
            <Field label="Your review" htmlFor="rv-body">
              <Textarea id="rv-body" name="body" required minLength={10} maxLength={1500} />
            </Field>
            {verified && <p className="text-xs font-semibold text-leaf-600">You bought this — your review will show a verified purchase badge.</p>}
            {error && (
              <p className="text-sm font-semibold text-chilli-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={state === "sending"} className="w-full">
              {state === "sending" ? "Submitting…" : "Submit review"}
            </Button>
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
