/**
 * Minimal in-memory fixed-window rate limiter for cost control. Per server
 * instance only: behind several instances, put a shared limiter (e.g. Redis or
 * the hosting platform's) in front of /api/analyze.
 */

export interface RateLimiter {
  /** Returns true if the request is allowed and records it. */
  take(key: string, now?: number): boolean;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    take(key, now = Date.now()) {
      const current = windows.get(key);
      if (!current || now - current.start >= windowMs) {
        if (windows.size >= maxKeys) windows.clear(); // bounded memory
        windows.set(key, { start: now, count: 1 });
        return true;
      }
      if (current.count >= limit) return false;
      current.count++;
      return true;
    },
  };
}
