import { NextResponse } from "next/server";
import { rateLimitStatus, rateLimitProbe } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY diagnostic: reports whether the rate limiter found its Upstash
 * credentials at runtime. Booleans and counts only — no values, no variable
 * names — so it is safe to leave public while debugging. Remove once the
 * limiter is confirmed working.
 */
export async function GET() {
  const probe = await rateLimitProbe();
  return NextResponse.json(
    { ...rateLimitStatus(), probe },
    { headers: { "Cache-Control": "no-store" } }
  );
}
