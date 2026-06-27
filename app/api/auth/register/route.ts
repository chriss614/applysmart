import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  createAccessToken,
  hashRefreshToken,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
  redactedLog,
} from "@/lib/security";
import { authRateLimiter } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { sendWelcomeEmail } from "@/lib/email";

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
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      // Return generic success to prevent email enumeration
      // (same response as success, but don't create user)
      return NextResponse.json(
        { success: true, message: "If this email is not registered, an account has been created." },
        { status: 200 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      emailVerified: false,
    }).returning();

    const accessToken = await createAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      plan: newUser.plan,
    });

    const rawRefreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = hashRefreshToken(rawRefreshToken);

    await db.insert(sessions).values({
      userId: newUser.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: request.headers.get("user-agent") || "",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    });

    // Send welcome email asynchronously (don't block response)
    sendWelcomeEmail(newUser.email, newUser.name || "there").catch(() => {});

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        role: newUser.role,
      },
    }, { status: 201 });

    response.cookies.set("token", accessToken, COOKIE_OPTIONS);
    response.cookies.set("refresh_token", rawRefreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    redactedLog("error", "Registration error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
