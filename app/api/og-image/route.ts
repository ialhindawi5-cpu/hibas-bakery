import { getSocialImageData } from "@/app/lib/content";

export const runtime = "nodejs";

// The social share (Open Graph) image. Fetched by Google, WhatsApp, Facebook
// and friends when a link to the site is shared.
export async function GET() {
  const img = await getSocialImageData();
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.mime,
      // URL is versioned (?v=<og_image_updated_at>), so this can cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
