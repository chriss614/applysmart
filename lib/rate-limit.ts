import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis environment variables are not configured");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// General API rate limiter: 100 requests per 15 minutes per IP
export const generalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "15 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/general",
});

// Auth rate limiter: 5 requests per 5 minutes per IP (stricter for login/register)
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

// AI rate limiter per user plan
export const aiRateLimiter = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/ai/free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/ai/pro",
  }),
  accelerator: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 h"),
    analytics: true,
    prefix: "@upstash/ratelimit/ai/accelerator",
  }),
};

// Resume upload rate limiter: 5 uploads per hour
export const uploadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/upload",
});

// Community post rate limiter: 10 posts per hour
export const communityRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@upstash/ratelimit/community",
});
