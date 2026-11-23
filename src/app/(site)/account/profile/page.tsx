import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileForm } from "@/components/account/AccountForms";
import { AccountFrame, AccountShell } from "@/components/account/AccountShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default function ProfilePage() {
  return (
    <PageTransition>
      <AccountFrame>
        <div className="container-x">
          <Suspense fallback={<div className="skeleton h-96 rounded-[2rem]" />}>
            <Profile />
          </Suspense>
        </div>
      </AccountFrame>
    </PageTransition>
  );
}

async function Profile() {
  const user = await requireUser("/account/profile");
  return (
    <AccountShell user={user} active="/account/profile" title="Profile">
      <ProfileForm user={user} />
    </AccountShell>
  );
}
