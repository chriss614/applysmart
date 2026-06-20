import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createAccessToken, verifyRefreshToken, COOKIE_OPTIONS } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Find valid session
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.tokenHash, refreshToken),
        gt(sessions.expiresAt, new Date()),
        eq(sessions.revoked, false)
      ),
    });

    if (!session) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    // Get user
    const { users } = await import("@/lib/db/schema");
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Create new access token
    const accessToken = await createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("token", accessToken, COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
