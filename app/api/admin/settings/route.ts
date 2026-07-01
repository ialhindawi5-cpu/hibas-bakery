import { NextResponse } from "next/server";
import { getDraftSettings, saveDraft } from "@/app/lib/content";

export const runtime = "nodejs";

// Admin reads/writes the DRAFT; the public site reads the published version.
export async function GET() {
  return NextResponse.json(await getDraftSettings());
}

export async function PUT(req: Request) {
  try {
    const patch = await req.json();
    const updated = await saveDraft(patch);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save draft" },
      { status: 500 }
    );
  }
}
