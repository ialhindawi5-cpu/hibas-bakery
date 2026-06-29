import { NextResponse } from "next/server";
import { setLogo, clearLogo } from "@/app/lib/content";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo must be under 3 MB" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    await setLogo(buf.toString("base64"), file.type || "image/png");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to upload logo" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearLogo();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to remove logo" },
      { status: 500 }
    );
  }
}
