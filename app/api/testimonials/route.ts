import { NextResponse } from "next/server";
import { createTestimonial } from "@/app/lib/testimonials";
import { rateLimit, clientIp } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rl = await rateLimit(`testimonial:${clientIp(req)}`, 4, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You've submitted a few reviews already. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { name?: string; quote?: string; rating?: unknown; hp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: silently drop bot submissions.
  if (body.hp && body.hp.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = String(body.name || "").trim();
  const quote = String(body.quote || "").trim();
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating)) || 5));

  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!quote)
    return NextResponse.json({ error: "Please write your review." }, { status: 400 });
  if (quote.length > 1000)
    return NextResponse.json({ error: "Your review is too long." }, { status: 400 });

  try {
    await createTestimonial({ name, quote, rating });
  } catch (e) {
    console.error("Failed to save testimonial:", e);
    return NextResponse.json(
      { error: "Sorry, we couldn't submit your review. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
