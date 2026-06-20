import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);

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

//============================================
// Password Security
//============================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 14); // Increased from 12 to 14 for higher security
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

//============================================
// JWT Token Management
//============================================
export async function createAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
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
  const token = crypto.randomBytes(64).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // Store in database via API route
  return token;
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
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

export async function verifyRefreshToken(token: string): Promise<number | null> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  // Database verification handled in API routes
  return null;
}

//============================================
// Input Sanitization & Validation
//============================================
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:/gi, "")
    .trim()
    .slice(0, 10000);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

//============================================
// CSRF Protection
//============================================
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateCsrfToken(request: NextRequest): boolean {
  const csrfHeader = request.headers.get("x-csrf-token");
  const csrfCookie = request.cookies.get("csrf-token")?.value;

  if (!csrfHeader || !csrfCookie) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(csrfHeader),
      Buffer.from(csrfCookie)
    );
  } catch {
    return false;
  }
}

//============================================
// Encryption for Sensitive Data
//============================================
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY.slice(0, 32).padEnd(32, "!"))
  : crypto.randomBytes(32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

//============================================
// Secure Cookie Settings
//============================================
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

//============================================
// Rate Limiting Helpers
//============================================
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent")?.slice(0, 50) || "";
  return crypto.createHash("sha256").update(ip + ua).digest("hex").slice(0, 32);
}

export function hashIpAddress(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

//============================================
// Account Lockout
//============================================
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

export async function isAccountLocked(lockedUntil: Date | null): Promise<{ locked: boolean; remainingMinutes?: number }> {
  if (!lockedUntil) return { locked: false };
  const now = new Date();
  if (lockedUntil > now) {
    const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
    return { locked: true, remainingMinutes };
  }
  return { locked: false };
}

//============================================
// Prompt Injection Detection
//============================================
const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /disregard all prior/i,
  /you are now .* instead/i,
  /system prompt/i,
  /\[\[\[\[\[/,
  /\]\]\]\]\]/,
  /HACKED/i,
  /DAN mode/i,
  /jailbreak/i,
];

export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

//============================================
// File Upload Validation
//============================================
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAGIC_BYTES: Record<string, Buffer> = {
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
};

export function validateFileUpload(
  fileName: string,
  fileSize: number,
  mimeType: string,
  fileBuffer?: Buffer
): { valid: boolean; error?: string } {
  // Size check (10MB max)
  if (fileSize > 10 * 1024 * 1024) {
    return { valid: false, error: "File size exceeds 10MB limit" };
  }

  // MIME type check
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: "Invalid file type. Only PDF, DOC, DOCX allowed" };
  }

  // Extension check
  const ext = fileName.split(".").pop()?.toLowerCase();
  const allowedExts = ["pdf", "doc", "docx", "txt"];
  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: "Invalid file extension" };
  }

  // Magic bytes verification (if buffer provided)
  if (fileBuffer && fileBuffer.length >= 4) {
    if (mimeType === "application/pdf" && !fileBuffer.slice(0, 4).equals(MAGIC_BYTES.pdf)) {
      return { valid: false, error: "File content does not match PDF format" };
    }
  }

  return { valid: true };
}

//============================================
// API Key Generation
//============================================
export function generateApiKey(): string {
  const prefix = "asm_";
  const random = crypto.randomBytes(32).toString("hex");
  return prefix + random;
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}
