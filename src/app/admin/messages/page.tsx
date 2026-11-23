import { Mail, Phone } from "lucide-react";
import { AdminHeader, Card } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";
import { store } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function AdminMessages() {
  await requireAdmin();
  const messages = await store.listContactMessages();
  return (
    <>
      <AdminHeader title="Messages" subtitle="Enquiries from the contact form (also emailed to you)" />
      {messages.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">No messages yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-forest-900">{m.name}</p>
                  <p className="mt-1 flex flex-wrap gap-4 text-sm text-forest-800">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5">
                      <Mail className="size-4" /> {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5">
                        <Phone className="size-4" /> {m.phone}
                      </a>
                    )}
                  </p>
                </div>
                <span className="text-xs text-ink-500">{formatDate(m.createdAt, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{m.message}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
