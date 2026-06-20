import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, cachedAnalyses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAccessToken, validateCsrfToken, getClientIdentifier } from "@/lib/security";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCall, RESUME_ANALYSIS_PROMPT } from "@/lib/ai/openai";
import crypto from "crypto";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload?.userId || null;
}

async function getUserPlan(request: NextRequest): Promise<string> {
  const token = request.cookies.get("token")?.value;
  if (!token) return "free";
  const payload = await verifyAccessToken(token);
  return payload?.plan || "free";
}

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(request);
  const identifier = getClientIdentifier(request);

  // Check AI rate limit based on plan
  const limiter = aiRateLimiter[plan as keyof typeof aiRateLimiter] || aiRateLimiter.free;
  const { success: rateLimitSuccess } = await limiter.limit(String(userId));
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "AI quota exceeded. Upgrade for more." }, { status: 429 });
  }

  try {
    const { resumeText, resumeId } = await request.json();
    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: "Resume text too short" }, { status: 400 });
    }

    // Check cache
    const promptHash = crypto.createHash("sha256").update(resumeText + "ats_v2").digest("hex");
    if (resumeId) {
      const cached = await db.query.cachedAnalyses.findFirst({
        where: and(
          eq(cachedAnalyses.resumeId, resumeId),
          eq(cachedAnalyses.analysisType, "ats"),
          eq(cachedAnalyses.promptHash, promptHash)
        ),
      });
      if (cached && new Date(cached.expiresAt) > new Date()) {
        return NextResponse.json({ success: true, result: cached.result, cached: true });
      }
    }

    // Call AI
    const result = await safeAiCall<{
      atsScore: number;
      readabilityScore: number;
      keywordDensity: Record<string, number>;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      optimizedSummary: string;
      missingKeywords: string[];
    }>(RESUME_ANALYSIS_PROMPT, resumeText);

    if (!result) {
      return NextResponse.json({ error: "AI analysis failed. Please try again." }, { status: 503 });
    }

    // Cache result
    if (resumeId) {
      await db.insert(cachedAnalyses).values({
        resumeId,
        analysisType: "ats",
        result,
        promptHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }).catch(() => {}); // Ignore duplicate cache errors
    }

    return NextResponse.json({ success: true, result, cached: false });
  } catch (error) {
    console.error("Resume analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
