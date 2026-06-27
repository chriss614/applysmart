import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyPassword,
  createAccessToken,
  hashRefreshToken,
  isAccountLocked,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
  redactedLog,
} from "@/lib/security";
import { getUserId } from "@/lib/auth";
import { authRateLimiter } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  // Rate limit
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await authRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // Account lockout check
    if (user?.lockedUntil) {
      const lockStatus = await isAccountLocked(user.lockedUntil);
      if (lockStatus.locked) {
        return NextResponse.json(
          {
            error: `Account locked. Try again in ${lockStatus.remainingMinutes} minutes.`,
          },
          { status: 403 }
        );
      }
    }

    if (!user || !user.passwordHash) {
      // Constant-time delay to prevent timing attacks
      await verifyPassword(password, "$2a$14$dummy.hash.for.timing.protection");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const lockUntil =
        newAttempts >= 5
          ? new Date(Date.now() + 30 * 60 * 1000)
          : null;
      await db
        .update(users)
        .set({ failedLoginAttempts: newAttempts, lockedUntil: lockUntil })
        .where(eq(users.id, user.id));

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful login
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create tokens
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const rawRefreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);

    // Store hashed refresh token
    const { sessions } = await import("@/lib/db/schema");
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
    redactedLog("error", "Login error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import crypto from "crypto";
