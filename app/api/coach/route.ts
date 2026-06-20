import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coachMessages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyAccessToken, validateCsrfToken, getClientIdentifier, detectPromptInjection } from "@/lib/security";
import { aiRateLimiter } from "@/lib/rate-limit";
import { safeAiCall, COACH_SYSTEM_PROMPT } from "@/lib/ai/openai";

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
    console.error("Coach history error:", error);
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
    const { message, context } = await request.json();
    if (!message || message.length < 1) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Detect prompt injection
    if (detectPromptInjection(message)) {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 });
    }

    // Store user message
    await db.insert(coachMessages).values({
      userId,
      role: "user",
      content: message,
      context,
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

    // Call AI
    const response = await safeAiCall<{ response: string }>(
      "",
      message,
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
    console.error("Coach error:", error);
    return NextResponse.json({ error: "Failed to get coach response" }, { status: 500 });
  }
}
