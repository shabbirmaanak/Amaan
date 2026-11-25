import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { volunteerApplySchema } from "@/lib/validationAdmin";
import { checkRateLimit } from "@/lib/rateLimit";
import { dbRateLimitStore } from "@/lib/rateLimitDb";
import { getClientIp } from "@/lib/requestIp";

/** Public: anyone can apply to volunteer at an event; an admin must approve before they can log in. */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await checkRateLimit(dbRateLimitStore, `volunteer-apply:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const parsed = volunteerApplySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { eventId, name, phone } = parsed.data;

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "ACTIVE") {
    return NextResponse.json({ error: "Event not found or not accepting volunteers." }, { status: 404 });
  }

  const volunteer = await prisma.volunteer.upsert({
    where: { phone },
    update: {},
    create: { phone, name, eventId, status: "PENDING" },
  });

  return NextResponse.json({ ok: true, status: volunteer.status });
}
