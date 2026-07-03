import { NextResponse } from "next/server";
import { setMenuImage, clearMenuImage } from "@/app/lib/content";
import { checkImageUpload } from "@/app/lib/upload";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const form = await req.formData();
    const check = checkImageUpload(form.get("file"), MAX_BYTES);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const buf = Buffer.from(await check.file.arrayBuffer());
    const url = await setMenuImage(Number(id), buf.toString("base64"), check.type);
    return NextResponse.json({ ok: true, image: url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await clearMenuImage(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to remove image" },
      { status: 500 }
    );
  }
}
