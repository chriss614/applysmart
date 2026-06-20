import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  createAccessToken,
  createRefreshToken,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
  validateCsrfToken,
  getClientIdentifier,
} from "@/lib/security";
import { registerSchema } from "@/lib/validation";
import { authRateLimiter } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await authRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // CSRF validation
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      emailVerified: false,
    }).returning();

    // Create tokens
    const accessToken = await createAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      plan: newUser.plan,
    });

    const refreshToken = crypto.randomUUID();
    const refreshTokenHash = await hashPassword(refreshToken);

    // Store session (import sessions from schema)
    const { sessions } = await import("@/lib/db/schema");
    await db.insert(sessions).values({
      userId: newUser.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userAgent: request.headers.get("user-agent") || "",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "",
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(newUser.email, newUser.name || "there").catch(console.error);

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        plan: newUser.plan,
        role: newUser.role,
      },
    });

    response.cookies.set("token", accessToken, COOKIE_OPTIONS);
    response.cookies.set("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
