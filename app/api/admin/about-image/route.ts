import { NextResponse } from "next/server";
import { setAboutImage, clearAboutImage } from "@/app/lib/content";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Please upload an image file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const url = await setAboutImage(buf.toString("base64"), file.type);
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
