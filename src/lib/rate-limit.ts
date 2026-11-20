/**
 * Small in-process sliding-window rate limiter.
 *
 * This is defense in depth for the public booking endpoint: it stops a single
 * client from flooding a serverless instance. Instances do not share state,
 * so this is not a distributed guarantee - an edge/WAF rate limit is still
 * recommended once the site is live.
 */

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export type RateLimiter = {
  check: (key: string, now?: number) => RateLimitResult;
};

const MAX_TRACKED_KEYS = 1000;

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      const cutoff = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((time) => time > cutoff);

      if (recent.length >= limit) {
        const retryAt = recent[0]! + windowMs;
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now) / 1000)),
        };
      }

      recent.push(now);
      hits.set(key, recent);

      // Bound memory even if an attacker rotates identifiers.
      if (hits.size > MAX_TRACKED_KEYS) {
        for (const [trackedKey, times] of hits) {
          if (times.length === 0 || times.every((time) => time <= cutoff)) {
            hits.delete(trackedKey);
          }
        }
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
