import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/app/lib/auth";
import { verifyAdminCredentials } from "@/app/lib/users";
import { rateLimit, clientIp } from "@/app/lib/rateLimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // Throttle login attempts to slow brute-force: 8 per 10 minutes per IP.
  const rl = await rateLimit(`login:${clientIp(req)}`, 8, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = String(body.username || "").trim();
  if (!(await verifyAdminCredentials(username, String(body.password || "")))) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
