import { NextResponse } from "next/server";
import { listHistory, saveHistory } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await listHistory());
}

export async function POST(req: Request) {
  try {
    const b = await req.json().catch(() => ({}));
    const label = String(b.label || "").trim() || "Saved version";
    await saveHistory(label);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save version" },
      { status: 500 }
    );
  }
}
