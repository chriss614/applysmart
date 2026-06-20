import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAccessToken, validateCsrfToken } from "@/lib/security";
import { generalRateLimiter } from "@/lib/rate-limit";
import { getClientIdentifier } from "@/lib/security";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload?.userId || null;
}

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
    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
    });

    return NextResponse.json({ portfolio: portfolio || null });
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { theme, content, isPublished, publicSlug, customDomain } = await request.json();

    const existing = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
    });

    if (existing) {
      await db.update(portfolios)
        .set({
          theme: theme || existing.theme,
          content: content || existing.content,
          isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
          publicSlug: publicSlug || existing.publicSlug,
          customDomain: customDomain || existing.customDomain,
          updatedAt: new Date(),
        })
        .where(eq(portfolios.id, existing.id));

      return NextResponse.json({ success: true, portfolio: { ...existing, theme, content } });
    }

    const [newPortfolio] = await db.insert(portfolios).values({
      userId,
      theme: theme || "modern",
      content: content || {},
      isPublished: isPublished || false,
      publicSlug: publicSlug || `portfolio-${userId}`,
      customDomain,
    }).returning();

    return NextResponse.json({ success: true, portfolio: newPortfolio }, { status: 201 });
  } catch (error) {
    console.error("Portfolio save error:", error);
    return NextResponse.json({ error: "Failed to save portfolio" }, { status: 500 });
  }
}
