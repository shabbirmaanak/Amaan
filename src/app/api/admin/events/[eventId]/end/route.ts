import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";

/** Ends an event now: it stops accepting new registrations and all its tags expire immediately. */
export async function POST(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    await requireRole("admin");
    const { eventId } = await params;
    const now = new Date();

    await prisma.$transaction([
      prisma.event.update({ where: { id: eventId }, data: { status: "ENDED", endAt: now } }),
      prisma.tag.updateMany({
        where: { eventId, expiresAt: { gt: now } },
        data: { expiresAt: now },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
