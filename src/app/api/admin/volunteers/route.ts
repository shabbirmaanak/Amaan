import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";

export async function GET() {
  try {
    await requireRole("admin");
    const volunteers = await prisma.volunteer.findMany({
      orderBy: { createdAt: "desc" },
      include: { event: { select: { name: true } } },
    });
    return NextResponse.json({ volunteers });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
