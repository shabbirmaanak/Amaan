export type CaseStatus = "FOUND" | "FAMILY_NOTIFIED" | "REUNITED";
export type PersonStatus = "ACTIVE" | "LOST" | "REUNITED";

/** Ordered pipeline a case moves through once a volunteer starts handling it. */
const CASE_ORDER: CaseStatus[] = ["FOUND", "FAMILY_NOTIFIED", "REUNITED"];

/** Only forward moves (or staying put) are allowed; a case never regresses. */
export function canTransitionCase(from: CaseStatus, to: CaseStatus): boolean {
  return CASE_ORDER.indexOf(to) >= CASE_ORDER.indexOf(from);
}

export function nextCaseStatus(current: CaseStatus): CaseStatus | null {
  const idx = CASE_ORDER.indexOf(current);
  return idx < CASE_ORDER.length - 1 ? CASE_ORDER[idx + 1] : null;
}

/**
 * A scan is high priority whenever the person has an active LOST report,
 * so a volunteer desk can't miss it among routine finder scans.
 */
export function isHighPriorityScan(personStatus: PersonStatus): boolean {
  return personStatus === "LOST";
}

export type AlertablePerson = {
  id: string;
  firstName: string;
  ageGroup: string;
  photoUrl: string | null;
  status: PersonStatus;
};

/** Filters+sorts a set of people into the on-duty volunteer alert feed: LOST first, most recent first. */
export function buildLostAlertFeed<T extends AlertablePerson & { updatedAt?: Date }>(
  people: T[]
): T[] {
  return people
    .filter((p) => p.status === "LOST")
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0));
}
