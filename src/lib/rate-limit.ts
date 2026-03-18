const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * In-memory rate limiter. Works per-instance (no Redis needed).
 * @param key - Unique identifier (e.g. userId or userId:action)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

/**
 * Throws if rate limit exceeded. Use in server actions.
 */
export function checkRateLimit(userId: string, action: string, limit: number, windowMs: number) {
  const { success } = rateLimit(`${userId}:${action}`, limit, windowMs);
  if (!success) {
    throw new Error("Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo.");
  }
}
