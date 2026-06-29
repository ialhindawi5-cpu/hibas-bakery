import nodemailer from "nodemailer";
import type { Order } from "./types";

export function emailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

function getTransport() {
  if (!emailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendOrderEmail(
  order: Order,
  to: string,
  siteName: string
): Promise<{ sent: boolean; reason?: string }> {
  const t = getTransport();
  if (!t) return { sent: false, reason: "email-not-configured" };

  const rows: [string, string][] = [
    ["Customer", order.name],
    ["Status", order.customerStatus],
    ["Items", order.items.join(", ")],
    ["Allergies", order.allergies || "None provided"],
    ["Phone", order.phone],
    ["Email", order.email || "Not provided"],
    ["Preferred contact", order.contactMethod],
    ["Pickup date", order.pickupDate],
    ["Pickup time", order.pickupTime],
    ["Comments", order.comments || "None"],
  ];

  const text =
    `New order request from the ${siteName} website\n` +
    `----------------------------------------\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3a2b1f">
      <h2 style="color:#c2607a;margin:0 0 4px">New order request</h2>
      <p style="color:#8a7461;margin:0 0 16px">via the ${siteName} website</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px 10px;background:#faf0ec;font-weight:bold;width:160px;border:1px solid #eee">${k}</td><td style="padding:8px 10px;border:1px solid #eee">${escapeHtml(
                v
              )}</td></tr>`
          )
          .join("")}
      </table>
    </div>`;

  await t.sendMail({
    from: `"${siteName}" <${process.env.GMAIL_USER}>`,
    to,
    replyTo: order.email || undefined,
    subject: `New order — ${order.name || "Website"}`,
    text,
    html,
  });

  return { sent: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
