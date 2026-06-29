import { NextResponse } from "next/server";
import { updateOrderStatus, deleteOrder } from "@/app/lib/orders";
import type { Order } from "@/app/lib/types";

export const runtime = "nodejs";

const STATUSES: Order["status"][] = ["new", "confirmed", "completed", "cancelled"];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await req.json();
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateOrderStatus(Number(id), status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteOrder(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete order" },
      { status: 500 }
    );
  }
}
