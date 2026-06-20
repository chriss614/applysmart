import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlanFromVariantId } from "@/lib/payments";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get("x-signature");

    // Verify webhook signature (in production, verify with Lemon Squeezy secret)
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(body))
        .digest("hex");
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const eventType = body.meta?.event_name;
    const attributes = body.data?.attributes;
    const customData = attributes?.custom_data || {};
    const userId = customData.user_id ? parseInt(customData.user_id) : null;

    if (!userId) {
      return NextResponse.json({ error: "No user ID in webhook" }, { status: 400 });
    }

    const variantId = attributes?.variant_id?.toString();
    const plan = getPlanFromVariantId(variantId) || "pro";

    switch (eventType) {
      case "order_created":
      case "subscription_created":
        // Update user plan
        await db.update(users)
          .set({ plan: plan as any })
          .where(eq(users.id, userId));

        // Record payment
        await db.insert(payments).values({
          userId,
          lemonSqueezyId: body.data.id,
          orderId: attributes?.order_id?.toString(),
          status: "paid",
          amount: attributes?.total?.toString() || "0",
          currency: attributes?.currency || "USD",
          plan: plan as any,
          paidAt: new Date(),
        });
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        // Downgrade to free
        await db.update(users)
          .set({ plan: "free" })
          .where(eq(users.id, userId));
        break;

      case "subscription_updated":
        // Update plan if changed
        await db.update(users)
          .set({ plan: plan as any })
          .where(eq(users.id, userId));
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
