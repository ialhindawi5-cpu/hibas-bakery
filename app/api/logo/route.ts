import { getLogoData } from "@/app/lib/content";

export const runtime = "nodejs";

export async function GET() {
  const logo = await getLogoData();
  if (!logo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(logo.data), {
    headers: {
      "Content-Type": logo.mime,
      "Cache-Control": "no-store",
    },
  });
}
