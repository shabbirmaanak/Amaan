import { describe, it, expect } from "vitest";
import { isTagExpired, effectiveTagStatus, isTagUsable } from "@/lib/tags";

describe("tag expiry", () => {
  const eventEnd = new Date("2026-01-10T18:00:00Z");

  it("is not expired before the event ends", () => {
    const tag = { status: "ACTIVE" as const, expiresAt: eventEnd };
    const before = new Date("2026-01-10T17:59:59Z");
    expect(isTagExpired(tag, before)).toBe(false);
    expect(effectiveTagStatus(tag, before)).toBe("ACTIVE");
    expect(isTagUsable(tag, before)).toBe(true);
  });

  it("expires automatically the instant the event ends, even if stored status is ACTIVE", () => {
    const tag = { status: "ACTIVE" as const, expiresAt: eventEnd };
    const after = new Date("2026-01-10T18:00:01Z");
    expect(isTagExpired(tag, after)).toBe(true);
    expect(effectiveTagStatus(tag, after)).toBe("EXPIRED");
    expect(isTagUsable(tag, after)).toBe(false);
  });

  it("a LOST tag still reports expired once the event has ended", () => {
    const tag = { status: "LOST" as const, expiresAt: eventEnd };
    const after = new Date("2026-01-11T00:00:00Z");
    expect(effectiveTagStatus(tag, after)).toBe("EXPIRED");
    expect(isTagUsable(tag, after)).toBe(false);
  });

  it("a LOST tag before expiry is still usable and reports LOST", () => {
    const tag = { status: "LOST" as const, expiresAt: eventEnd };
    const before = new Date("2026-01-10T12:00:00Z");
    expect(effectiveTagStatus(tag, before)).toBe("LOST");
    expect(isTagUsable(tag, before)).toBe(true);
  });
});
