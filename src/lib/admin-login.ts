import { createRateLimiter } from "./rate-limit";

/**
 * Login throttling. The limiter is per serverless instance; a platform/WAF
 * rate limit is still recommended for a public deployment.
 */
export const LOGIN_RATE_LIMIT = 5;
export const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

export const loginRateLimiter = createRateLimiter(LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);

export function loginClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return ip.slice(0, 128);
}

export function checkLoginRateLimit(request: Request) {
  return loginRateLimiter.check(loginClientKey(request));
}
