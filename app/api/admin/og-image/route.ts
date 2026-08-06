import { NextResponse } from "next/server";
import { setSocialImage, clearSocialImage, getSocialImage } from "@/app/lib/content";
import { checkImageUpload } from "@/app/lib/upload";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json((await getSocialImage()) ?? { src: null, custom: false });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const check = checkImageUpload(form.get("file"), 3 * 1024 * 1024);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const buf = Buffer.from(await check.file.arrayBuffer());
    await setSocialImage(buf.toString("base64"), check.type);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSocialImage();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to remove image" },
      { status: 500 }
    );
  }
}
