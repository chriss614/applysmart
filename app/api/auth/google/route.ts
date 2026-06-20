import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createAccessToken,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
} from "@/lib/security";
import { authRateLimiter } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

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
    const { code, email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // In a real implementation, verify the Google OAuth code with Google's API
    // For now, simplified: find or create user by email
    let user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      // Create new user from Google data
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        name: email.split("@")[0],
        emailVerified: true,
      }).returning();
      user = newUser;
      sendWelcomeEmail(user.email, user.name || "there").catch(console.error);
    }

    // Create tokens
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const refreshToken = crypto.randomUUID();
    await db.insert(sessions).values({
      userId: user.id,
      tokenHash: refreshToken,
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
    response.cookies.set("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
