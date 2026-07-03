// Server-side verification for Cloudflare Turnstile tokens.
//
// Turnstile is OPTIONAL: if TURNSTILE_SECRET_KEY isn't configured, verification
// is skipped so the app keeps working before Cloudflare is set up. Once the
// secret is set, a valid token is required.

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured — don't block
  if (!token) return false;

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    // If Cloudflare is unreachable, fail closed (a configured challenge should
    // not be silently bypassed).
    return false;
  }
}
