// Lightweight in-memory rate limiter. Per serverless instance, so it's a
// friction layer (not a hard guarantee across a multi-instance deployment).
// For stricter global limits, back this with a shared store (e.g. Upstash).

type Entry = { count: number; reset: number };

const store = new Map<string, Entry>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const e = store.get(key);

  if (!e || now > e.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (e.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((e.reset - now) / 1000) };
  }

  e.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
