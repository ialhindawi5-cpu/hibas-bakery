import { NextResponse } from "next/server";
import { listOrders } from "@/app/lib/orders";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await listOrders());
}
