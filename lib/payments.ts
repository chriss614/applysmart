import { LemonSqueezy } from "lemonsqueezy.ts";

if (!process.env.LEMON_SQUEEZY_API_KEY) {
  throw new Error("LEMON_SQUEEZY_API_KEY is not defined");
}

const lemonsqueezy = new LemonSqueezy({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY,
});

export { lemonsqueezy };

export const PLAN_VARIANTS = {
  free: {
    name: "Free",
    lemonSqueezyVariantId: null,
    price: 0,
    features: [
      "3 resume optimizations/month",
      "Basic ATS scoring",
      "Job matching (5/day)",
      "3 interview practices/month",
      "Basic portfolio template",
      "Community access",
    ],
  },
  pro: {
    name: "Pro",
    lemonSqueezyVariantId: process.env.LEMON_SQUEEZY_PRO_VARIANT_ID,
    price: 19,
    features: [
      "Unlimited resume optimizations",
      "Advanced ATS + readability scoring",
      "Unlimited job matching",
      "Unlimited interview practice",
      "All portfolio themes + custom domain",
      "Application tracker with AI insights",
      "Priority AI processing",
      "Export to PDF/HTML",
    ],
  },
  accelerator: {
    name: "Accelerator",
    lemonSqueezyVariantId: process.env.LEMON_SQUEEZY_ACCELERATOR_VARIANT_ID,
    price: 49,
    features: [
      "Everything in Pro",
      "1-on-1 AI Career Coach",
      "Weekly personalized reports",
      "Salary negotiation scripts",
      "Referral optimization",
      "LinkedIn profile optimization",
      "Priority support",
      "Early access to new features",
    ],
  },
};

export function getPlanFromVariantId(variantId: string): "free" | "pro" | "accelerator" | null {
  if (variantId === PLAN_VARIANTS.pro.lemonSqueezyVariantId) return "pro";
  if (variantId === PLAN_VARIANTS.accelerator.lemonSqueezyVariantId) return "accelerator";
  return null;
}

export async function createCheckoutUrl({
  variantId,
  userId,
  email,
}: {
  variantId: string;
  userId: number;
  email: string;
}): Promise<string> {
  const checkout = await lemonsqueezy.checkout.create({
    store: process.env.LEMON_SQUEEZY_STORE_ID!,
    variant: variantId,
    checkout_options: {
      embed: false,
      media: false,
      logo: true,
      discount: true,
    },
    checkout_data: {
      email,
      custom: {
        user_id: String(userId),
      },
    },
  });

  return checkout.data.attributes.url;
}
