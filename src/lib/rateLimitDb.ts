import { prisma } from "@/lib/db";
import type { RateLimitStore } from "@/lib/rateLimit";

/** Prisma-backed rate limit store: works across serverless function instances. */
export const dbRateLimitStore: RateLimitStore = {
  async getHits(key, now, windowMs) {
    const rows = await prisma.rateLimitHit.findMany({
      where: { key, createdAt: { gt: new Date(now - windowMs) } },
      select: { createdAt: true },
    });
    return rows.map((r) => r.createdAt.getTime());
  },
  async recordHit(key, now) {
    await prisma.rateLimitHit.create({ data: { key, createdAt: new Date(now) } });
  },
};
