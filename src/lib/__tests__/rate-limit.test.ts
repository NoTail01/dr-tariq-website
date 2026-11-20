import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit within a window", () => {
    const limiter = createRateLimiter(3, 1000);
    expect(limiter.check("client-a", 0).allowed).toBe(true);
    expect(limiter.check("client-a", 10).allowed).toBe(true);
    expect(limiter.check("client-a", 20).allowed).toBe(true);
    expect(limiter.check("client-a", 30).allowed).toBe(false);
  });

  it("tracks clients independently", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.check("client-a", 0).allowed).toBe(true);
    expect(limiter.check("client-a", 1).allowed).toBe(false);
    expect(limiter.check("client-b", 1).allowed).toBe(true);
  });

  it("releases slots after the window has passed", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.check("client-a", 0).allowed).toBe(true);
    expect(limiter.check("client-a", 500).allowed).toBe(false);
    const released = limiter.check("client-a", 1001);
    expect(released.allowed).toBe(true);
    expect(released.retryAfterSeconds).toBe(0);
  });

  it("returns a positive retry-after while blocked", () => {
    const limiter = createRateLimiter(1, 60_000);
    limiter.check("client-a", 0);
    const blocked = limiter.check("client-a", 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });
});
