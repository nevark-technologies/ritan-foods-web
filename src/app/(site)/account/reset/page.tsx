import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordForm } from "@/components/account/PasswordForm";
import { AccountFrame } from "@/components/account/AccountShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPage() {
  return (
    <PageTransition>
      <AccountFrame>
        <div className="container-x max-w-md">
          <h1 className="font-display text-display-md text-forest-900">Choose a new password</h1>
          <Suspense fallback={<div className="skeleton mt-8 h-48 rounded-[2rem]" />}>
            <Gate />
          </Suspense>
        </div>
      </AccountFrame>
    </PageTransition>
  );
}

async function Gate() {
  await requireUser("/account/reset");
  return <PasswordForm />;
}
