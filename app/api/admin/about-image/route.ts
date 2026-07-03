import { NextResponse } from "next/server";
import { setAboutImage, clearAboutImage } from "@/app/lib/content";
import { checkImageUpload } from "@/app/lib/upload";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const check = checkImageUpload(form.get("file"), MAX_BYTES);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const buf = Buffer.from(await check.file.arrayBuffer());
    const url = await setAboutImage(buf.toString("base64"), check.type);
    return NextResponse.json({ ok: true, image: url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearAboutImage();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to reset image" },
      { status: 500 }
    );
  }
}
