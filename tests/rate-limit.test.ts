import { describe, it, expect } from "vitest";
import { InMemoryRateLimitStore, checkRateLimit } from "@/lib/rateLimit";

describe("rate limiting", () => {
  it("allows requests up to the limit and then blocks", async () => {
    const store = new InMemoryRateLimitStore();
    const opts = { limit: 3, windowMs: 60_000, now: 1_000_000 };

    const r1 = await checkRateLimit(store, "ip:1.2.3.4", opts);
    const r2 = await checkRateLimit(store, "ip:1.2.3.4", { ...opts });
    const r3 = await checkRateLimit(store, "ip:1.2.3.4", { ...opts });
    const r4 = await checkRateLimit(store, "ip:1.2.3.4", { ...opts });

    expect([r1.allowed, r2.allowed, r3.allowed]).toEqual([true, true, true]);
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterMs).toBeGreaterThan(0);
  });

  it("keys are independent: one IP being limited does not affect another", async () => {
    const store = new InMemoryRateLimitStore();
    const opts = { limit: 1, windowMs: 60_000, now: 1_000_000 };

    const a1 = await checkRateLimit(store, "ip:A", opts);
    const a2 = await checkRateLimit(store, "ip:A", opts);
    const b1 = await checkRateLimit(store, "ip:B", opts);

    expect(a1.allowed).toBe(true);
    expect(a2.allowed).toBe(false);
    expect(b1.allowed).toBe(true);
  });

  it("the window slides: old hits expire and allow new requests", async () => {
    const store = new InMemoryRateLimitStore();
    const windowMs = 60_000;

    const r1 = await checkRateLimit(store, "tag:T1", { limit: 1, windowMs, now: 0 });
    const r2 = await checkRateLimit(store, "tag:T1", { limit: 1, windowMs, now: 30_000 });
    const r3 = await checkRateLimit(store, "tag:T1", { limit: 1, windowMs, now: 61_000 });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(false); // still inside the 60s window from r1
    expect(r3.allowed).toBe(true); // r1's hit has aged out of the window
  });

  it("the notify button on a tag is limited independently of the finder scan page", async () => {
    const store = new InMemoryRateLimitStore();
    const now = 0;
    const scanOpts = { limit: 20, windowMs: 60_000, now };
    const notifyOpts = { limit: 2, windowMs: 60_000, now };

    await checkRateLimit(store, "scan:tagABC", scanOpts);
    const n1 = await checkRateLimit(store, "notify:tagABC", notifyOpts);
    const n2 = await checkRateLimit(store, "notify:tagABC", notifyOpts);
    const n3 = await checkRateLimit(store, "notify:tagABC", notifyOpts);

    expect(n1.allowed).toBe(true);
    expect(n2.allowed).toBe(true);
    expect(n3.allowed).toBe(false);
  });
});
