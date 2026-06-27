import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env before importing security module
vi.mock("../env", () => ({
  env: {
    JWT_SECRET: "test-jwt-secret-min-32-chars-long!!",
    JWT_REFRESH_SECRET: "test-refresh-secret-min-32-chars!!",
    ENCRYPTION_KEY: "a".repeat(64),
  },
}));

import {
  hashRefreshToken,
  validateFileUpload,
  redactedLog,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
} from "../lib/security";

describe("security.ts", () => {
  describe("hashRefreshToken", () => {
    it("should return a consistent hex hash for the same token", () => {
      const token = "my-refresh-token-123";
      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should return different hashes for different tokens", () => {
      const hash1 = hashRefreshToken("token-a");
      const hash2 = hashRefreshToken("token-b");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("validateFileUpload", () => {
    it("should reject files over 10MB", () => {
      const result = validateFileUpload("resume.pdf", 11 * 1024 * 1024, "application/pdf");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("10MB");
    });

    it("should reject invalid MIME types", () => {
      const result = validateFileUpload("image.png", 1024, "image/png");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid file type");
    });

    it("should accept valid PDF without buffer", () => {
      const result = validateFileUpload("resume.pdf", 1024, "application/pdf");
      expect(result.valid).toBe(true);
      expect(result.storageKey).toBeTruthy();
    });

    it("should reject PDF with wrong magic bytes", () => {
      const fakePdf = Buffer.from("NOTPDF");
      const result = validateFileUpload("fake.pdf", 1024, "application/pdf", fakePdf);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("MIME type mismatch");
    });

    it("should accept valid PDF with correct magic bytes", () => {
      const realPdf = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const result = validateFileUpload("resume.pdf", 1024, "application/pdf", realPdf);
      expect(result.valid).toBe(true);
    });

    it("should accept valid DOCX with correct magic bytes", () => {
      const docx = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      const result = validateFileUpload("resume.docx", 1024, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx);
      expect(result.valid).toBe(true);
    });

    it("should reject DOC with mismatched MIME", () => {
      const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
      const result = validateFileUpload("resume.doc", 1024, "application/pdf", ole);
      expect(result.valid).toBe(false);
    });
  });

  describe("redactedLog", () => {
    it("should redact password in message", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      redactedLog("error", "User login failed", { password: "secret123" });
      const call = consoleSpy.mock.calls[0];
      expect(JSON.stringify(call)).not.toContain("secret123");
      expect(JSON.stringify(call)).toContain("[REDACTED]");
      consoleSpy.mockRestore();
    });

    it("should redact token fields", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      redactedLog("error", "Auth error", { token: "abc", refreshToken: "xyz", apiKey: "key" });
      const call = consoleSpy.mock.calls[0];
      const str = JSON.stringify(call);
      expect(str).not.toContain("abc");
      expect(str).not.toContain("xyz");
      expect(str).not.toContain("key");
      consoleSpy.mockRestore();
    });

    it("should not modify safe fields", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      redactedLog("log", "Request", { userId: 123, path: "/api/test" });
      const call = consoleSpy.mock.calls[0];
      expect(JSON.stringify(call)).toContain("123");
      expect(JSON.stringify(call)).toContain("/api/test");
      consoleSpy.mockRestore();
    });
  });

  describe("JWT secrets", () => {
    it("should be Uint8Arrays of correct length", () => {
      expect(JWT_SECRET).toBeInstanceOf(Uint8Array);
      expect(JWT_SECRET.length).toBe(32);
      expect(JWT_REFRESH_SECRET).toBeInstanceOf(Uint8Array);
      expect(JWT_REFRESH_SECRET.length).toBe(32);
    });
  });
});
