import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { isDemoMode } from "@/lib/data";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Ritan Admin" }, robots: { index: false, follow: false } };

/** The dashboard is always rendered per request for a signed-in admin. */
export const instant = false;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4efe3]" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <AdminShell user={user} demo={isDemoMode}>
      <Suspense fallback={<div className="skeleton h-96 rounded-3xl" />}>{children}</Suspense>
    </AdminShell>
  );
}
