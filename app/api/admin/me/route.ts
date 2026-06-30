import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ username: null });
  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "dev-insecure-secret-change-me"
    );
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ username: payload.sub || null });
  } catch {
    return NextResponse.json({ username: null });
  }
}
