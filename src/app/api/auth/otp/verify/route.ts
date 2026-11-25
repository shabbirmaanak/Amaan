import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { phoneSchema, otpCodeSchema, otpPurposeSchema } from "@/lib/validation";
import { verifyOtpHash, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { setSessionCookie } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { dbRateLimitStore } from "@/lib/rateLimitDb";

const bodySchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
  purpose: otpPurposeSchema,
  name: z.string().trim().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { phone, code, purpose, name } = parsed.data;

  const limit = await checkRateLimit(dbRateLimitStore, `otp:verify:${phone}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired or not found. Request a new one." }, { status: 400 });
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many incorrect attempts. Request a new code." }, { status: 429 });
  }

  const valid = verifyOtpHash(code, phone, otp.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  if (purpose === "GUARDIAN_LOGIN") {
    const guardian = await prisma.guardian.upsert({
      where: { phone },
      update: {},
      create: { phone, name: name ?? "Guardian" },
    });
    await setSessionCookie({ sub: guardian.id, role: "guardian" });
    return NextResponse.json({ ok: true, role: "guardian", guardian: { id: guardian.id, name: guardian.name } });
  }

  if (purpose === "VOLUNTEER_LOGIN") {
    const volunteer = await prisma.volunteer.findUnique({ where: { phone } });
    if (!volunteer || volunteer.status !== "APPROVED") {
      return NextResponse.json({ error: "Volunteer account not found or not approved." }, { status: 403 });
    }
    await setSessionCookie({ sub: volunteer.id, role: "volunteer", eventId: volunteer.eventId });
    return NextResponse.json({
      ok: true,
      role: "volunteer",
      volunteer: { id: volunteer.id, name: volunteer.name, eventId: volunteer.eventId },
    });
  }

  // ADMIN_LOGIN
  const admin = await prisma.admin.findUnique({ where: { phone } });
  if (!admin) {
    return NextResponse.json({ error: "Admin account not found." }, { status: 403 });
  }
  await setSessionCookie({ sub: admin.id, role: "admin" });
  return NextResponse.json({ ok: true, role: "admin", admin: { id: admin.id, name: admin.name } });
}
