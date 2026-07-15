import { NextResponse } from "next/server";
import {
  getOrderByToken,
  updateOrderByToken,
  cancelOrderByToken,
  type NewOrder,
  type OrderFormState,
} from "@/app/lib/orders";
import { getSettings, getQuestions } from "@/app/lib/content";
import { sendOrderEmail } from "@/app/lib/email";
import { buildOrder, isEditable, editDeadline, type IncomingAnswer } from "@/app/lib/orderBuild";
import type { Order } from "@/app/lib/types";

export const runtime = "nodejs";

// Update an existing order via its secret edit token, within the 3-hour window.
export async function PUT(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const existing = await getOrderByToken(token);
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!isEditable(existing.createdAt)) {
    return NextResponse.json(
      { error: "The editing window for this order has closed." },
      { status: 403 }
    );
  }

  let body: { answers?: IncomingAnswer[]; formState?: OrderFormState };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const incoming = Array.isArray(body.answers) ? body.answers : [];
  const questions = await getQuestions({ activeOnly: true });
  const settings = await getSettings();

  const built = buildOrder(incoming, questions, settings);
  if ("error" in built) {
    return NextResponse.json({ error: built.error }, { status: 400 });
  }
  const newOrder: NewOrder = built.newOrder;

  let saved: Order | null = null;
  try {
    saved = await updateOrderByToken(token, newOrder, body.formState);
  } catch (e) {
    console.error("Failed to update order:", e);
    return NextResponse.json({ error: "Could not save your changes." }, { status: 500 });
  }
  if (!saved) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Let the bakery know the customer changed their order.
  try {
    await sendOrderEmail(saved, settings.orderEmail, settings.siteName, "edited");
  } catch (e) {
    console.error("Failed to send order-update email:", e);
  }

  return NextResponse.json({ ok: true, editUntil: editDeadline(saved.createdAt) });
}

// Customer cancels their own order (soft-cancel), within the 3-hour window.
export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const existing = await getOrderByToken(token);
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (existing.status === "cancelled") {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }
  if (!isEditable(existing.createdAt)) {
    return NextResponse.json(
      { error: "The window to cancel this order online has closed." },
      { status: 403 }
    );
  }

  let cancelled: Order | null = null;
  try {
    cancelled = await cancelOrderByToken(token);
  } catch (e) {
    console.error("Failed to cancel order:", e);
    return NextResponse.json({ error: "Could not cancel your order." }, { status: 500 });
  }
  if (!cancelled) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const settings = await getSettings();
  try {
    await sendOrderEmail(cancelled, settings.orderEmail, settings.siteName, "cancelled");
  } catch (e) {
    console.error("Failed to send order-cancel email:", e);
  }

  return NextResponse.json({ ok: true });
}
