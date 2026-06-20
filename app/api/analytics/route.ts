import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analytics, applications, interviewSessions, resumes } from "@/lib/db/schema";
import { eq, desc, gte, sql, and, count, avg } from "drizzle-orm";
import { verifyAccessToken } from "@/lib/security";
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
    // Get today's analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAnalytics = await db.query.analytics.findFirst({
      where: and(eq(analytics.userId, userId), gte(analytics.date, today)),
    });

    // Get application stats
    const appStats = await db
      .select({ status: applications.status, count: count() })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.status);

    const totalApps = appStats.reduce((sum, s) => sum + s.count, 0);
    const responsesReceived = appStats.filter((s) => ["phone_screen", "technical", "onsite", "offer", "rejected"].includes(s.status)).reduce((sum, s) => sum + s.count, 0);
    const offersReceived = appStats.find((s) => s.status === "offer")?.count || 0;
    const interviewsScheduled = appStats.filter((s) => ["phone_screen", "technical", "onsite"].includes(s.status)).reduce((sum, s) => sum + s.count, 0);

    // Get resume stats
    const resumeStats = await db
      .select({ avgScore: avg(resumes.atsScore) })
      .from(resumes)
      .where(eq(resumes.userId, userId));

    const avgAtsScore = resumeStats[0]?.avgScore ? Math.round(Number(resumeStats[0].avgScore)) : 0;

    // Get interview stats
    const interviewStats = await db
      .select({ avgScore: avg(interviewSessions.overallScore) })
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId));

    const avgInterviewScore = interviewStats[0]?.avgScore ? Math.round(Number(interviewStats[0].avgScore)) : 0;

    // Get last 30 days of activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dailyActivity = await db
      .select({
        date: analytics.date,
        applicationsSent: analytics.applicationsSent,
        interviewsCompleted: analytics.interviewsCompleted,
      })
      .from(analytics)
      .where(and(eq(analytics.userId, userId), gte(analytics.date, thirtyDaysAgo)))
      .orderBy(analytics.date);

    return NextResponse.json({
      summary: {
        totalApplications: totalApps,
        responseRate: totalApps > 0 ? Math.round((responsesReceived / totalApps) * 100) : 0,
        offerRate: totalApps > 0 ? Math.round((offersReceived / totalApps) * 100) : 0,
        avgAtsScore,
        avgInterviewScore,
        interviewsScheduled,
        offersReceived,
        streakDays: todayAnalytics?.streakDays || 0,
        weeklyProgress: todayAnalytics?.weeklyProgress || 0,
        weeklyGoal: todayAnalytics?.weeklyGoal || 10,
      },
      dailyActivity,
      statusBreakdown: appStats,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
