import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interviewSessions } from "@/lib/db/schema";
import { verifyAccessToken, validateCsrfToken, getClientIdentifier } from "@/lib/security";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCall, INTERVIEW_PROMPT } from "@/lib/ai/openai";

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
    const { jobRole, difficulty, questionCount = 5, focusAreas } = await request.json();
    if (!jobRole || !difficulty) {
      return NextResponse.json({ error: "Job role and difficulty required" }, { status: 400 });
    }

    const result = await safeAiCall<{
      questions: Array<{
        id: number;
        question: string;
        type: string;
        difficulty: string;
        expectedPoints: string[];
        timeEstimate: string;
      }>;
    }>(
      INTERVIEW_PROMPT,
      `Job Role: ${jobRole}\nDifficulty: ${difficulty}\nNumber of questions: ${questionCount}\n${focusAreas ? `Focus areas: ${focusAreas.join(", ")}` : ""}`,
      "You are a senior technical interviewer with 15+ years of experience at top tech companies. Generate realistic interview questions."
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
    console.error("Interview generation error:", error);
    return NextResponse.json({ error: "Failed to generate interview" }, { status: 500 });
  }
}
