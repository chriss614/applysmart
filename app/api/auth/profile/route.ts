import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId } from "@/lib/auth";
import { generalRateLimiter } from "@/lib/rate-limit";
import { profileUpdateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await generalRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      role: user.role,
      targetRole: user.targetRole,
      yearsExperience: user.yearsExperience,
      preferredLocation: user.preferredLocation,
      salaryExpectation: user.salaryExpectation,
      skills: user.skills,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    redactedLog("error", "Profile fetch error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Explicit allow-list via .strict() schema already rejects unexpected fields
    await db.update(users)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    redactedLog("error", "Profile update error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
