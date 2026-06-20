import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communityPosts, communityComments } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { verifyAccessToken, validateCsrfToken, getClientIdentifier } from "@/lib/security";
import { communityRateLimiter } from "@/lib/rate-limit";
import { communityPostSchema } from "@/lib/validation";

async function getUserId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  return payload?.userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];
    if (category) {
      conditions.push(eq(communityPosts.category, category));
    }

    const posts = await db.query.communityPosts.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      orderBy: desc(communityPosts.createdAt),
      limit,
      offset,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Community fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
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

  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await communityRateLimiter.limit(String(userId));
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Post quota exceeded (10/hour)" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = communityPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const [post] = await db.insert(communityPosts).values({
      userId,
      ...parsed.data,
    }).returning();

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Community post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
