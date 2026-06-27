import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createAccessToken,
  hashRefreshToken,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
  redactedLog,
} from "@/lib/security";
import { authRateLimiter } from "@/lib/rate-limit";
import crypto from "crypto";

/**
 * Google OAuth endpoint.
 * NOTE: In production, this must verify the OAuth code with Google's token endpoint
 * before creating/logging in a user. The current implementation is a simplified placeholder
 * that accepts a verified email from the client.
 */
export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await authRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const { email, name, googleId } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // TODO: In production, verify the OAuth code with Google's token endpoint
    // const googleUser = await verifyGoogleOAuthCode(code);
    // if (!googleUser || googleUser.email !== email) { return 401 }

    let user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        googleId: googleId || null,
        emailVerified: true,
      }).returning();
      user = newUser;
    } else if (googleId && !user.googleId) {
      // Link Google account to existing email account
      await db.update(users)
        .set({ googleId, emailVerified: true })
        .where(eq(users.id, user.id));
    }

    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const rawRefreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: request.headers.get("user-agent") || "",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role,
      },
    });

    response.cookies.set("token", accessToken, COOKIE_OPTIONS);
    response.cookies.set("refresh_token", rawRefreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    redactedLog("error", "Google auth error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
