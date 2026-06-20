import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAccessToken, validateCsrfToken, getClientIdentifier } from "@/lib/security";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCall, INTERVIEW_FEEDBACK_PROMPT } from "@/lib/ai/openai";

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
  const limiter = aiRateLimiter[plan as keyof typeof aiRateLimiter] || aiRateLimiter.free;
  const { success: rateLimitSuccess } = await limiter.limit(String(userId));
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "AI quota exceeded" }, { status: 429 });
  }

  try {
    const { sessionId, questionId, response } = await request.json();
    if (!sessionId || !questionId || !response) {
      return NextResponse.json({ error: "Session ID, question ID, and response required" }, { status: 400 });
    }

    // Get session
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

    const result = await safeAiCall<{
      score: number;
      strengths: string[];
      areasToImprove: string[];
      modelAnswer: string;
      followUpQuestions: string[];
    }>(
      INTERVIEW_FEEDBACK_PROMPT,
      `Question: ${question.question}\n\nCandidate Response: ${response}\n\nExpected points: ${question.expectedPoints?.join("\n") || "N/A"}`,
      "You are a supportive but honest technical interviewer. Evaluate the candidate's response and provide constructive feedback."
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
    console.error("Interview submit error:", error);
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
