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

  const rows = order.answers.filter((a) => a.value && a.value.trim().length > 0);

  let total = 0;
  for (const a of order.answers) {
    const matches = a.value.match(/\$\s*\d+(?:\.\d{1,2})?/g) || [];
    for (const m of matches) total += parseFloat(m.replace(/[^\d.]/g, ""));
  }
  const totalLine = total > 0 ? `\n\nORDER TOTAL: $${total.toFixed(2)}` : "";

  const text =
    `New order request from the ${siteName} website\n` +
    `----------------------------------------\n` +
    rows.map((a) => `${a.label}: ${a.value}`).join("\n") +
    totalLine +
    `\n\nReceived: ${order.createdAt}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3a2b1f">
      <h2 style="color:#c2607a;margin:0 0 4px">New order request</h2>
      <p style="color:#8a7461;margin:0 0 16px">via the ${siteName} website</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            (a) =>
              `<tr><td style="padding:8px 10px;background:#faf0ec;font-weight:bold;width:170px;border:1px solid #eee;vertical-align:top">${escapeHtml(
                a.label
              )}</td><td style="padding:8px 10px;border:1px solid #eee">${escapeHtml(
                a.value
              )}</td></tr>`
          )
          .join("")}
      </table>
      ${
        total > 0
          ? `<p style="margin:16px 0 0;font-size:18px"><strong>Order total: <span style="color:#c2607a">$${total.toFixed(
              2
            )}</span></strong></p>`
          : ""
      }
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
