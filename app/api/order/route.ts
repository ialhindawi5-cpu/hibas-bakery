import { NextResponse } from "next/server";
import { createOrder, type NewOrder } from "@/app/lib/orders";
import { getSettings, getQuestions } from "@/app/lib/content";
import { sendOrderEmail } from "@/app/lib/email";
import { rateLimit, clientIp } from "@/app/lib/rateLimit";
import type { Order, OrderAnswer } from "@/app/lib/types";

export const runtime = "nodejs";

type IncomingAnswer = { qkey?: string; label?: string; value?: unknown };

export async function POST(req: Request) {
  // Limit order spam: 6 submissions per 10 minutes per IP.
  const rl = await rateLimit(`order:${clientIp(req)}`, 6, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You've sent several requests already. Please wait a few minutes before trying again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { answers?: IncomingAnswer[]; hp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success without saving.
  if (body.hp && body.hp.trim()) {
    return NextResponse.json({ ok: true, saved: false, emailed: false });
  }

  const incoming = Array.isArray(body.answers) ? body.answers : [];
  // Map submitted answers by question key.
  const byKey = new Map<string, string>();
  for (const a of incoming) {
    if (a && a.qkey) byKey.set(String(a.qkey), a.value == null ? "" : String(a.value));
  }

  const questions = await getQuestions({ activeOnly: true });

  // Validate required questions.
  for (const q of questions) {
    if (q.required && !(byKey.get(q.qkey) || "").trim()) {
      return NextResponse.json({ error: `Missing field: ${q.label}` }, { status: 400 });
    }
  }

  // Build the labelled answer list and the role-mapped fields.
  const answers: OrderAnswer[] = [];
  const role: Record<string, string> = {};
  for (const q of questions) {
    const value = (byKey.get(q.qkey) || "").trim();
    answers.push({ label: q.label, value });
    if (q.role !== "none") role[q.role] = value;
  }

  // The order form sends a computed total (not tied to a question); include it
  // in the saved order and email so the bakery sees the estimated amount.
  const totalValue = (byKey.get("order_total") || "").trim();
  if (totalValue) {
    answers.push({ label: "Estimated total", value: totalValue });
  }

  const settings = await getSettings();

  // Enforce admin-set availability (can't be bypassed client-side).
  if (role.date && (settings.blockedDates || []).includes(role.date)) {
    return NextResponse.json(
      { error: "That pickup date isn't available. Please choose another date." },
      { status: 400 }
    );
  }
  if (
    role.time &&
    (settings.pickupSlots || []).length > 0 &&
    !(settings.pickupSlots || []).includes(role.time)
  ) {
    return NextResponse.json(
      { error: "That pickup time isn't available. Please choose a listed time slot." },
      { status: 400 }
    );
  }

  const newOrder: NewOrder = {
    name: role.name || "",
    phone: role.phone || "",
    email: role.email || "",
    pickupDate: role.date || "",
    pickupTime: role.time || "",
    answers,
  };

  let saved: Order | null = null;
  try {
    saved = await createOrder(newOrder);
  } catch (e) {
    console.error("Failed to save order:", e);
  }

  const orderForEmail: Order =
    saved ?? { id: 0, createdAt: new Date().toISOString(), status: "new", ...newOrder };

  let emailed = false;
  try {
    const r = await sendOrderEmail(orderForEmail, settings.orderEmail, settings.siteName);
    emailed = r.sent;
  } catch (e) {
    console.error("Failed to send order email:", e);
  }

  return NextResponse.json({ ok: true, saved: Boolean(saved), emailed });
}
