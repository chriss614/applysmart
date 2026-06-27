import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resumes, cachedAnalyses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId, getUserPlan } from "@/lib/auth";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCallWithValidation, RESUME_ANALYSIS_PROMPT } from "@/lib/ai/openai";
import { resumeAnalysisResultSchema } from "@/lib/validation";
import crypto from "crypto";

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

    // Check cache — but first verify ownership of the resume
    const promptHash = crypto.createHash("sha256").update(resumeText + "ats_v2").digest("hex");
    if (resumeId) {
      // Verify the resume belongs to the current user (IDOR fix)
      const resume = await db.query.resumes.findFirst({
        where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
      });
      if (!resume) {
        return NextResponse.json({ error: "Resume not found" }, { status: 404 });
      }

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

    // Call AI with Zod validation
    const result = await safeAiCallWithValidation(
      RESUME_ANALYSIS_PROMPT,
      resumeText,
      resumeAnalysisResultSchema
    );

    if (!result) {
      return NextResponse.json({ error: "AI analysis failed. Please try again." }, { status: 503 });
    }

    // Cache result (only if resumeId provided and ownership verified)
    if (resumeId) {
      await db.insert(cachedAnalyses).values({
        resumeId,
        analysisType: "ats",
        result,
        promptHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).catch(() => {}); // Ignore duplicate cache errors
    }

    return NextResponse.json({ success: true, result, cached: false });
  } catch (error) {
    redactedLog("error", "Resume analysis error", { error: "Internal server error" });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
