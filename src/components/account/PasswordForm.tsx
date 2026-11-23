"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/app/(site)/account/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, {});
  return (
    <form action={action} className="mt-8 space-y-5 rounded-[2rem] bg-parchment-100 p-7">
      <Field label="New password" htmlFor="np" error={state.fieldErrors?.password} hint="At least 8 characters">
        <Input id="np" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {state.error && <p className="text-sm font-semibold text-chilli-600" role="alert">{state.error}</p>}
      {state.message && <p className="text-sm font-semibold text-leaf-600" role="status">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
