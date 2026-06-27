import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCsrfToken, hashRefreshToken, redactedLog } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const rawRefreshToken = request.cookies.get("refresh_token")?.value;

    if (rawRefreshToken) {
      const tokenHash = hashRefreshToken(rawRefreshToken);
      // Revoke session by hashed token
      await db.update(sessions)
        .set({ revoked: true })
        .where(eq(sessions.tokenHash, tokenHash));
    }

    const response = NextResponse.json({ success: true });

    // Clear cookies
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("csrf-token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    redactedLog("error", "Logout error", { error: "Internal server error" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
