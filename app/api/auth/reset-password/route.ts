import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  hashPasswordResetToken,
  validateCsrfToken,
  getClientIdentifier,
  redactedLog,
} from "@/lib/security";
import { passwordResetRateLimiter } from "@/lib/rate-limit";
import { passwordResetSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await passwordResetRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = passwordResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = hashPasswordResetToken(token);

    const user = await db.query.users.findFirst({
      where: eq(users.passwordResetToken, tokenHash),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Single-use: invalidate token immediately after use
    await db.update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please log in with your new password.",
    });
  } catch (error) {
    redactedLog("error", "Reset password error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
