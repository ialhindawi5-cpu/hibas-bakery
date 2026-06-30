import { NextResponse } from "next/server";
import { getAboutImageData } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET() {
  const img = await getAboutImageData();
  if (!img) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
