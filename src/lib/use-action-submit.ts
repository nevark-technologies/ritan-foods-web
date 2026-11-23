"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Submit handler for edit forms built on useActionState.
 * Dispatching inside a transition (instead of <form action>) skips React 19's
 * automatic form reset, so fields keep the values that were just saved and
 * the action's success message stays visible.
 */
export function submitWith(dispatch: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
}
