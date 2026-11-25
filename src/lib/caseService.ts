import { prisma } from "@/lib/db";
import { canTransitionCase, type CaseStatus } from "@/lib/cases";

/** The case currently being handled for a tag, i.e. not yet reunited. */
export async function getOpenCase(tagId: string) {
  return prisma.case.findFirst({
    where: { tagId, status: { not: "REUNITED" } },
    orderBy: { createdAt: "desc" },
  });
}

/** Opens a case at FOUND if none is open yet, otherwise returns the existing one. */
export async function ensureCaseOpen(personId: string, tagId: string) {
  const existing = await getOpenCase(tagId);
  if (existing) return existing;

  return prisma.case.create({
    data: {
      personId,
      tagId,
      status: "FOUND",
      events: { create: { status: "FOUND" } },
    },
  });
}

/** Advances a case's status, recording history. Refuses to move the status backward. */
export async function advanceCase(caseId: string, to: CaseStatus, note?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.case.findUniqueOrThrow({ where: { id: caseId } });
    if (!canTransitionCase(current.status, to)) {
      throw new Error(`Cannot move case from ${current.status} back to ${to}`);
    }
    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        status: to,
        resolvedAt: to === "REUNITED" ? new Date() : current.resolvedAt,
        events: { create: { status: to, note } },
      },
    });
    if (to === "REUNITED") {
      await tx.person.update({ where: { id: updated.personId }, data: { status: "REUNITED" } });
    }
    return updated;
  });
}
