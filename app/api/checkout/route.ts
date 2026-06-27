import { NextRequest, NextResponse } from "next/server";
import { getUserId, getCurrentUser } from "@/lib/auth";
import { validateCsrfToken, redactedLog, getClientIdentifier } from "@/lib/security";
import { createCheckoutUrl, PLAN_VARIANTS } from "@/lib/payments";
import { generalRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!validateCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await generalRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { plan } = body;

    if (!plan || !(plan === "pro" || plan === "accelerator")) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const variantId = PLAN_VARIANTS[plan].lemonSqueezyVariantId;
    if (!variantId) {
      return NextResponse.json({ error: "Plan not configured" }, { status: 400 });
    }

    const user = await getCurrentUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: "User email required" }, { status: 400 });
    }

    const checkoutUrl = await createCheckoutUrl({
      variantId,
      userId,
      email: user.email,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    redactedLog("error", "Checkout creation error", { error: "Internal server error" });
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }
}
