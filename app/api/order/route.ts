import { NextResponse } from "next/server";
import { createOrder, type NewOrder } from "@/app/lib/orders";
import { getSettings } from "@/app/lib/content";
import { sendOrderEmail } from "@/app/lib/email";
import type { Order } from "@/app/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const str = (v: unknown) => (v == null ? "" : String(v));
  const required = ["customerStatus", "name", "phone", "contactMethod", "pickupDate", "pickupTime"];
  for (const f of required) {
    if (!str(body[f]).trim()) {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 });
    }
  }
  const items = Array.isArray(body.items) ? body.items.map(str).filter(Boolean) : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Please select at least one item" }, { status: 400 });
  }

  const newOrder: NewOrder = {
    customerStatus: str(body.customerStatus),
    items,
    allergies: str(body.allergies),
    name: str(body.name),
    phone: str(body.phone),
    email: str(body.email),
    contactMethod: str(body.contactMethod),
    comments: str(body.comments),
    pickupDate: str(body.pickupDate),
    pickupTime: str(body.pickupTime),
  };

  const settings = await getSettings();

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
