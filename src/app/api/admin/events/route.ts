import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";
import { createEventSchema } from "@/lib/validationAdmin";

export async function GET() {
  try {
    await requireRole("admin");
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { meetPoints: true, _count: { select: { people: true, tags: true, volunteers: true } } },
    });
    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
    const parsed = createEventSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
    }
    const { name, startAt, endAt, helpDeskNumber } = parsed.data;
    if (new Date(endAt) <= new Date(startAt)) {
      return NextResponse.json({ error: "Event end must be after start." }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: { name, startAt: new Date(startAt), endAt: new Date(endAt), helpDeskNumber, status: "ACTIVE" },
    });
    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
