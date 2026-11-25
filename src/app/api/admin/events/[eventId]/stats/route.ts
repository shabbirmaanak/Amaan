import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    await requireRole("admin");
    const { eventId } = await params;

    const [tagsIssued, scans, activeLostCases, reunitedCases, scansByMeetPoint] = await Promise.all([
      prisma.tag.count({ where: { eventId } }),
      prisma.scanLog.count({ where: { tag: { eventId } } }),
      prisma.person.count({ where: { eventId, status: "LOST" } }),
      prisma.case.findMany({
        where: { tag: { eventId }, status: "REUNITED", resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
      prisma.scanLog.groupBy({
        by: ["meetPointId"],
        where: { tag: { eventId }, meetPointId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const avgReuniteMs =
      reunitedCases.length > 0
        ? reunitedCases.reduce((sum, c) => sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()), 0) /
          reunitedCases.length
        : null;

    const meetPoints = await prisma.meetPoint.findMany({ where: { eventId } });
    const meetPointNameById = new Map(meetPoints.map((mp) => [mp.id, mp.name]));

    return NextResponse.json({
      tagsIssued,
      scans,
      activeLostCases,
      avgTimeToReuniteMinutes: avgReuniteMs !== null ? Math.round(avgReuniteMs / 60000) : null,
      casesByMeetPoint: scansByMeetPoint.map((row) => ({
        meetPoint: meetPointNameById.get(row.meetPointId!) ?? "Unknown",
        count: row._count._all,
      })),
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
