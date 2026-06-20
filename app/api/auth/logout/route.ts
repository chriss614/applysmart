import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCsrfToken } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (refreshToken) {
      // Revoke session
      await db.update(sessions).set({ revoked: true }).where(eq(sessions.tokenHash, refreshToken));
    }

    const response = NextResponse.json({ success: true });

    // Clear cookies
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("csrf-token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
