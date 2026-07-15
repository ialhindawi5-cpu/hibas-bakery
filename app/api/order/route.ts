import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createOrder, type NewOrder, type OrderFormState } from "@/app/lib/orders";
import { getSettings, getQuestions } from "@/app/lib/content";
import { sendOrderEmail } from "@/app/lib/email";
import { rateLimit, clientIp } from "@/app/lib/rateLimit";
import { buildOrder, type IncomingAnswer } from "@/app/lib/orderBuild";
import type { Order } from "@/app/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Limit order spam: 6 submissions per 10 minutes per IP.
  const rl = await rateLimit(`order:${clientIp(req)}`, 6, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You've sent several requests already. Please wait a few minutes before trying again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { answers?: IncomingAnswer[]; hp?: string; formState?: OrderFormState };
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
  const questions = await getQuestions({ activeOnly: true });
  const settings = await getSettings();

  const built = buildOrder(incoming, questions, settings);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }
  const newOrder: NewOrder = built.newOrder;

  const editToken = randomUUID();
  let saved: Order | null = null;
  try {
    saved = await createOrder(newOrder, editToken, body.formState);
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

  return NextResponse.json({
    ok: true,
    saved: Boolean(saved),
    emailed,
    // Give the customer a private link to edit until the order is picked up.
    editToken: saved ? editToken : null,
  });
}
