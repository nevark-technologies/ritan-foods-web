import "server-only";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Sends through Resend's REST API (free tier: 3,000/month). Without
 * RESEND_API_KEY (demo mode) the email is logged instead of sent.
 * Never throws - order flows must not fail because email did.
 */
export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; demo?: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const to = Array.isArray(msg.to) ? msg.to : [msg.to];
  if (!key) {
    console.info(`[email:demo] to=${to.join(",")} subject="${msg.subject}" (${msg.html.length} bytes)`);
    return { ok: true, demo: true };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Ritan Foods <onboarding@resend.dev>",
        to,
        subject: msg.subject,
        html: msg.html,
        reply_to: msg.replyTo,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false };
  }
}

/** All admin inboxes (ADMIN_EMAIL may list several, comma-separated) for order and contact alerts. */
export const adminEmails = () =>
  (process.env.ADMIN_EMAIL || "ritanfoods.co.in@gmail.com")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
/** The first admin inbox: the single reply-to address on customer emails. */
export const adminEmail = () => adminEmails()[0];
