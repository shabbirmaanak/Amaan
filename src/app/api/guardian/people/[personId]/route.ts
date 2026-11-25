import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";

/** Guardians can delete a registered person's data at any time (consent can be withdrawn). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const session = await requireRole("guardian");
    const { personId } = await params;

    const person = await prisma.person.findUnique({ where: { id: personId } });
    if (!person || person.guardianId !== session.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.person.delete({ where: { id: personId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
