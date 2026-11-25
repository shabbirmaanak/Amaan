/**
 * Sliding-window rate limiter. Framework/storage agnostic so it can be unit
 * tested with an in-memory store and backed by the DB (or Redis later) in
 * production, where serverless functions can't share process memory.
 */
export interface RateLimitStore {
  /** Returns timestamps (ms epoch) of hits recorded for `key` within the window. */
  getHits(key: string, now: number, windowMs: number): Promise<number[]> | number[];
  /** Records a hit for `key` at `now`. */
  recordHit(key: string, now: number): Promise<void> | void;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, number[]>();

  getHits(key: string, now: number, windowMs: number): number[] {
    const all = this.hits.get(key) ?? [];
    const cutoff = now - windowMs;
    return all.filter((t) => t > cutoff);
  }

  recordHit(key: string, now: number): void {
    const all = this.hits.get(key) ?? [];
    all.push(now);
    this.hits.set(key, all);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  opts: { limit: number; windowMs: number; now?: number }
): Promise<RateLimitResult> {
  const now = opts.now ?? Date.now();
  const hits = await store.getHits(key, now, opts.windowMs);

  if (hits.length >= opts.limit) {
    const oldest = Math.min(...hits);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + opts.windowMs - now),
    };
  }

  await store.recordHit(key, now);
  return { allowed: true, remaining: opts.limit - hits.length - 1, retryAfterMs: 0 };
}
