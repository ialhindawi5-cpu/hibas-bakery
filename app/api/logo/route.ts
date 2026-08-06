import { getLogoData } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET() {
  const logo = await getLogoData();
  if (!logo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.mime,
      // URL is versioned (?v=<logo_updated_at>) by getLogoInfo, so this can cache
      // hard — the logo sits in the header of every page.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
