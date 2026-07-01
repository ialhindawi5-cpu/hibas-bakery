import { NextResponse } from "next/server";
import { publishSettings, discardDraft, hasUnpublishedChanges } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ hasUnpublished: await hasUnpublishedChanges() });
}

export async function POST() {
  try {
    await publishSettings();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await discardDraft();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Discard failed" },
      { status: 500 }
    );
  }
}
