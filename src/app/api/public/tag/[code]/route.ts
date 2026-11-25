import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findTagByIdentifier } from "@/lib/tagLookup";
import { effectiveTagStatus } from "@/lib/tags";
import { toFinderSafePerson, assertNoPhoneExposure } from "@/lib/phone";
import { isHighPriorityScan } from "@/lib/cases";
import { checkRateLimit } from "@/lib/rateLimit";
import { dbRateLimitStore } from "@/lib/rateLimitDb";
import { getClientIp } from "@/lib/requestIp";
import { getSession } from "@/lib/session";
import { getOpenCase } from "@/lib/caseService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ip = getClientIp(req);

  const limit = await checkRateLimit(dbRateLimitStore, `public-scan:${ip}`, {
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const tag = await findTagByIdentifier(code);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const status = effectiveTagStatus(tag, new Date());
  if (status === "EXPIRED") {
    return NextResponse.json({ error: "This tag has expired. The event has ended." }, { status: 410 });
  }

  const session = await getSession();
  const isVolunteerOrAdmin =
    session &&
    ((session.role === "volunteer" && session.eventId === tag.eventId) || session.role === "admin");

  if (isVolunteerOrAdmin) {
    let volunteer = null;
    if (session!.role === "volunteer") {
      volunteer = await prisma.volunteer.findUnique({ where: { id: session!.sub } });
      if (!volunteer || volunteer.status !== "APPROVED") {
        return NextResponse.json({ error: "Volunteer account not approved." }, { status: 403 });
      }
    }

    await prisma.scanLog.create({
      data: {
        tagId: tag.id,
        role: session!.role === "admin" ? "ADMIN" : "VOLUNTEER",
        volunteerId: volunteer?.id,
      },
    });

    const openCase = await getOpenCase(tag.id);

    return NextResponse.json({
      viewer: "volunteer",
      tagId: tag.id,
      tagStatus: status,
      highPriority: isHighPriorityScan(tag.person.status),
      person: {
        id: tag.person.id,
        firstName: tag.person.firstName,
        photoUrl: tag.person.photoUrl,
        ageGroup: tag.person.ageGroup,
        languages: tag.person.languages,
        medicalNotes: tag.person.medicalNotes,
        status: tag.person.status,
      },
      guardian: { name: tag.person.guardian.name, phone: tag.person.guardian.phone },
      backupContacts: tag.person.backupContacts.map((c) => ({ name: c.name, phone: c.phone })),
      meetPoints: tag.event.meetPoints.map((mp) => ({ id: mp.id, name: mp.name })),
      helpDeskNumber: tag.event.helpDeskNumber,
      case: openCase ? { id: openCase.id, status: openCase.status } : null,
    });
  }

  await prisma.scanLog.create({
    data: { tagId: tag.id, role: "FINDER", ip },
  });

  const payload = {
    viewer: "finder",
    tagId: tag.id,
    tagStatus: status,
    person: toFinderSafePerson(tag.person),
    meetPoints: tag.event.meetPoints.map((mp) => ({ id: mp.id, name: mp.name })),
    helpDeskNumber: tag.event.helpDeskNumber,
  };

  // Defense in depth: even if a future edit to this route widens the payload,
  // refuse to ship anything phone-shaped to an unauthenticated finder.
  assertNoPhoneExposure(payload);

  return NextResponse.json(payload);
}
