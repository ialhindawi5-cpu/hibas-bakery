import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hb_admin";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-insecure-secret-change-me"
  );
}

export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME || "admin";
  const p = process.env.ADMIN_PASSWORD || "";
  return Boolean(p) && username === u && password === p;
}

export async function createSession(username: string): Promise<string> {
  return await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token?: string): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
