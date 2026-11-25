import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";
import { findTagByIdentifier } from "@/lib/tagLookup";
import { ensureCaseOpen, advanceCase, getOpenCase } from "@/lib/caseService";
import { getNotifyProvider } from "@/lib/notify";
import { maskPhone } from "@/lib/phone";

const bodySchema = z.object({ status: z.enum(["FOUND", "FAMILY_NOTIFIED", "REUNITED"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const session = await requireRole("volunteer", "admin");
    const { code } = await params;
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const tag = await findTagByIdentifier(code);
    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }
    if (session.role === "volunteer" && session.eventId !== tag.eventId) {
      return NextResponse.json({ error: "Not your event" }, { status: 403 });
    }

    const existing = (await getOpenCase(tag.id)) ?? (await ensureCaseOpen(tag.personId, tag.id));
    const updated = await advanceCase(existing.id, parsed.data.status);

    if (parsed.data.status === "REUNITED") {
      const person = await prisma.person.findUnique({
        where: { id: tag.personId },
        include: { guardian: true },
      });
      if (person) {
        const result = await getNotifyProvider().send({
          to: person.guardian.phone,
          channel: "sms",
          body: `Good news: ${person.firstName} has been reunited with you. Thank you for using the Khidmat desk.`,
        });
        await prisma.notifyLog.create({
          data: {
            tagId: tag.id,
            channel: "sms",
            toMasked: maskPhone(person.guardian.phone),
            status: result.status,
          },
        });
      }
    }

    return NextResponse.json({ case: updated });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    if (err instanceof Error) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
