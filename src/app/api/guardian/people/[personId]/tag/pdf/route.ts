import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, unauthorizedResponse, UnauthorizedError } from "@/lib/authGuard";
import { generateTagCardPdf } from "@/lib/pdf/card";

export async function GET(_req: Request, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const session = await requireRole("guardian");
    const { personId } = await params;

    const person = await prisma.person.findUnique({
      where: { id: personId },
      include: { tags: { orderBy: { createdAt: "desc" }, take: 1 }, event: true },
    });

    if (!person || person.guardianId !== session.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const tag = person.tags[0];
    if (!tag) {
      return NextResponse.json({ error: "No tag generated yet" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const pdfBytes = await generateTagCardPdf({
      firstName: person.firstName,
      shortCode: tag.shortCode,
      tagId: tag.id,
      helpDeskNumber: person.event.helpDeskNumber,
      baseUrl,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${person.firstName}-safety-tag.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) return unauthorizedResponse();
    throw err;
  }
}
