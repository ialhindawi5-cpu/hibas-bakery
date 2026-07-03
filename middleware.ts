import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "hb_admin";

// Returns the verification secret, or null when it is unsafe to trust tokens.
// In production a missing AUTH_SECRET returns null so admin access fails closed
// (a hardcoded fallback in a public repo would let anyone forge a session).
function getSecret(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length > 0) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") return null;
  return new TextEncoder().encode("dev-insecure-secret-change-me");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass the current path to the root layout (so it can hide the public shell on /admin).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  const isLogin = pathname === "/admin/login" || pathname === "/api/admin/login";
  const isAdminPage = pathname.startsWith("/admin") && !isLogin;
  const isAdminApi = pathname.startsWith("/api/admin") && !isLogin;

  if (isAdminPage || isAdminApi) {
    const secret = getSecret();
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    let ok = false;
    if (token && secret) {
      try {
        await jwtVerify(token, secret);
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (!ok) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return pass();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|logo.png).*)"],
};
