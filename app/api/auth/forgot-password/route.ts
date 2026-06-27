import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  validateCsrfToken,
  getClientIdentifier,
  redactedLog,
} from "@/lib/security";
import { authRateLimiter, passwordResetRateLimiter } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

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
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // Always return the same message regardless of whether the email exists
    // This prevents email enumeration via timing or response content

    if (user) {
      // Generate reset token and store hash
      const rawToken = generatePasswordResetToken();
      const tokenHash = hashPasswordResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(users)
        .set({
          passwordResetToken: tokenHash,
          passwordResetExpires: expiresAt,
        })
        .where(eq(users.id, user.id));

      // Send email asynchronously (don't block response)
      sendPasswordResetEmail(user.email, rawToken).catch(() => {});
    }

    // Consistent delay to prevent timing attacks (always ~200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    redactedLog("error", "Forgot password error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
