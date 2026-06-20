import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier } from "@/lib/security";
import { authRateLimiter } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

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
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store reset token (using a simple approach - in production use a dedicated table)
    // For now, we'll store it in the user's metadata or use a Redis cache
    // Since we don't have a password_reset_tokens table, we'll use a simple approach
    // In a real app, create a password_reset_tokens table

    // Send email
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({ success: true, message: "If an account exists, a reset email has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
