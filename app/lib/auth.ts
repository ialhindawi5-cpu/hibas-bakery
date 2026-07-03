import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hb_admin";

// Returns the signing secret, or null when it is unsafe to sign/verify.
// In production we REFUSE to fall back to a hardcoded secret: the repo is
// public, so a known fallback would let anyone forge an admin session. When
// AUTH_SECRET is missing in production this returns null and all admin auth
// fails closed until the env var is set.
function getSecret(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length > 0) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") return null;
  return new TextEncoder().encode("dev-insecure-secret-change-me");
}

export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

export async function createSession(username: string): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token?: string): Promise<boolean> {
  const secret = getSecret();
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}
