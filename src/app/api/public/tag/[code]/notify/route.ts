import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { findTagByIdentifier } from "@/lib/tagLookup";
import { effectiveTagStatus } from "@/lib/tags";
import { checkRateLimit } from "@/lib/rateLimit";
import { dbRateLimitStore } from "@/lib/rateLimitDb";
import { getClientIp } from "@/lib/requestIp";
import { getNotifyProvider } from "@/lib/notify";
import { maskPhone } from "@/lib/phone";
import { ensureCaseOpen, advanceCase } from "@/lib/caseService";

const bodySchema = z.object({ meetPointId: z.string().uuid() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const ip = getClientIp(req);

  // Separate, tighter limit than the read-only scan page: this triggers real SMS sends.
  const perIp = await checkRateLimit(dbRateLimitStore, `notify-ip:${ip}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!perIp.allowed) {
    return NextResponse.json({ error: "Too many notifications sent. Please try again later." }, { status: 429 });
  }

  const tag = await findTagByIdentifier(code);
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const perTag = await checkRateLimit(dbRateLimitStore, `notify-tag:${tag.id}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!perTag.allowed) {
    return NextResponse.json(
      { error: "The family has already been notified recently for this tag." },
      { status: 429 }
    );
  }

  const status = effectiveTagStatus(tag, new Date());
  if (status === "EXPIRED") {
    return NextResponse.json({ error: "This tag has expired." }, { status: 410 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a meet point." }, { status: 400 });
  }
  const meetPoint = tag.event.meetPoints.find((mp) => mp.id === parsed.data.meetPointId);
  if (!meetPoint) {
    return NextResponse.json({ error: "Unknown meet point for this event." }, { status: 400 });
  }

  await prisma.scanLog.create({
    data: { tagId: tag.id, role: "FINDER", ip, meetPointId: meetPoint.id },
  });

  const openCase = await ensureCaseOpen(tag.personId, tag.id);

  const message = `${tag.person.firstName} has been found and is waiting at ${meetPoint.name}.`;
  const provider = getNotifyProvider();
  const recipients = [
    tag.person.guardian.phone,
    ...tag.person.backupContacts.map((c) => c.phone),
  ];

  for (const phone of recipients) {
    const result = await provider.send({ to: phone, channel: "sms", body: message });
    await prisma.notifyLog.create({
      data: {
        tagId: tag.id,
        channel: "sms",
        toMasked: maskPhone(phone),
        status: result.status,
      },
    });
  }

  if (openCase.status === "FOUND") {
    await advanceCase(openCase.id, "FAMILY_NOTIFIED", `Notified from meet point: ${meetPoint.name}`);
  }

  // Deliberately do not echo back phone numbers, recipient count by name, or anything else
  // that could identify the guardian to the finder.
  return NextResponse.json({ ok: true, message: "Family has been notified." });
}
