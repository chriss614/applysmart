import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock env before importing auth module
vi.mock("../env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-min-32-chars-long!!",
    JWT_REFRESH_SECRET: "test-refresh-secret-min-32-chars!!",
    ENCRYPTION_KEY: "a".repeat(64),
  },
}));

import { getCurrentUser, getUserId, getUserPlan } from "../lib/auth";

function createMockRequest(cookies: Record<string, string> = {}): NextRequest {
  const headers = new Headers();
  const cookieString = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  if (cookieString) headers.set("cookie", cookieString);

  return new NextRequest("http://localhost/api/test", { headers });
}

describe("auth.ts", () => {
  describe("getCurrentUser", () => {
    it("should return null when no token cookie", async () => {
      const req = createMockRequest();
      const user = await getCurrentUser(req);
      expect(user).toBeNull();
    });

    it("should return null for invalid token", async () => {
      const req = createMockRequest({ token: "invalid-token" });
      const user = await getCurrentUser(req);
      expect(user).toBeNull();
    });
  });

  describe("getUserId", () => {
    it("should return null when no token", async () => {
      const req = createMockRequest();
      const userId = await getUserId(req);
      expect(userId).toBeNull();
    });
  });

  describe("getUserPlan", () => {
    it("should return 'free' when no token", async () => {
      const req = createMockRequest();
      const plan = await getUserPlan(req);
      expect(plan).toBe("free");
    });
  });
});
