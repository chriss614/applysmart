import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communityPosts, users } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { validateCsrfToken, getClientIdentifier, redactedLog } from "@/lib/security";
import { getUserId } from "@/lib/auth";
import { communityRateLimiter } from "@/lib/rate-limit";
import { communityPostSchema, communityCommentSchema } from "@/lib/validation";

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

    const whereClause = conditions.length > 0 ? conditions[0] : undefined;

    const posts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        author: users.name,
        tags: communityPosts.tags,
        upvotes: communityPosts.upvotes,
        commentCount: communityPosts.commentCount,
        createdAt: communityPosts.createdAt,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(whereClause)
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ posts });
  } catch (error) {
    redactedLog("error", "Community fetch error", { error: "Internal server error" });
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
    redactedLog("error", "Community post error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
