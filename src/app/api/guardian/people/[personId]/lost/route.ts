import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";

const bodySchema = z.object({ lost: z.boolean() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const session = await requireRole("guardian");
    const { personId } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person || person.guardianId !== session.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.person.update({
      where: { id: personId },
      data: { status: parsed.data.lost ? "LOST" : "ACTIVE" },
    });

    return NextResponse.json({ person: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
