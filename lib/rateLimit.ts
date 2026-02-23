/**
 * Simple in-memory rate limiter for Edge/Node API routes.
 *
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60_000, max: 10 });
 *   const result = limiter.check(identifier);
 *   if (!result.success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Window size in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup every 5 minutes to prevent unbounded memory growth
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }, 5 * 60 * 1000);
  }

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || now > entry.resetAt) {
        const resetAt = now + options.windowMs;
        store.set(identifier, { count: 1, resetAt });
        return { success: true, remaining: options.max - 1, resetAt };
      }

      if (entry.count >= options.max) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return {
        success: true,
        remaining: options.max - entry.count,
        resetAt: entry.resetAt,
      };
    },
  };
}

// Pre-configured limiters
/** Auth endpoints (login/register): 10 attempts per minute */
export const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** Booking creation: 5 bookings per minute per IP */
export const bookingLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

/** Payment initiation: 3 attempts per minute per user */
export const paymentLimiter = createRateLimiter({ windowMs: 60_000, max: 3 });
