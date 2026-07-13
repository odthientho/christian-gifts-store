// A fixed-window rate limiter held in process memory.
//
// LIMITATION, read before deploying: this counts requests per Node process. It
// stops password guessing from one machine against one instance, which is the
// realistic attack here. It does NOT hold across a horizontally scaled deploy —
// three instances means three times the allowance — and it resets on restart.
// If this store ever runs on more than one instance, move the counter to Redis
// (e.g. Upstash) and keep this interface.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired buckets so the map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
};

/**
 * Consume one unit against `key`.
 *
 * @param limit   requests allowed per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: limit - existing.count, retryAfter };
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is trivially spoofable unless a trusted proxy sets it, so
 * treat this as a throttling key, never as an identity or an audit record.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Limits, in one place so they are easy to see and tune. */
export const LIMITS = {
  /** Credential sign-in attempts per IP. */
  login: { limit: 8, windowMs: 10 * 60 * 1000 },
  /** Account creations per IP. */
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Checkout session creations per IP. Stripe sessions cost money to create. */
  checkout: { limit: 20, windowMs: 10 * 60 * 1000 },
} as const;
