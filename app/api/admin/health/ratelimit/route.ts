import { NextResponse } from "next/server";
import { rateLimitStatus, rateLimitProbe } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports whether the rate limiter found working Upstash credentials at runtime:
 * which naming scheme matched, the configured host, a live Redis round-trip and
 * the current key count. No secrets — but it sits under /api/admin so the
 * middleware session check applies.
 *
 * Worth keeping: a wrong or read-only token makes the limiter look healthy from
 * the outside (configured, returning 429s) while storing nothing, and the 429s
 * come from the per-instance memory fallback. `probe.dbsize` increasing is the
 * only reliable confirmation that limits are actually durable.
 */
export async function GET() {
  const probe = await rateLimitProbe();
  return NextResponse.json(
    { ...rateLimitStatus(), probe },
    { headers: { "Cache-Control": "no-store" } }
  );
}
