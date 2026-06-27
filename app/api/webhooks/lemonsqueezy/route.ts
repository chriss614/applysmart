import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanFromVariantId } from "@/lib/payments";
import { webhookRateLimiter } from "@/lib/rate-limit";
import { getClientIdentifier } from "@/lib/security";
import crypto from "crypto";
import { redactedLog } from "@/lib/security";

// Fail fast at startup if webhook secret is not configured
const WEBHOOK_SECRET = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error(
    "LEMON_SQUEEZY_WEBHOOK_SECRET is required. Set it in your environment variables."
  );
}

export async function POST(request: NextRequest) {
  // Rate limit webhooks by IP
  const identifier = getClientIdentifier(request);
  const { success: rateLimitSuccess } = await webhookRateLimiter.limit(identifier);
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Get raw body for HMAC verification
  const rawBody = await request.text();

  // Get signature from header
  const signature = request.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
  }

  // Compute expected signature using raw body bytes
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison with explicit length check
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    redactedLog("error", "Webhook signature verification failed", { ip: identifier });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Only parse body after signature verification passes
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const eventType = body.meta?.event_name;
    const attributes = body.data?.attributes;
    const customData = attributes?.custom_data || {};
    const userId = customData.user_id ? parseInt(customData.user_id) : null;

    if (!userId) {
      return NextResponse.json({ error: "No user ID in webhook" }, { status: 400 });
    }

    const lemonSqueezyId = body.data?.id;
    if (!lemonSqueezyId) {
      return NextResponse.json({ error: "No payment ID in webhook" }, { status: 400 });
    }

    const variantId = attributes?.variant_id?.toString();
    const plan = getPlanFromVariantId(variantId) || "pro";

    // Idempotency check: skip if already processed
    const existingPayment = await db.query.payments.findFirst({
      where: eq(payments.lemonSqueezyId, lemonSqueezyId),
    });
    if (existingPayment) {
      redactedLog("info", "Webhook idempotency: already processed", {
        lemonSqueezyId,
        userId,
      });
      return NextResponse.json({ success: true, idempotent: true });
    }

    switch (eventType) {
      case "order_created":
      case "subscription_created": {
        // Validate plan before updating
        const validPlan = plan as "free" | "pro" | "accelerator";
        await db
          .update(users)
          .set({ plan: validPlan })
          .where(eq(users.id, userId));

        await db.insert(payments).values({
          userId,
          lemonSqueezyId,
          orderId: attributes?.order_id?.toString(),
          status: "paid",
          amount: attributes?.total?.toString() || "0",
          currency: attributes?.currency || "USD",
          plan: validPlan,
          paidAt: new Date(),
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        await db
          .update(users)
          .set({ plan: "free" })
          .where(eq(users.id, userId));
        break;
      }

      case "subscription_updated": {
        const validPlan = plan as "free" | "pro" | "accelerator";
        await db
          .update(users)
          .set({ plan: validPlan })
          .where(eq(users.id, userId));
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    redactedLog("error", "Webhook processing error", { error: String(error) });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
