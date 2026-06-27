import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ============================================
// Startup Config Validation (fail fast)
// ============================================
function requireEnv(name: string, minLength?: number): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (minLength && value.length < minLength) {
    throw new Error(
      `Environment variable ${name} must be at least ${minLength} characters long`
    );
  }
  return value;
}

export const JWT_SECRET = new TextEncoder().encode(
  requireEnv("JWT_SECRET", 32)
);
export const JWT_REFRESH_SECRET = new TextEncoder().encode(
  requireEnv("JWT_REFRESH_SECRET", 32)
);

// Encryption key: 64-char hex = 32 bytes. Decode and validate at startup.
const ENCRYPTION_KEY_HEX = requireEnv("ENCRYPTION_KEY", 64);
if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY_HEX)) {
  throw new Error(
    "ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, "hex");

// Token expiry constants
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  plan: string;
  iat?: number;
  exp?: number;
}

// ============================================
// Password Security
// ============================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 14);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// JWT Token Management
// ============================================
export async function createAccessToken(
  payload: Omit<TokenPayload, "iat" | "exp">
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setAudience("applysmart.io")
    .setIssuer("applysmart.io")
    .sign(JWT_SECRET);
}

export async function createRefreshToken(
  userId: number,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  return crypto.randomBytes(64).toString("hex");
}

export async function verifyAccessToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      clockTolerance: 60,
      audience: "applysmart.io",
      issuer: "applysmart.io",
    });
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Hash a refresh token for storage in the database.
 * The raw token is NEVER stored — only its SHA-256 hash.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================
// CSRF Protection
// ============================================
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateCsrfToken(request: NextRequest): boolean {
  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = request.cookies.get("csrf-token")?.value;

  if (!csrfHeader || !csrfCookie) return false;

  const headerBuf = Buffer.from(csrfHeader);
  const cookieBuf = Buffer.from(csrfCookie);

  // Explicit length check before timing-safe comparison
  if (headerBuf.length !== cookieBuf.length) return false;

  try {
    return crypto.timingSafeEqual(headerBuf, cookieBuf);
  } catch {
    return false;
  }
}

// ============================================
// Encryption for Sensitive Data (with key version)
// ============================================
const KEY_VERSION = 1; // Increment for rotation

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  // Format: version:iv:authTag:encrypted
  return `${KEY_VERSION}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length === 4) {
    // New format with key version
    const [, ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  // Legacy format (no version prefix)
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ============================================
// Secure Cookie Settings
// ============================================
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

export const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// ============================================
// Rate Limiting Helpers
// ============================================
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ua = request.headers.get("user-agent")?.slice(0, 50) || "";
  return crypto
    .createHash("sha256")
    .update(ip + ua)
    .digest("hex")
    .slice(0, 32);
}

export function hashIpAddress(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

// ============================================
// Account Lockout
// ============================================
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export async function isAccountLocked(
  lockedUntil: Date | null
): Promise<{ locked: boolean; remainingMinutes?: number }> {
  if (!lockedUntil) return { locked: false };
  const now = new Date();
  if (lockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (lockedUntil.getTime() - now.getTime()) / 60000
    );
    return { locked: true, remainingMinutes };
  }
  return { locked: false };
}

// ============================================
// Prompt Injection Detection (logging signal only)
// ============================================
// NOTE: This is a cheap pre-filter / logging signal, NOT a security boundary.
// The real mitigation is treating all AI output as untrusted data and never
// executing it as instructions or code. See lib/ai/openai.ts for Zod validation
// of AI responses before storage.
const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /disregard all prior/i,
  /you are now .* instead/i,
  /system prompt/i,
  /\[\[\[\[/,
  /\]\]\]\]/,
  /HACKED/i,
  /DAN mode/i,
  /jailbreak/i,
];

export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

// ============================================
// File Upload Validation
// ============================================
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAGIC_BYTES: Record<string, Buffer> = {
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP local file header
  doc: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), // OLE Compound File
};

const MIME_TO_MAGIC: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "text/plain": "text", // No magic bytes for plain text
};

export function validateFileUpload(
  fileName: string,
  fileSize: number,
  mimeType: string,
  fileBuffer?: Buffer
): { valid: boolean; error?: string } {
  // Size check (10MB max) — checked before reading into memory
  if (fileSize > 10 * 1024 * 1024) {
    return { valid: false, error: "File size exceeds 10MB limit" };
  }

  // MIME type check
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: "Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed",
    };
  }

  // Extension check
  const ext = fileName.split(".").pop()?.toLowerCase();
  const allowedExts = ["pdf", "doc", "docx", "txt"];
  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: "Invalid file extension" };
  }

  // Extension/MIME consistency check
  const extToMime: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
  };
  if (extToMime[ext] !== mimeType) {
    return {
      valid: false,
      error: "File extension does not match declared MIME type",
    };
  }

  // Magic bytes verification (if buffer provided)
  if (fileBuffer && fileBuffer.length >= 8) {
    const expectedMagic = MIME_TO_MAGIC[mimeType];
    if (expectedMagic && expectedMagic !== "text") {
      const magicBuf = MAGIC_BYTES[expectedMagic];
      if (magicBuf) {
        const slice = fileBuffer.slice(0, magicBuf.length);
        if (!slice.equals(magicBuf)) {
          return {
            valid: false,
            error: `File content does not match expected ${expectedMagic.toUpperCase()} format`,
          };
        }
      }
    }
  }

  return { valid: true };
}

// ============================================
// API Key Generation
// ============================================
export function generateApiKey(): string {
  const prefix = "asm_";
  const random = crypto.randomBytes(32).toString("hex");
  return prefix + random;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// ============================================
// Password Reset Token
// ============================================
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================
// Structured Logging (redacted)
// ============================================
export function redactedLog(
  level: "error" | "warn" | "info",
  message: string,
  meta?: Record<string, unknown>
): void {
  const redacted = { ...meta };
  // Redact sensitive fields
  const sensitiveKeys = [
    "password",
    "token",
    "refreshToken",
    "apiKey",
    "secret",
    "email",
    "passwordHash",
    "passwordResetToken",
  ];
  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = "[REDACTED]";
    }
  }
  // eslint-disable-next-line no-console
  console[level](message, redacted);
}
