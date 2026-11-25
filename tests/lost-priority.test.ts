import { describe, it, expect } from "vitest";
import { isHighPriorityScan, buildLostAlertFeed, canTransitionCase, nextCaseStatus } from "@/lib/cases";

describe("LOST priority", () => {
  it("flags a scan of a LOST person as high priority", () => {
    expect(isHighPriorityScan("LOST")).toBe(true);
  });

  it("does not flag ACTIVE or REUNITED people as high priority", () => {
    expect(isHighPriorityScan("ACTIVE")).toBe(false);
    expect(isHighPriorityScan("REUNITED")).toBe(false);
  });

  it("builds the on-duty alert feed with only LOST people, most recent first", () => {
    const people = [
      { id: "1", firstName: "A", ageGroup: "CHILD", photoUrl: null, status: "ACTIVE" as const, updatedAt: new Date("2026-01-10T10:00:00Z") },
      { id: "2", firstName: "B", ageGroup: "ELDER", photoUrl: null, status: "LOST" as const, updatedAt: new Date("2026-01-10T11:00:00Z") },
      { id: "3", firstName: "C", ageGroup: "CHILD", photoUrl: null, status: "LOST" as const, updatedAt: new Date("2026-01-10T12:00:00Z") },
    ];
    const feed = buildLostAlertFeed(people);
    expect(feed.map((p) => p.id)).toEqual(["3", "2"]);
  });

  it("only allows case status to move forward, never backward", () => {
    expect(canTransitionCase("FOUND", "FAMILY_NOTIFIED")).toBe(true);
    expect(canTransitionCase("FAMILY_NOTIFIED", "REUNITED")).toBe(true);
    expect(canTransitionCase("REUNITED", "FOUND")).toBe(false);
    expect(canTransitionCase("FAMILY_NOTIFIED", "FOUND")).toBe(false);
  });

  it("computes the next status in the Found -> Family notified -> Reunited pipeline", () => {
    expect(nextCaseStatus("FOUND")).toBe("FAMILY_NOTIFIED");
    expect(nextCaseStatus("FAMILY_NOTIFIED")).toBe("REUNITED");
    expect(nextCaseStatus("REUNITED")).toBeNull();
  });
});
