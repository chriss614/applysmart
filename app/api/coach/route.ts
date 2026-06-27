import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coachMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog, detectPromptInjection } from "@/lib/security";
import { getUserId, getUserPlan } from "@/lib/auth";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCallWithValidation, COACH_SYSTEM_PROMPT } from "@/lib/ai/openai";
import { coachMessageSchema, coachResponseSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await db.query.coachMessages.findMany({
      where: eq(coachMessages.userId, userId),
      orderBy: desc(coachMessages.createdAt),
      limit: 50,
    });

    return NextResponse.json({ messages: messages.reverse() });
  } catch (error) {
    redactedLog("error", "Coach history error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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

  const plan = await getUserPlan(request);
  const limiter = aiRateLimiter[plan as keyof typeof aiRateLimiter] || aiRateLimiter.free;
  const { success: rateLimitSuccess } = await limiter.limit(String(userId));
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "AI coach quota exceeded. Upgrade for unlimited access." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = coachMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { message, context } = parsed.data;

    // Detect prompt injection (logging signal only, not a security boundary)
    if (detectPromptInjection(message)) {
      redactedLog("warn", "Prompt injection detected in coach message", { userId });
    }

    // Store user message
    await db.insert(coachMessages).values({
      userId,
      role: "user",
      content: message,
      context: context || {},
    });

    // Get recent context for AI
    const recentMessages = await db.query.coachMessages.findMany({
      where: eq(coachMessages.userId, userId),
      orderBy: desc(coachMessages.createdAt),
      limit: 10,
    });

    const conversationHistory = recentMessages.reverse().map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call AI with Zod validation
    const response = await safeAiCallWithValidation(
      "",
      message,
      coachResponseSchema,
      COACH_SYSTEM_PROMPT + `\n\nUser context: ${JSON.stringify(context)}\n\nRecent conversation:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n")}`
    );

    const aiResponse = response?.response || "I'm here to help with your career. What would you like to work on?";

    // Store AI response
    await db.insert(coachMessages).values({
      userId,
      role: "assistant",
      content: aiResponse,
    });

    return NextResponse.json({ success: true, message: aiResponse });
  } catch (error) {
    redactedLog("error", "Coach error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to get coach response" }, { status: 500 });
  }
}
