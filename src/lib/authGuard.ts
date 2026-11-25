import { NextResponse } from "next/server";
import { getSession, type Role, type SessionPayload } from "@/lib/session";

export class UnauthorizedError extends Error {}

/** Loads the session and throws if it's missing or not one of `roles`. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) {
    throw new UnauthorizedError();
  }
  return session;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
