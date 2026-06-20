import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, jobs } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { applicationSchema, applicationUpdateSchema } from "@/lib/validation";
import { verifyAccessToken, validateCsrfToken, getClientIdentifier } from "@/lib/security";
import { generalRateLimiter } from "@/lib/rate-limit";

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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [eq(applications.userId, userId)];
    if (status) {
      conditions.push(eq(applications.status, status as any));
    }

    const appList = await db.query.applications.findMany({
      where: and(...conditions),
      orderBy: desc(applications.createdAt),
      limit,
      offset,
    });

    const totalResult = await db.select({ count: count() }).from(applications).where(eq(applications.userId, userId));
    const total = totalResult[0]?.count || 0;

    // Status breakdown
    const statusCounts = await db
      .select({ status: applications.status, count: count() })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status);

    return NextResponse.json({
      applications: appList,
      total,
      statusBreakdown: statusCounts,
    });
  } catch (error) {
    console.error("Applications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
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
    const parsed = applicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const [newApp] = await db.insert(applications).values({
      userId,
      ...parsed.data,
      dateApplied: parsed.data.dateApplied ? new Date(parsed.data.dateApplied) : new Date(),
    }).returning();

    return NextResponse.json({ success: true, application: newApp }, { status: 201 });
  } catch (error) {
    console.error("Application creation error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
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
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Application ID required" }, { status: 400 });
    }

    const parsed = applicationUpdateSchema.safeParse(updates);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await db.update(applications)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Application update error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
