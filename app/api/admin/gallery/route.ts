import { NextResponse } from "next/server";
import { getGallery, addGalleryImage } from "@/app/lib/content";
import { checkImageUpload } from "@/app/lib/upload";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

export async function GET() {
  return NextResponse.json(await getGallery());
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const alt = String(form.get("alt") || "").trim();
    const check = checkImageUpload(form.get("file"), MAX_BYTES);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    const buf = Buffer.from(await check.file.arrayBuffer());
    const img = await addGalleryImage(buf.toString("base64"), check.type, alt || "Bakery photo");
    return NextResponse.json(img);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    );
  }
}
