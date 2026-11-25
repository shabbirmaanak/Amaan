import { prisma } from "@/lib/db";
import { generateShortCode } from "@/lib/ids";

/** Creates a tag for a person, retrying on the (rare) short-code collision. */
export async function createTagForPerson(personId: string, eventId: string, expiresAt: Date) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();
    try {
      return await prisma.tag.create({
        data: { personId, eventId, shortCode, expiresAt },
      });
    } catch (err: unknown) {
      const isUniqueViolation =
        typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
      if (!isUniqueViolation || attempt === 4) throw err;
    }
  }
  throw new Error("Could not generate a unique tag code");
}
