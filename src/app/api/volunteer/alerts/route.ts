import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";
import { buildLostAlertFeed } from "@/lib/cases";

export async function GET() {
  try {
    const session = await requireRole("volunteer", "admin");
    const eventId =
      session.role === "volunteer"
        ? session.eventId
        : undefined; // admins without a scoped event see nothing here; use the admin dashboard instead

    if (!eventId) return NextResponse.json({ people: [] });

    const people = await prisma.person.findMany({
      where: { eventId, status: "LOST" },
      include: { tags: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    const feed = buildLostAlertFeed(
      people.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        ageGroup: p.ageGroup,
        photoUrl: p.photoUrl,
        status: p.status,
        shortCode: p.tags[0]?.shortCode ?? null,
      }))
    );

    return NextResponse.json({ people: feed });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
