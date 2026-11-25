import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";
import { createPersonSchema } from "@/lib/validation";
import { createTagForPerson } from "@/lib/tagService";

export async function GET() {
  try {
    const session = await requireRole("guardian");
    const people = await prisma.person.findMany({
      where: { guardianId: session.sub, deletedAt: null },
      include: {
        tags: { orderBy: { createdAt: "desc" }, take: 1 },
        backupContacts: { orderBy: { order: "asc" } },
        event: { select: { id: true, name: true, endAt: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ people });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("guardian");
    const parsed = createPersonSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }
    const data = parsed.data;

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event || event.status !== "ACTIVE") {
      return NextResponse.json({ error: "Event not found or not open for registration." }, { status: 404 });
    }

    const person = await prisma.person.create({
      data: {
        eventId: event.id,
        guardianId: session.sub,
        firstName: data.firstName,
        photoUrl: data.photoUrl ?? null,
        ageGroup: data.ageGroup,
        languages: data.languages,
        medicalNotes: data.medicalNotes ?? null,
        backupContacts: {
          create: data.backupContacts.map((c, i) => ({ name: c.name, phone: c.phone, order: i + 1 })),
        },
      },
    });

    const tag = await createTagForPerson(person.id, event.id, event.endAt);

    return NextResponse.json({ person, tag }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
