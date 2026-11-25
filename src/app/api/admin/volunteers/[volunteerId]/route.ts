import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";

const bodySchema = z.object({ status: z.enum(["APPROVED", "REJECTED", "PENDING"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ volunteerId: string }> }) {
  try {
    await requireRole("admin");
    const { volunteerId } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const volunteer = await prisma.volunteer.update({
      where: { id: volunteerId },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ volunteer });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
