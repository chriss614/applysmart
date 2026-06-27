import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId, getUserPlan } from "@/lib/auth";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCallWithValidation, INTERVIEW_PROMPT } from "@/lib/ai/openai";
import { interviewQuestionsResultSchema, interviewConfigSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await getUserPlan(request);
  const limiter = aiRateLimiter[plan as keyof typeof aiRateLimiter] || aiRateLimiter.free;
  const { success: rateLimitSuccess } = await limiter.limit(String(userId));
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "AI quota exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = interviewConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { jobRole, difficulty, questionCount, focusAreas } = parsed.data;

    const result = await safeAiCallWithValidation(
      INTERVIEW_PROMPT,
      `Job Role: ${jobRole}\nDifficulty: ${difficulty}\nNumber of questions: ${questionCount}\n${focusAreas ? `Focus areas: ${focusAreas.join(", ")}` : ""}`,
      interviewQuestionsResultSchema
    );

    if (!result) {
      return NextResponse.json({ error: "Failed to generate questions" }, { status: 503 });
    }

    // Store session
    const [session] = await db.insert(interviewSessions).values({
      userId,
      jobRole,
      difficulty,
      questions: result.questions,
    }).returning();

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      questions: result.questions,
    });
  } catch (error) {
    redactedLog("error", "Interview generation error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to generate interview" }, { status: 500 });
  }
}
