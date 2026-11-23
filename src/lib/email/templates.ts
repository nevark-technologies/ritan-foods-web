import type { ContactMessage, Order, StoreSettings } from "@/lib/data/types";
import { siteUrl } from "@/lib/site";

/** Email-safe HTML (tables + inline styles). All dynamic text is escaped. */

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const weight = (g: number) => (g >= 1000 ? `${g / 1000} kg` : `${g} g`);

const C = { forest: "#1E4D2B", forestDark: "#0F2A17", cream: "#FBF7EE", parchment: "#F3ECDC", ink: "#16201A", muted: "#5C665E", gold: "#C9A54C", leaf: "#4E8F2F" };

function layout(title: string, preheader: string, body: string, settings?: StoreSettings) {
  const contact = settings?.contact;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.parchment};font-family:Helvetica,Arial,sans-serif;color:${C.ink};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.parchment};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.cream};border-radius:22px;overflow:hidden;">
<tr><td style="background:${C.forestDark};padding:26px 32px;text-align:center;">
<img src="${siteUrl()}/images/brand/logo-email.png" width="120" alt="Ritan Foods" style="display:inline-block;width:120px;height:auto;border:0;">
<p style="margin:10px 0 0;color:#C6D9A3;font-size:12px;letter-spacing:2px;text-transform:uppercase;">A Taste of Tradition, A Touch of Love</p>
</td></tr>
<tr><td style="padding:34px 32px 10px;">${body}</td></tr>
<tr><td style="padding:24px 32px 32px;border-top:1px solid #e6dcc6;color:${C.muted};font-size:12px;line-height:1.6;">
${contact ? `Questions? Reply to this email, call ${esc(contact.phone)} or WhatsApp us.<br>${esc(contact.address)}<br>GSTIN ${esc(contact.gstin)}` : ""}
</td></tr>
</table>
<p style="color:${C.muted};font-size:11px;margin:16px 0 0;">© Ritan Foods · Made with tradition, shared with love.</p>
</td></tr></table></body></html>`;
}

function itemsTable(order: Order) {
  const rows = order.items
    .map(
      (it) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eee3cc;font-size:14px;">${esc(it.productName)} <span style="color:${C.muted};">· ${weight(it.weightG)} × ${it.quantity}</span></td>
<td style="padding:10px 0;border-bottom:1px solid #eee3cc;font-size:14px;text-align:right;white-space:nowrap;">${money(it.lineTotal)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;${bold ? "font-weight:bold;" : `color:${C.muted};`}">${label}</td><td style="padding:6px 0;font-size:14px;text-align:right;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
${line("Subtotal", money(order.subtotal))}
${order.discount ? line(`Discount${order.couponCode ? ` (${esc(order.couponCode)})` : ""}`, `−${money(order.discount)}`) : ""}
${line("Shipping", order.shippingFee ? money(order.shippingFee) : "Free")}
${order.codFee ? line("Cash on delivery fee", money(order.codFee)) : ""}
${line("Total", money(order.total), true)}</table>`;
}

function addressBlock(order: Order) {
  const a = order.shippingAddress;
  return `<p style="margin:0;font-size:14px;line-height:1.6;">${esc(a.fullName)}<br>${esc(a.line1)}${a.line2 ? `<br>${esc(a.line2)}` : ""}${a.landmark ? `<br>Landmark: ${esc(a.landmark)}` : ""}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.pincode)}<br>${esc(a.phone)}</p>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${C.forest};color:${C.cream};text-decoration:none;font-weight:bold;font-size:14px;padding:14px 26px;border-radius:999px;">${esc(label)}</a>`;

export function orderConfirmationEmail(order: Order, settings: StoreSettings) {
  const eta = order.shippingZone ? settings.zones[order.shippingZone]?.eta : null;
  const cod = order.paymentMethod === "cod";
  const body = `
<p style="margin:0;color:${C.leaf};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Order confirmed</p>
<h1 style="margin:8px 0 6px;font-family:Georgia,serif;font-weight:normal;font-size:30px;color:${C.forestDark};">Thank you, ${esc(order.customerName.split(" ")[0])}!</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${C.muted};">We've received your order <strong style="color:${C.ink};">${esc(order.orderNumber)}</strong> and our kitchen is getting it ready.${eta ? ` Estimated delivery: <strong style="color:${C.ink};">${esc(eta)}</strong> after dispatch.` : ""}${cod ? " Please keep the exact amount ready — this is a cash on delivery order." : ""}</p>
${itemsTable(order)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr>
<td valign="top" style="width:50%;padding-right:10px;"><p style="margin:0 0 6px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Delivering to</p>${addressBlock(order)}</td>
<td valign="top" style="width:50%;padding-left:10px;"><p style="margin:0 0 6px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Payment</p><p style="margin:0;font-size:14px;">${cod ? "Cash on delivery" : "Paid online (Razorpay)"}</p></td>
</tr></table>
<p style="margin:28px 0 8px;">${button(`${siteUrl()}/track-order?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.email)}`, "Track your order")}</p>
<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:${C.muted};">If anything arrives damaged or isn't right, tell us within 48 hours of delivery with a photo — we'll make it right.</p>`;
  return { subject: `Order ${order.orderNumber} confirmed — Ritan Foods`, html: layout("Order confirmed", `Thank you! Order ${order.orderNumber} is confirmed.`, body, settings) };
}

export function adminNewOrderEmail(order: Order, settings: StoreSettings) {
  const body = `
<p style="margin:0;color:${C.leaf};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">New order</p>
<h1 style="margin:8px 0 6px;font-family:Georgia,serif;font-weight:normal;font-size:28px;color:${C.forestDark};">${esc(order.orderNumber)} · ${money(order.total)}</h1>
<p style="margin:0 0 18px;font-size:14px;color:${C.muted};">${order.paymentMethod === "cod" ? "Cash on delivery" : "Paid via Razorpay"} · ${esc(order.customerName)} · ${esc(order.email)} · ${esc(order.phone)}</p>
${itemsTable(order)}
<p style="margin:22px 0 6px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};">Ship to</p>${addressBlock(order)}
${order.notes ? `<p style="margin:16px 0 0;font-size:13px;color:#A8322A;"><strong>Note:</strong> ${esc(order.notes)}</p>` : ""}
<p style="margin:26px 0 8px;">${button(`${siteUrl()}/admin/orders/${encodeURIComponent(order.orderNumber)}`, "Open in dashboard")}</p>`;
  return { subject: `New order ${order.orderNumber} — ${money(order.total)}`, html: layout("New order", `New order ${order.orderNumber}`, body, settings) };
}

export function trackingUrl(courier: string | null, tracking: string | null) {
  if (!tracking) return null;
  if (courier === "India Post") return "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx";
  if (courier === "DTDC") return "https://www.dtdc.in/trace.asp";
  return null;
}

export function orderShippedEmail(order: Order, settings: StoreSettings) {
  const url = trackingUrl(order.courier, order.trackingNumber);
  const eta = order.shippingZone ? settings.zones[order.shippingZone]?.eta : null;
  const body = `
<p style="margin:0;color:${C.leaf};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">On its way</p>
<h1 style="margin:8px 0 6px;font-family:Georgia,serif;font-weight:normal;font-size:30px;color:${C.forestDark};">Your order has shipped</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${C.muted};">Order <strong style="color:${C.ink};">${esc(order.orderNumber)}</strong> is with <strong style="color:${C.ink};">${esc(order.courier ?? "our courier")}</strong>${order.trackingNumber ? `, tracking number <strong style="color:${C.ink};">${esc(order.trackingNumber)}</strong>` : ""}.${eta ? ` Expected in ${esc(eta)}.` : ""}</p>
${url ? `<p style="margin:0 0 22px;">${button(url, `Track with ${order.courier}`)}</p>` : ""}
${itemsTable(order)}`;
  return { subject: `Shipped: order ${order.orderNumber} is on its way`, html: layout("Order shipped", `Order ${order.orderNumber} has shipped`, body, settings) };
}

export function contactNotificationEmail(msg: ContactMessage, settings: StoreSettings) {
  const body = `
<p style="margin:0;color:${C.leaf};font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">Website enquiry</p>
<h1 style="margin:8px 0 14px;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:${C.forestDark};">${esc(msg.name)}</h1>
<p style="margin:0 0 14px;font-size:14px;color:${C.muted};">${esc(msg.email)}${msg.phone ? ` · ${esc(msg.phone)}` : ""}</p>
<p style="margin:0;font-size:15px;line-height:1.7;white-space:pre-wrap;">${esc(msg.message)}</p>`;
  return { subject: `Website enquiry from ${msg.name}`, html: layout("New enquiry", `Enquiry from ${msg.name}`, body, settings) };
}
