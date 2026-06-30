import { NextResponse } from "next/server";
import { listMessages } from "@/app/lib/messages";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await listMessages());
}
