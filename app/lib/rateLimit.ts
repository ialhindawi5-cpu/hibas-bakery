import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Durable, cross-instance rate limiting via Upstash Redis when configured.
// Falls back to an in-memory limiter (per instance) when the env vars are absent,
// so the app still works locally and before Upstash is set up.

/**
 * Resolve the Upstash REST credentials.
 *
 * The canonical names are UPSTASH_REDIS_REST_URL / _TOKEN, but Vercel's Storage
 * integration injects the same database under a KV_ name with a chosen prefix
 * (e.g. Redis_KV_REST_API_URL). Accept either so connecting a database from the
 * Vercel dashboard just works, with no credentials copied by hand.
 *
 * The token is always derived from the URL key that matched, so a URL and token
 * belonging to two different databases can never be paired — and the sibling
 * READ_ONLY_TOKEN, which cannot increment counters, is never picked up.
 */
type Credentials = { url: string; token: string; source: "canonical" | "kv" };

function upstashCredentials(): Credentials | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token, source: "canonical" };

  for (const key of Object.keys(process.env)) {
    if (!/(^|_)KV_REST_API_URL$/.test(key)) continue;
    const kvUrl = process.env[key];
    const kvToken = process.env[key.replace(/URL$/, "TOKEN")];
    if (kvUrl && kvToken) return { url: kvUrl, token: kvToken, source: "kv" };
  }
  return null;
}

const credentials = upstashCredentials();
const upstashConfigured = credentials !== null;

/**
 * Non-secret view of how the limiter resolved its configuration, for the
 * /api/health/ratelimit diagnostic. Deliberately exposes no values and no
 * variable names — only counts and which naming scheme matched.
 */
export function rateLimitStatus() {
  const envKeys = Object.keys(process.env);
  let host: string | null = null;
  try {
    if (credentials) host = new URL(credentials.url).host;
  } catch {
    host = "unparseable";
  }
  return {
    upstashConfigured,
    source: credentials?.source ?? null,
    // Hostname only — useless without the token, and it reveals whether the
    // configured URL points at the database we think it does.
    host,
    tokenLength: credentials?.token.length ?? 0,
    canonicalUrlPresent: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    canonicalTokenPresent: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
    kvUrlCandidates: envKeys.filter((k) => /(^|_)KV_REST_API_URL$/.test(k)).length,
    kvTokenCandidates: envKeys.filter((k) => /(^|_)KV_REST_API_TOKEN$/.test(k)).length,
    totalEnvKeys: envKeys.length,
  };
}

/**
 * Live round-trip against Redis. This is what distinguishes "credentials present"
 * from "credentials that actually work" — a wrong or read-only token authenticates
 * as configured but fails on write, and the limiter then silently uses memory.
 */
export async function rateLimitProbe(): Promise<{ ok: boolean; error?: string }> {
  if (!redis) return { ok: false, error: "no-credentials" };
  try {
    await redis.set("hb_rl:__probe__", "1", { ex: 60 });
    const value = await redis.get<string>("hb_rl:__probe__");
    return { ok: value === "1" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

const redis = credentials ? new Redis(credentials) : null;

// The in-memory fallback is per-instance. On serverless (Vercel) each request can
// land on a different instance, so counters never accumulate and the limits below
// are effectively NOT enforced. Warn loudly rather than fail silently.
if (!upstashConfigured && process.env.NODE_ENV === "production") {
  console.warn(
    "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN are not set. Falling back to an " +
      "in-memory limiter, which does not work across serverless instances — " +
      "order, contact and login rate limits are effectively disabled."
  );
}

const limiters = new Map<string, Ratelimit>();

function upstashLimiter(limit: number, windowSec: number): Ratelimit {
  const cacheKey = `${limit}:${windowSec}`;
  let l = limiters.get(cacheKey);
  if (!l) {
    l = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "hb_rl",
      analytics: false,
    });
    limiters.set(cacheKey, l);
  }
  return l;
}

// ---- in-memory fallback ----
type Entry = { count: number; reset: number };
const store = new Map<string, Entry>();

function memoryLimit(key: string, limit: number, windowMs: number) {
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

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; retryAfter: number }> {
  if (redis) {
    try {
      const r = await upstashLimiter(limit, Math.ceil(windowMs / 1000)).limit(key);
      return {
        ok: r.success,
        retryAfter: r.success ? 0 : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
      };
    } catch (e) {
      // Fall back to memory rather than failing open hard — but say so. Silently
      // swallowing this makes a bad token or wrong URL look exactly like a working
      // limiter: configured, returning 429s, writing nothing to Redis.
      console.error("[rateLimit] Upstash request failed, using in-memory fallback:", e);
      return memoryLimit(key, limit, windowMs);
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export function clientIpFromHeaders(h: { get(name: string): string | null }): string {
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") || "unknown";
}

export function clientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}
