import "server-only";
import { store } from "@/lib/data";
import type { Order } from "@/lib/data/types";
import { adminEmail, sendEmail } from "@/lib/email/send";
import { adminNewOrderEmail, orderConfirmationEmail, orderShippedEmail } from "@/lib/email/templates";

/** Customer confirmation + admin alert for a newly confirmed order. */
export async function notifyOrderConfirmed(order: Order) {
  const settings = await store.getSettings();
  const customer = orderConfirmationEmail(order, settings);
  const admin = adminNewOrderEmail(order, settings);
  await Promise.all([
    sendEmail({ to: order.email, subject: customer.subject, html: customer.html, replyTo: adminEmail() }),
    sendEmail({ to: adminEmail(), subject: admin.subject, html: admin.html, replyTo: order.email }),
  ]);
}

export async function notifyOrderShipped(order: Order) {
  const settings = await store.getSettings();
  const mail = orderShippedEmail(order, settings);
  await sendEmail({ to: order.email, subject: mail.subject, html: mail.html, replyTo: adminEmail() });
}
