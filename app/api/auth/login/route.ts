import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  isAccountLocked,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
} from "@/lib/security";
import { registerSchema, loginSchema } from "@/lib/validation";
import { authRateLimiter } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await authRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

  // CSRF validation
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check account lockout
    const lockout = await isAccountLocked(user.lockedUntil);
    if (lockout.locked) {
      return NextResponse.json(
        { error: `Account locked. Try again in ${lockout.remainingMinutes} minutes.` },
        { status: 403 }
      );
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.passwordHash || "");
    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
      await db.update(users).set({
        failedLoginAttempts: newAttempts,
        lockedUntil: lockUntil,
      }).where(eq(users.id, user.id));

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Reset failed attempts and update login info
    await db.update(users).set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    }).where(eq(users.id, user.id));

    // Create tokens
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const refreshToken = await createRefreshToken(user.id);

    // Store refresh session (store raw token for direct comparison)
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

    // Set cookies
    response.cookies.set("token", accessToken, COOKIE_OPTIONS);
    response.cookies.set("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
