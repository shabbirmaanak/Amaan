import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Public: events currently open for registration, for the guardian's event picker. */
export async function GET() {
  const events = await prisma.event.findMany({
    where: { status: "ACTIVE" },
    orderBy: { startAt: "asc" },
    select: { id: true, name: true, startAt: true, endAt: true, helpDeskNumber: true },
  });
  return NextResponse.json({ events });
}
