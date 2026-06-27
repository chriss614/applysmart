import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolios } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId } from "@/lib/auth";
import { generalRateLimiter } from "@/lib/rate-limit";
import { portfolioSchema } from "@/lib/validation";

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
    redactedLog("error", "Portfolio fetch error", { error: "Internal server error" });
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
    const body = await request.json();
    const parsed = portfolioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { theme, content } = parsed.data;
    const isPublished = body.isPublished ?? false;
    const publicSlug = body.publicSlug || `portfolio-${userId}`;
    const customDomain = body.customDomain || null;

    const existing = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
    });

    if (existing) {
      await db.update(portfolios)
        .set({
          theme,
          content,
          isPublished,
          publicSlug,
          customDomain,
          updatedAt: new Date(),
        })
        .where(eq(portfolios.id, existing.id));

      return NextResponse.json({ success: true, portfolio: { ...existing, theme, content } });
    }

    const [newPortfolio] = await db.insert(portfolios).values({
      userId,
      theme,
      content,
      isPublished,
      publicSlug,
      customDomain,
    }).returning();

    return NextResponse.json({ success: true, portfolio: newPortfolio }, { status: 201 });
  } catch (error) {
    redactedLog("error", "Portfolio save error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to save portfolio" }, { status: 500 });
  }
}
