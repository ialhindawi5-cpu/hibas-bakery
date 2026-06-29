import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  try {
    const patch = await req.json();
    const updated = await updateSettings(patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update settings" },
      { status: 500 }
    );
  }
}
