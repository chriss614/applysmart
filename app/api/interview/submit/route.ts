import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId, getUserPlan } from "@/lib/auth";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCallWithValidation, INTERVIEW_FEEDBACK_PROMPT } from "@/lib/ai/openai";
import { interviewFeedbackResultSchema, interviewResponseSchema } from "@/lib/validation";

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
    const parsed = interviewResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { sessionId, questionId, response } = parsed.data;

    // Get session with ownership check (IDOR fix)
    const session = await db.query.interviewSessions.findFirst({
      where: and(eq(interviewSessions.id, sessionId), eq(interviewSessions.userId, userId)),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const questions = session.questions as any[];
    const question = questions.find((q: any) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const result = await safeAiCallWithValidation(
      INTERVIEW_FEEDBACK_PROMPT,
      `Question: ${question.question}\n\nCandidate Response: ${response}\n\nExpected points: ${question.expectedPoints?.join("\n") || "N/A"}`,
      interviewFeedbackResultSchema
    );

    if (!result) {
      return NextResponse.json({ error: "Failed to get feedback" }, { status: 503 });
    }

    // Update session with response and feedback
    const existingResponses = (session.responses as any[]) || [];
    const existingFeedback = (session.aiFeedback as any[]) || [];

    await db.update(interviewSessions)
      .set({
        responses: [...existingResponses, { questionId, response, feedback: result }],
        aiFeedback: [...existingFeedback, { questionId, ...result }],
        updatedAt: new Date(),
      })
      .where(eq(interviewSessions.id, sessionId));

    return NextResponse.json({ success: true, feedback: result });
  } catch (error) {
    redactedLog("error", "Interview submit error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
