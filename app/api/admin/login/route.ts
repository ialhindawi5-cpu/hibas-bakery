import { NextResponse } from "next/server";
import { checkCredentials, createSession, SESSION_COOKIE, authConfigured } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD." },
      { status: 503 }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!checkCredentials(String(body.username || ""), String(body.password || ""))) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const token = await createSession(String(body.username));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
