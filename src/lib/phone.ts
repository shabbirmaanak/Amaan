/**
 * Phone numbers must never reach a finder-facing response. These helpers give
 * every serializer a single, testable choke point instead of ad-hoc field picking.
 */

/** Masks a phone number for logs/audit trails, e.g. "+919876543210" -> "+9198***3210". */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "*".repeat(phone.length);
  const visibleStart = phone.slice(0, 4);
  const visibleEnd = phone.slice(-4);
  return `${visibleStart}${"*".repeat(Math.max(0, phone.length - 8))}${visibleEnd}`;
}

/** Fields that are safe to send to an unauthenticated finder. Anything else is stripped. */
export const FINDER_SAFE_PERSON_FIELDS = [
  "id",
  "firstName",
  "photoUrl",
  "ageGroup",
  "status",
] as const;

export type FinderSafePerson = Pick<
  Record<string, unknown> & {
    id: string;
    firstName: string;
    photoUrl: string | null;
    ageGroup: string;
    status: string;
  },
  (typeof FINDER_SAFE_PERSON_FIELDS)[number]
>;

/**
 * Builds the object a finder is allowed to see from a full Person record.
 * Deliberately an allow-list (not a delete-list) so a new schema field
 * defaults to hidden instead of leaking.
 */
export function toFinderSafePerson(person: {
  id: string;
  firstName: string;
  photoUrl: string | null;
  ageGroup: string;
  status: string;
}): FinderSafePerson {
  return {
    id: person.id,
    firstName: person.firstName,
    photoUrl: person.photoUrl,
    ageGroup: person.ageGroup,
    status: person.status,
  };
}

/** Throws if an object about to be sent to a finder contains a phone-shaped field. */
export function assertNoPhoneExposure(payload: unknown): void {
  const banned = ["phone", "guardianPhone", "backupPhone", "contactPhone"];
  const seen = new Set<unknown>();

  function walk(value: unknown): void {
    if (value === null || typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (banned.some((b) => key.toLowerCase().includes(b.toLowerCase()))) {
        throw new Error(`Refusing to expose phone-shaped field "${key}" to a finder`);
      }
      walk(val);
    }
  }

  walk(payload);
}
