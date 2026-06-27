import { NextRequest } from "next/server";
import { verifyAccessToken } from "./security";
import type { TokenPayload } from "./security";

/**
 * Centralized auth helper — reads the `token` cookie and verifies it once.
 * Every API route should import this instead of duplicating getUserId/getUserPlan.
 */
export async function getCurrentUser(
  request: NextRequest
): Promise<TokenPayload | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function requireAuth(
  request: NextRequest
): Promise<{ userId: number; email: string; role: string; plan: string } | null> {
  const payload = await getCurrentUser(request);
  if (!payload) return null;
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    plan: payload.plan,
  };
}

/**
 * Get user ID from request (for routes that just need the ID)
 */
export async function getUserId(request: NextRequest): Promise<number | null> {
  const payload = await getCurrentUser(request);
  return payload?.userId ?? null;
}

/**
 * Get user plan from request (for rate limiting / feature gating)
 */
export async function getUserPlan(request: NextRequest): Promise<string> {
  const payload = await getCurrentUser(request);
  return payload?.plan ?? "free";
}

/**
 * Get user role from request
 */
export async function getUserRole(request: NextRequest): Promise<string> {
  const payload = await getCurrentUser(request);
  return payload?.role ?? "user";
}
