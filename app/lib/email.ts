import nodemailer from "nodemailer";
import type { Order } from "./types";

export function emailConfigured(): boolean {
  return (
    Boolean(process.env.RESEND_API_KEY) ||
    Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  );
}

function gmailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transporter: any = null;

function getTransport() {
  if (!gmailConfigured()) return null;
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

// Sends via Resend (just an API key — no Gmail setup) when RESEND_API_KEY is
// present; otherwise falls back to Gmail SMTP. Throws on failure.
async function deliver(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  siteName: string;
}): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || `${opts.siteName} <onboarding@resend.dev>`,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        reply_to: opts.replyTo || undefined,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend error ${res.status}: ${await res.text().catch(() => "")}`);
    }
    return;
  }

  const t = getTransport();
  if (!t) throw new Error("email-not-configured");
  await t.sendMail({
    from: `"${opts.siteName}" <${process.env.GMAIL_USER}>`,
    to: opts.to,
    replyTo: opts.replyTo || undefined,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

export async function sendOrderEmail(
  order: Order,
  to: string,
  siteName: string,
  kind: "new" | "edited" | "cancelled" = "new"
): Promise<{ sent: boolean; reason?: string }> {
  if (!emailConfigured()) return { sent: false, reason: "email-not-configured" };
  const heading =
    kind === "cancelled"
      ? "Order CANCELLED by customer"
      : kind === "edited"
        ? "Order updated by customer"
        : "New order request";

  const rows = order.answers.filter((a) => a.value && a.value.trim().length > 0);
  const total = computeOrderTotal(order);
  const totalLine = total > 0 ? `\n\nORDER TOTAL: $${total.toFixed(2)}` : "";

  const text =
    `${heading} from the ${siteName} website\n` +
    `----------------------------------------\n` +
    rows.map((a) => `${a.label}: ${a.value.replace(/, /g, "\n  - ")}`).join("\n") +
    totalLine +
    `\n\nReceived: ${order.createdAt}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3a2b1f">
      <h2 style="color:#c2607a;margin:0 0 4px">${heading}</h2>
      <p style="color:#8a7461;margin:0 0 16px">via the ${siteName} website</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            (a) =>
              `<tr><td style="padding:8px 10px;background:#faf0ec;font-weight:bold;width:170px;border:1px solid #eee;vertical-align:top">${escapeHtml(
                a.label
              )}</td><td style="padding:8px 10px;border:1px solid #eee">${escapeHtml(
                a.value
              ).replace(/, /g, "<br>")}</td></tr>`
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

  const subjectPrefix =
    kind === "cancelled" ? "Order cancelled" : kind === "edited" ? "Order updated" : "New order";
  await deliver({
    to,
    subject: `${subjectPrefix} — ${order.name || "Website"}`,
    text,
    html,
    replyTo: order.email || undefined,
    siteName,
  });

  return { sent: true };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Prefer the authoritative "Grand Total" answer; otherwise sum priced options,
// skipping any total field so it isn't double-counted.
function computeOrderTotal(order: Order): number {
  const isTotalLabel = (label: string) => /\btotal\b/i.test(label);
  const grand = order.answers.find((a) => isTotalLabel(a.label));
  const grandMatch = grand?.value.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (grandMatch) return parseFloat(grandMatch[1]);
  let total = 0;
  for (const a of order.answers) {
    if (isTotalLabel(a.label)) continue;
    const matches = a.value.match(/\$\s*\d+(?:\.\d{1,2})?/g) || [];
    for (const m of matches) total += parseFloat(m.replace(/[^\d.]/g, ""));
  }
  return total;
}

/**
 * Confirmation sent to the CUSTOMER when they edit or cancel their own order.
 * `editUrl` (present for edits) lets them keep editing until they pick it up.
 */
export async function sendCustomerOrderEmail(
  order: Order,
  siteName: string,
  kind: "edited" | "cancelled",
  opts: { phoneDisplay?: string; editUrl?: string; replyTo?: string } = {}
): Promise<{ sent: boolean; reason?: string }> {
  if (!emailConfigured()) return { sent: false, reason: "email-not-configured" };
  if (!order.email || !order.email.trim()) return { sent: false, reason: "no-customer-email" };

  const cancelled = kind === "cancelled";
  const heading = cancelled ? "Your order has been cancelled" : "Your order has been updated";
  const intro = cancelled
    ? `Hi ${order.name || "there"}, we've cancelled your order at ${siteName} as requested. If this was a mistake, just place a new order or get in touch.`
    : `Hi ${order.name || "there"}, thanks — we've saved the changes to your order at ${siteName}. Here's your updated order:`;

  const rows = order.answers.filter(
    (a) => a.value && a.value.trim().length > 0 && !/\btotal\b/i.test(a.label)
  );
  const total = computeOrderTotal(order);
  const phoneLine = opts.phoneDisplay ? ` For anything urgent, call ${opts.phoneDisplay}.` : "";

  const text =
    `${heading}\n${"-".repeat(heading.length)}\n\n${intro}${phoneLine}\n\n` +
    (cancelled
      ? ""
      : rows.map((a) => `${a.label}: ${a.value.replace(/, /g, "\n  - ")}`).join("\n") +
        (total > 0 ? `\n\nORDER TOTAL: $${total.toFixed(2)}` : "") +
        (opts.editUrl ? `\n\nNeed another change? Edit your order here:\n${opts.editUrl}` : "")) +
    `\n`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3a2b1f">
      <h2 style="color:#c2607a;margin:0 0 6px">${heading}</h2>
      <p style="color:#5a3220;margin:0 0 18px;line-height:1.6">${escapeHtml(intro)}${escapeHtml(
        phoneLine
      )}</p>
      ${
        cancelled
          ? ""
          : `<table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            (a) =>
              `<tr><td style="padding:8px 10px;background:#faf0ec;font-weight:bold;width:170px;border:1px solid #eee;vertical-align:top">${escapeHtml(
                a.label
              )}</td><td style="padding:8px 10px;border:1px solid #eee">${escapeHtml(a.value).replace(
                /, /g,
                "<br>"
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
      ${
        opts.editUrl
          ? `<p style="margin:22px 0 4px;color:#8a7461;font-size:13px">Need another change?</p>
             <a href="${opts.editUrl}" style="display:inline-block;background:#c2607a;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:600">Edit your order</a>`
          : ""
      }`
      }
      <p style="margin-top:28px;color:#a3897b;font-size:13px">${escapeHtml(siteName)}</p>
    </div>`;

  await deliver({
    to: order.email,
    subject: `${cancelled ? "Your order was cancelled" : "Your order was updated"} — ${siteName}`,
    text,
    html,
    replyTo: opts.replyTo || undefined,
    siteName,
  });

  return { sent: true };
}

export async function sendContactEmail(
  msg: { name: string; email: string; phone: string; message: string },
  to: string,
  siteName: string
): Promise<{ sent: boolean }> {
  if (!emailConfigured()) return { sent: false };

  const text =
    `New message from the ${siteName} website\n` +
    `----------------------------------------\n` +
    `Name: ${msg.name}\n` +
    `Email: ${msg.email || "Not provided"}\n` +
    `Phone: ${msg.phone || "Not provided"}\n\n` +
    `${msg.message}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3a2b1f">
      <h2 style="color:#c2607a;margin:0 0 4px">New contact message</h2>
      <p style="color:#8a7461;margin:0 0 16px">via the ${siteName} website</p>
      <p><strong>Name:</strong> ${escapeHtml(msg.name)}<br/>
      <strong>Email:</strong> ${escapeHtml(msg.email || "Not provided")}<br/>
      <strong>Phone:</strong> ${escapeHtml(msg.phone || "Not provided")}</p>
      <p style="white-space:pre-wrap;background:#faf0ec;padding:14px;border-radius:8px">${escapeHtml(
        msg.message
      )}</p>
    </div>`;

  await deliver({
    to,
    subject: `New message — ${msg.name || "Website"}`,
    text,
    html,
    replyTo: msg.email || undefined,
    siteName,
  });
  return { sent: true };
}
