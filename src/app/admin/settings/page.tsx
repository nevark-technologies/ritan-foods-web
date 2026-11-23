import { AdminHeader } from "@/components/admin/AdminShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  await requireAdmin();
  const settings = await store.getSettings();
  return (
    <>
      <AdminHeader title="Settings" subtitle="Shipping, cash on delivery and store details" />
      <SettingsForm settings={settings} />
    </>
  );
}
