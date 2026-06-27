import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  createAccessToken,
  hashRefreshToken,
  COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
  redactedLog,
} from "@/lib/security";
import { refreshRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // CSRF protection for refresh (state-changing cookie operation)
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // Rate limit
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await refreshRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const rawRefreshToken = request.cookies.get("refresh_token")?.value;
    if (!rawRefreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    // Find valid session by hashed token
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date()),
        eq(sessions.revoked, false)
      ),
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    // Get user
    const { users } = await import("@/lib/db/schema");
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("token", accessToken, COOKIE_OPTIONS);

    return response;
  } catch (error) {
    redactedLog("error", "Refresh token error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
