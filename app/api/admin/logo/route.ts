import { NextResponse } from "next/server";
import { setLogo, clearLogo } from "@/app/lib/content";
import { checkImageUpload } from "@/app/lib/upload";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const check = checkImageUpload(form.get("file"), 3 * 1024 * 1024);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const buf = Buffer.from(await check.file.arrayBuffer());
    await setLogo(buf.toString("base64"), check.type);
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
