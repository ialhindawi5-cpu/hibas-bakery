import { NextResponse } from "next/server";
import { getMenuImage } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await getMenuImage(Number(id));
  if (!img) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      // URL is versioned (?v=timestamp) on each upload, so this can cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
