import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { phoneSchema, otpPurposeSchema } from "@/lib/validation";
import { generateOtp, hashOtp, otpExpiresAt } from "@/lib/otp";
import { checkRateLimit } from "@/lib/rateLimit";
import { dbRateLimitStore } from "@/lib/rateLimitDb";
import { getNotifyProvider } from "@/lib/notify";

const bodySchema = z.object({
  phone: phoneSchema,
  purpose: otpPurposeSchema,
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { phone, purpose } = parsed.data;

  const limit = await checkRateLimit(dbRateLimitStore, `otp:request:${phone}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please try again shortly." },
      { status: 429 }
    );
  }

  if (purpose === "VOLUNTEER_LOGIN") {
    const volunteer = await prisma.volunteer.findUnique({ where: { phone } });
    if (!volunteer) {
      return NextResponse.json({ error: "No volunteer account found for this number." }, { status: 404 });
    }
    if (volunteer.status !== "APPROVED") {
      return NextResponse.json({ error: "Your volunteer account is pending admin approval." }, { status: 403 });
    }
  }
  if (purpose === "ADMIN_LOGIN") {
    const admin = await prisma.admin.findUnique({ where: { phone } });
    if (!admin) {
      return NextResponse.json({ error: "No admin account found for this number." }, { status: 404 });
    }
  }

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      phone,
      purpose,
      codeHash: hashOtp(code, phone),
      expiresAt: otpExpiresAt(),
    },
  });

  await getNotifyProvider().send({
    to: phone,
    channel: "sms",
    body: `${code} is your Ashara Safety Tag verification code. It expires in 5 minutes.`,
  });

  return NextResponse.json({ ok: true });
}
