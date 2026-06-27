import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { and, eq, gte, lte, ilike, desc, sql, count } from "drizzle-orm";
import { jobFilterSchema } from "@/lib/validation";
import { generalRateLimiter } from "@/lib/rate-limit";
import { getClientIdentifier, redactedLog } from "@/lib/security";

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await generalRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Validate with Zod schema
    const rawFilters = {
      query: searchParams.get("query") || undefined,
      skills: searchParams.get("skills")?.split(",").filter(Boolean) || undefined,
      location: searchParams.get("location") || undefined,
      salaryMin: searchParams.get("salaryMin") ? parseInt(searchParams.get("salaryMin")!) : undefined,
      salaryMax: searchParams.get("salaryMax") ? parseInt(searchParams.get("salaryMax")!) : undefined,
      remote: searchParams.get("remote") === "true" ? true : undefined,
      experienceLevel: searchParams.get("experienceLevel") as any || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: Math.min(parseInt(searchParams.get("limit") || "20"), 50),
    };

    const parsed = jobFilterSchema.safeParse(rawFilters);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const filters = parsed.data;
    const conditions = [eq(jobs.isActive, true)];

    if (filters.query) {
      conditions.push(
        sql`(${jobs.title} ILIKE ${`%${filters.query}%`} OR ${jobs.description} ILIKE ${`%${filters.query}%`})`
      );
    }
    if (filters.remote) {
      conditions.push(eq(jobs.isRemote, true));
    }
    if (filters.location) {
      conditions.push(ilike(jobs.location, `%${filters.location}%`));
    }
    if (filters.salaryMin) {
      conditions.push(gte(jobs.salaryMin, filters.salaryMin));
    }
    if (filters.salaryMax) {
      conditions.push(lte(jobs.salaryMax, filters.salaryMax));
    }
    if (filters.experienceLevel) {
      conditions.push(eq(jobs.experienceLevel, filters.experienceLevel));
    }

    const offset = (filters.page - 1) * filters.limit;

    const jobList = await db.query.jobs.findMany({
      where: and(...conditions),
      orderBy: desc(jobs.postedAt),
      limit: filters.limit,
      offset,
    });

    const totalResult = await db.select({ count: count() }).from(jobs).where(and(...conditions));
    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      jobs: jobList,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    });
  } catch (error) {
    redactedLog("error", "Jobs fetch error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
