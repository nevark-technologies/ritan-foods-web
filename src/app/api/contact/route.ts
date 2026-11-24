import { NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/data";
import { adminEmail, sendEmail } from "@/lib/email/send";
import { contactNotificationEmail } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name.").max(80),
  email: z.string().trim().email("Please enter a valid email."),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => v || null)
    .refine((v) => !v || /^[+\d][\d\s-]{6,}$/.test(v), "Please enter a valid phone number."),
  message: z.string().trim().min(10, "A few more words, please.").max(3000),
  website: z.string().max(0).optional(), // honeypot
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages - please try again later or WhatsApp us." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    const errors = Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message]));
    return NextResponse.json({ errors }, { status: 422 });
  }
  const { website: _honeypot, ...data } = parsed.data;
  void _honeypot;
  const saved = await store.createContactMessage(data);
  const settings = await store.getSettings();
  const mail = contactNotificationEmail(saved, settings);
  await sendEmail({ to: adminEmail(), subject: mail.subject, html: mail.html, replyTo: saved.email });
  return NextResponse.json({ ok: true });
}
