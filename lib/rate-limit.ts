import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

//============================================
// In-memory fallback for dev/test (NOT for production)
//============================================
interface InMemoryLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, InMemoryLimitEntry>();

function createInMemoryLimiter(
  requests: number,
  windowMs: number
): { limit: (identifier: string) => Promise<{ success: boolean }> } {
  return {
    async limit(identifier: string) {
      const now = Date.now();
      const entry = inMemoryStore.get(identifier);
      if (!entry || now > entry.resetAt) {
        inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true };
      }
      if (entry.count < requests) {
        entry.count++;
        return { success: true };
      }
      return { success: false };
    },
  };
}

//============================================
// Redis initialization with graceful fallback
//============================================
let redis: Redis | null = null;
let usingInMemory = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Upstash Redis environment variables are required in production. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
  );
} else {
  usingInMemory = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[rate-limit] Upstash Redis not configured. Using in-memory rate limiter (NOT safe for production)."
  );
}

function createLimiter(
  requests: number,
  window: string,
  prefix: string
): { limit: (identifier: string) => Promise<{ success: boolean }> } {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      analytics: true,
      prefix: `@upstash/ratelimit/${prefix}`,
    });
  }
  // Parse window string (e.g., "15 m" -> 15 minutes in ms)
  const [amount, unit] = window.split(" ");
  const amountNum = parseInt(amount);
  const unitMs =
    unit === "m" || unit === "min" || unit === "minute" || unit === "minutes"
      ? 60 * 1000
      : unit === "h" || unit === "hr" || unit === "hour" || unit === "hours"
      ? 60 * 60 * 1000
      : unit === "d" || unit === "day" || unit === "days"
      ? 24 * 60 * 60 * 1000
      : 60 * 1000;
  return createInMemoryLimiter(amountNum, amountNum * unitMs);
}

// General API rate limiter: 100 requests per 15 minutes per IP
export const generalRateLimiter = createLimiter(
  100,
  "15 m",
  "general"
);

// Auth rate limiter: 5 requests per 5 minutes per IP (stricter for login/register)
export const authRateLimiter = createLimiter(5, "5 m", "auth");

// AI rate limiter per user plan
export const aiRateLimiter = {
  free: createLimiter(10, "1 h", "ai/free"),
  pro: createLimiter(50, "1 h", "ai/pro"),
  accelerator: createLimiter(200, "1 h", "ai/accelerator"),
};

// Resume upload rate limiter: 5 uploads per hour
export const uploadRateLimiter = createLimiter(5, "1 h", "upload");

// Community post rate limiter: 10 posts per hour
export const communityRateLimiter = createLimiter(10, "1 h", "community");

// Webhook rate limiter: 20 requests per minute (for lemonsqueezy webhooks)
export const webhookRateLimiter = createLimiter(20, "1 m", "webhook");

// Password reset rate limiter: 3 requests per 15 minutes
export const passwordResetRateLimiter = createLimiter(3, "15 m", "password-reset");

// Refresh token rate limiter: 10 requests per 5 minutes
export const refreshRateLimiter = createLimiter(10, "5 m", "refresh");
