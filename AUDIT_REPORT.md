# ApplySmart Codebase Security & Quality Audit Report

## Executive Summary

This is a production security audit of the applysmart codebase. **Critical findings** include multiple IDOR vulnerabilities, missing CSRF protection on state-changing routes, duplicated auth logic across 10+ files, a completely fake Google OAuth implementation, and numerous dead dependencies. Several frontend features are broken or wired to non-existent API endpoints.

---

## 1. CRITICAL SECURITY VULNERABILITIES

### 1.1 IDOR (Insecure Direct Object Reference)

#### `app/api/resume/analyze/route.ts` — Resume Analysis Cache Leak (Lines 51-62)
**Issue:** When `resumeId` is provided, the route checks the cache but **never verifies the resume belongs to the current user** before returning the cached analysis result.
```typescript
if (resumeId) {
  const cached = await db.query.cachedAnalyses.findFirst({
    where: and(
      eq(cachedAnalyses.resumeId, resumeId),  // <-- Any resumeId!
      eq(cachedAnalyses.analysisType, "ats"),
      eq(cachedAnalyses.promptHash, promptHash)
    ),
  });
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return NextResponse.json({ success: true, result: cached.result, cached: true });
  }
}
```
**Impact:** An attacker can pass arbitrary `resumeId` values to read other users' cached AI analysis results, which may contain sensitive resume content (keywords, strengths, weaknesses, missing keywords).
**Fix:** Verify `resume.userId === userId` before reading the cache.

---

### 1.2 Missing CSRF Validation on State-Changing Routes

#### `app/api/auth/refresh/route.ts` — POST (Lines 7-52)
**Issue:** The refresh token endpoint is **state-changing** (it sets a new `token` cookie) but has **no CSRF validation**.
```typescript
export async function POST(request: NextRequest) {
  // No validateCsrfToken() call anywhere
  const refreshToken = request.cookies.get("refresh_token")?.value;
  // ... creates new access token and sets cookie
}
```
**Impact:** Cross-Site Request Forgery — an attacker can force-refresh a victim's session and obtain a new valid access token, extending session hijacking windows.

#### `app/api/webhooks/lemonsqueezy/route.ts` — POST (Lines 8-78)
**Issue:** No CSRF protection, though this is somewhat expected for webhooks. However, the **signature verification is dangerously weak**:
```typescript
if (secret && signature) {
  const expectedSignature = crypto.createHmac("sha256", secret).update(JSON.stringify(body)).digest("hex");
  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
}
```
**Impact:** If `LEMON_SQUEEZY_WEBHOOK_SECRET` is undefined, the webhook accepts ANY payload with no verification, allowing attackers to grant themselves premium plans freely.
**Fix:** Require signature verification unconditionally; reject webhooks without valid signatures.

---

### 1.3 Completely Fake Google OAuth Implementation

#### `app/api/auth/google/route.ts` — POST (Lines 16-85)
**Issue:** The "Google OAuth" endpoint does **not verify the OAuth `code` with Google at all**. It simply accepts any email from the client and creates/logs in a user.
```typescript
// In a real implementation, verify the Google OAuth code with Google's API
// For now, simplified: find or create user by email
const { code, email } = await request.json();
if (!email) { return ... }
let user = await db.query.users.findFirst({
  where: eq(users.email, email.toLowerCase()),
});
```
**Impact:** **Critical** — Anyone can log in as any user by sending a POST request with any email address. No authentication required. This is a complete authentication bypass for the Google OAuth flow.
**Fix:** Implement actual Google OAuth code verification using Google's token endpoint.

---

### 1.4 Missing Auth Checks & Broken Auth Flows

#### `app/api/auth/reset-password/route.ts` — POST (Lines 8-48)
**Issue:** No rate limiting on password reset. An attacker can brute-force reset tokens. Also, password complexity is only checked as `password.length < 8` — no uppercase, lowercase, number, or special character requirements like the registration schema enforces.

#### `app/api/auth/forgot-password/route.ts` — POST (Lines 10-57)
**Issue:** While email enumeration is partially mitigated by returning the same message, the `sendPasswordResetEmail` is `await`ed synchronously, which leaks timing information. An attacker can measure response time to determine if an account exists (email sent vs. no email sent).
**Fix:** Send email asynchronously with a consistent delay before response.

---

### 1.5 Portfolio Content Not Sanitized (XSS Risk)

#### `app/api/portfolio/route.ts` — POST (Lines 40-85)
**Issue:** The route accepts `content`, `htmlExport`, `publicSlug`, `customDomain` directly from the request body with **no Zod schema validation** and **no HTML sanitization**.
```typescript
const { theme, content, isPublished, publicSlug, customDomain } = await request.json();
// No validation, no sanitization
```
**Impact:** A user can store arbitrary HTML/JS in `content` or `htmlExport`. If this is ever rendered in a public portfolio page without escaping, it becomes a stored XSS vulnerability. The `portfolioSchema` in `lib/validation.ts` exists but is **never used** in this route.

#### `app/(dashboard)/dashboard/portfolio/page.tsx` — Preview (Lines 144-162)
**Issue:** The preview renders user-controlled content without any sanitization. While React escapes JSX by default, if this content is ever rendered as `dangerouslySetInnerHTML` or exported as raw HTML, XSS is trivial.

---

### 1.6 SQL Injection Risk in Job Search

#### `app/api/jobs/route.ts` — GET (Lines 30-35)
**Issue:** The `jobFilterSchema` is imported but **never used**. Query parameters are parsed manually with `parseInt` but no Zod validation. The search query uses Drizzle's `sql` tag, which is parameterized and safe, but the lack of input validation means unexpected values can be passed for `salaryMin`, `salaryMax`, etc.
```typescript
// jobFilterSchema is imported but NEVER called
const filters = {
  query: searchParams.get("query") || undefined,
  // ... no validation
};
if (filters.query) {
  conditions.push(
    sql`(${jobs.title} ILIKE ${`%${filters.query}%`} OR ${jobs.description} ILIKE ${`%${filters.query}%`})`
  );
}
```
The `experienceLevel` parameter is cast with `as any` (line 25), bypassing type safety.

---

## 2. AUTH PATTERN ISSUES

### 2.1 Inconsistent Auth: `getUserId` Duplicated in 10+ Files

Every protected API route duplicates the same `getUserId` helper instead of importing a shared one:

| File | Lines |
|------|-------|
| `app/api/auth/profile/route.ts` | 10-15 |
| `app/api/analytics/route.ts` | 9-14 |
| `app/api/applications/route.ts` | 9-14 |
| `app/api/coach/route.ts` | 9-14 |
| `app/api/community/route.ts` | 9-14 |
| `app/api/interview/generate/route.ts` | 8-13 |
| `app/api/interview/submit/route.ts` | 9-14 |
| `app/api/portfolio/route.ts` | 9-14 |
| `app/api/resume/analyze/route.ts` | 10-15 |
| `app/api/resume/upload/route.ts` | 8-13 |

**Impact:** Maintenance nightmare. If the token verification logic needs to change (e.g., adding token revocation checks), every file must be updated independently. One missed file = security gap.
**Fix:** Create `lib/auth.ts` with a shared `getUserId(request)` helper and import it everywhere.

### 2.2 `getUserPlan` Also Duplicated

The same pattern appears for `getUserPlan` in:
- `app/api/coach/route.ts` (16-21)
- `app/api/interview/generate/route.ts` (15-20)
- `app/api/interview/submit/route.ts` (16-21)
- `app/api/resume/analyze/route.ts` (17-22)

---

## 3. VALIDATION ISSUES

### 3.1 Zod Schemas Missing `.strict()` on PATCH Handlers

#### `lib/validation.ts` — `profileUpdateSchema` (Lines 177-184)
```typescript
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  targetRole: z.string().max(100).optional(),
  // ... no .strict()
});
```
**Impact:** Extra fields in the request body are silently ignored rather than rejected. This can hide bugs and allow unexpected data through.

#### `lib/validation.ts` — `applicationUpdateSchema` (Lines 94-106)
Same issue — no `.strict()`.

#### `lib/validation.ts` — `portfolioSchema` (Lines 111-142)
Same issue — no `.strict()`.

#### `lib/validation.ts` — `coachMessageSchema` (Lines 147-154)
Same issue — no `.strict()`.

---

### 3.2 Portfolio Route Has NO Schema Validation at All

#### `app/api/portfolio/route.ts` — POST (Lines 50-81)
```typescript
const { theme, content, isPublished, publicSlug, customDomain } = await request.json();
```
**Impact:** Arbitrary JSON can be stored. No type safety, no field limits, no URL validation on `customDomain`, no slug format validation. The `portfolioSchema` in `lib/validation.ts` is never imported or used here.

---

### 3.3 Coach Route Has NO Schema Validation on Input

#### `app/api/coach/route.ts` — POST (Lines 60-77)
```typescript
const { message, context } = await request.json();
if (!message || message.length < 1) {
  return NextResponse.json({ error: "Message required" }, { status: 400 });
}
```
**Impact:** No validation on `context` shape or `message` max length. `coachMessageSchema` exists in `lib/validation.ts` but is **not used**.

---

### 3.4 AI Output Not Validated with Zod

#### `app/api/coach/route.ts` (Lines 92-98)
```typescript
const response = await safeAiCall<{ response: string }>(...);
const aiResponse = response?.response || "I'm here to help...";
```
**Impact:** The AI response is cast to a generic type with no runtime validation. If the AI returns malformed JSON, an unexpected shape, or injection content, it's stored directly in the database and served to users.
**Fix:** Use Zod to parse and validate AI output before storing.

Same issue in:
- `app/api/interview/generate/route.ts` (Lines 45-62)
- `app/api/interview/submit/route.ts` (Lines 61-71)
- `app/api/resume/analyze/route.ts` (Lines 66-76)

---

## 4. RATE LIMITING GAPS

### 4.1 Routes Missing Rate Limiting

| Route | Method | Missing? |
|-------|--------|----------|
| `/api/auth/refresh` | POST | **Yes** — No rate limiter at all |
| `/api/auth/reset-password` | POST | **Yes** — No rate limiter (only CSRF) |
| `/api/coach` | GET | **Yes** — No rate limiter on message history fetch |
| `/api/portfolio` | GET | **Yes** — No rate limiter |
| `/api/jobs` | GET | Has generalRateLimiter, but per-IP not per-user |
| `/api/webhooks/lemonsqueezy` | POST | No rate limiter (webhooks should have source IP limits) |

---

## 5. CONSOLE LOGS & SECRET LEAKAGE

### 5.1 Error Logging Could Leak Sensitive Data

Multiple routes log raw error objects to console, which may contain database errors, stack traces, or internal state:

| File | Line | Issue |
|------|------|-------|
| `app/api/auth/login/route.ts` | 117 | `console.error("Login error:", error)` |
| `app/api/auth/register/route.ts` | 100 | `console.error("Registration error:", error)` |
| `app/api/auth/logout/route.ts` | 30 | `console.error("Logout error:", error)` |
| `app/api/auth/refresh/route.ts` | 50 | `console.error("Refresh error:", error)` |
| `app/api/auth/forgot-password/route.ts` | 55 | `console.error("Forgot password error:", error)` |
| `app/api/auth/reset-password/route.ts` | 46 | `console.error("Reset password error:", error)` |
| `app/api/coach/route.ts` | 109 | `console.error("Coach error:", error)` |
| `app/api/resume/analyze/route.ts` | 94 | `console.error("Resume analysis error:", error)` |
| `lib/ai/openai.ts` | 158 | `console.error("AI call error:", error)` — may log OpenAI API errors with request context |
| `lib/email.ts` | 39 | `console.error("Email send error:", error)` — may expose email addresses or API keys |

### 5.2 Configuration Leakage

| File | Line | Issue |
|------|------|-------|
| `lib/ai/openai.ts` | 4-5 | `console.warn("OPENAI_API_KEY is not defined...")` — reveals config state to logs |
| `lib/email.ts` | 4 | `console.warn("RESEND_API_KEY is not defined...")` — reveals config state |
| `lib/payments.ts` | 3-5 | `throw new Error("LEMON_SQUEEZY_API_KEY is not defined")` — startup failure reveals config |

---

## 6. DEAD DEPENDENCIES (package.json)

The following dependencies are listed in `package.json` but **never imported or used** anywhere in the codebase:

| Dependency | Status | Evidence |
|------------|--------|----------|
| `ioredis` | Dead | `lib/rate-limit.ts` uses `@upstash/redis` instead |
| `rate-limiter-flexible` | Dead | `lib/rate-limit.ts` uses `@upstash/ratelimit` instead |
| `@aws-sdk/client-ses` | Dead | `lib/email.ts` uses `resend` instead |
| `@aws-sdk/client-s3` | Dead | Resume upload simulates storage with a hash URL; no S3 usage |
| `@vercel/blob` | Dead | Not imported anywhere |
| `@vercel/edge-config` | Dead | Not imported anywhere |
| `@vercel/functions` | Dead | Not imported anywhere |
| `html2canvas` | Dead | Not imported anywhere |
| `jspdf` | Dead | Not imported anywhere |
| `react-markdown` | Dead | Not imported anywhere |
| `remark-gfm` | Dead | Not imported anywhere |
| `cmdk` | Dead | Not imported anywhere |
| `@tanstack/react-table` | Dead | Not imported anywhere |
| `react-intersection-observer` | Dead | Not imported anywhere |
| `react-textarea-autosize` | Dead | Not imported anywhere |
| `use-debounce` | Dead | Not imported anywhere |
| `nanoid` | Dead | Not imported anywhere |
| `sharp` | Dead | Not imported anywhere |
| `date-fns` | Dead | `lib/utils.ts` implements its own `formatDate()` |
| `@types/bun` | Dead (dev) | Project uses Node/Vercel, not Bun runtime |

**Impact:** Increased bundle size, longer build times, larger attack surface, potential supply-chain vulnerabilities from unused packages.

---

## 7. BUGS & BROKEN FEATURES

### 7.1 Favorite Button Broken in Application Tracker

#### `app/(dashboard)/dashboard/applications/page.tsx` — Line 166
```typescript
onClick={() => updateStatus(app.id, app.isFavorite ? "saved" : "saved")}
```
**Issue:** The ternary always evaluates to `"saved"` regardless of `isFavorite`. The star button is supposed to toggle favorite status, but it:
1. Calls `updateStatus` which sends `{ id, status }` — not `isFavorite`
2. Always passes `"saved"` as the status
3. Never actually toggles the `isFavorite` field

**Impact:** The favorite/star feature is completely non-functional.

---

### 7.2 Interview Page Hardcodes Session ID

#### `app/(dashboard)/dashboard/interview/page.tsx` — Line 89
```typescript
body: JSON.stringify({
  sessionId: 1, // In real app, use actual session ID
  questionId: questions[currentQuestion].id,
  response,
}),
```
**Issue:** `sessionId` is hardcoded to `1`. Every interview submission goes to session ID 1, which will cause:
- All responses stored in the wrong session
- Interview history completely broken

**Impact:** Interview practice feature is broken; all feedback goes to a single session.

---

### 7.3 Analytics Page Uses Mock Data for Interview Scores

#### `app/(dashboard)/dashboard/analytics/page.tsx` — Lines 152-157
```typescript
<BarChart data={[
  { name: "Technical", score: data?.summary.avgInterviewScore || 0 },
  { name: "Behavioral", score: Math.min(100, (data?.summary.avgInterviewScore || 0) + 5) },
  { name: "System Design", score: Math.max(0, (data?.summary.avgInterviewScore || 0) - 3) },
  { name: "Overall", score: data?.summary.avgInterviewScore || 0 },
]}>
```
**Issue:** Behavioral and System Design scores are fabricated with `+5` and `-3` offsets. The API doesn't return per-category scores, so the frontend makes them up.

---

### 7.4 Community Frontend Has Wrong Data Types

#### `app/(dashboard)/dashboard/community/page.tsx` — Lines 8-16
```typescript
interface Post {
  id: number;
  title: string;
  content: string;
  author: string;  // <-- API returns userId, not author!
  tags: string[];
  // ...
}
```
**Issue:** The frontend expects `author: string` but the API (`app/api/community/route.ts`) returns the raw `communityPosts` row which contains `userId: number`, not `author`. The `author` field will always be undefined. Also, the frontend expects `commentCount` and `upvotes` but the DB schema stores `upvotes` and `viewCount` — no `commentCount` field exists.

---

### 7.5 Settings Page Has Non-Functional Security Section

#### `app/(dashboard)/dashboard/settings/page.tsx` — Lines 194-208
Password inputs are uncontrolled (no state), and the "Update Password" button has **no onClick handler**. There is no API endpoint for password change. The feature is completely non-functional.

---

### 7.6 Checkout Page Doesn't Actually Create Checkout

#### `app/(dashboard)/dashboard/checkout/page.tsx` — Lines 14-27
The checkout page just redirects to `plan.href` (e.g., `/register` or `/dashboard/checkout`). It never calls `createCheckoutUrl` from `lib/payments.ts`. The `lib/payments.ts` function is completely unused.

---

### 7.7 Resume Upload Does Not Actually Upload Files

#### `app/api/resume/upload/route.ts` — Lines 44-57
Files are hashed but never stored. The `fileUrl` points to a non-existent domain. The `parsedContent` field is only populated for `text/plain` files — PDF/DOCX parsing is not implemented. The `validateFileUpload` in `lib/security.ts` accepts a `fileBuffer` parameter for magic bytes checking, but the route doesn't pass it:
```typescript
const validation = validateFileUpload(file.name, file.size, file.type);  // fileBuffer missing!
```

---

### 7.8 Magic Bytes Check Incomplete

#### `lib/security.ts` — Lines 219-251
DOCX magic bytes are defined but never checked! Only PDF is validated.

---

## 8. MISSING FEATURES (Route Exists but Not Wired)

### 8.1 Missing API Endpoints for Frontend Features

| Frontend Feature | File | Missing API Endpoint |
|------------------|------|----------------------|
| Password change | `settings/page.tsx` | `PATCH /api/auth/password` (no route exists) |
| Account deletion | `settings/page.tsx` | `DELETE /api/auth/account` (no route exists) |
| Toggle favorite | `applications/page.tsx` | `PATCH /api/applications` with `isFavorite` (frontend sends `status` instead) |
| Add comment | `community/page.tsx` | `POST /api/community/comments` (no route exists) |
| Upvote post | `community/page.tsx` | `POST /api/community/upvote` (no route exists) |
| Public portfolio | No route for `/p/:slug` | `GET /p/[slug]` or `GET /api/portfolio/public` (no route exists) |
| Delete application | `applications/page.tsx` | `DELETE /api/applications` (no route exists) |
| Delete resume | `resume/page.tsx` | `DELETE /api/resume` (no route exists) |
| Delete portfolio | `portfolio/page.tsx` | `DELETE /api/portfolio` (no route exists) |

### 8.2 Unused Database Tables

| Table | Schema Location | Status |
|-------|-----------------|--------|
| `userJobMatches` | `lib/db/schema.ts` line 208 | Completely unused — no API routes, no frontend references |
| `events` | `lib/db/schema.ts` line 460 | Defined but no write or read routes |
| `communityComments` | `lib/db/schema.ts` line 412 | Defined but no API endpoints |

### 8.3 Missing `isActive`/`isRemote` Default Filtering

While `app/api/jobs/route.ts` line 30 does include `eq(jobs.isActive, true)`, the **`isRemote` filter is only applied when explicitly requested**. The `jobs` table has many non-remote jobs (default `isRemote = true` but could be `false`). If the UI doesn't send `remote=true`, all jobs are returned regardless of remote status. This may or may not be intentional, but there is no way to filter for "non-remote only" or set remote as a default.

---

## 9. CODE QUALITY & MAINTENANCE ISSUES

### 9.1 Race Condition in Account Lockout

#### `app/api/auth/login/route.ts` — Lines 63-68
```typescript
const newAttempts = (user.failedLoginAttempts || 0) + 1;
const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
await db.update(users).set({
  failedLoginAttempts: newAttempts,
  lockedUntil: lockUntil,
}).where(eq(users.id, user.id));
```
**Issue:** Read-increment-write without a transaction. Two concurrent failed login attempts could read the same value, increment to the same result, and fail to trigger lockout.

### 9.2 No Database Transactions for Multi-Step Operations

#### `app/api/auth/register/route.ts` — Lines 54-98
User is inserted, then tokens are created, then session is inserted, then cookies are set. If token creation fails after user insert, the user exists but cannot log in. No rollback.

### 9.3 Email Enumeration via Registration

#### `app/api/auth/register/route.ts` — Lines 46-48
```typescript
if (existingUser) {
  return NextResponse.json({ error: "Email already registered" }, { status: 409 });
}
```
**Issue:** Returns a specific error message that confirms an email exists. Should return a generic message like "If this email is not registered, an account has been created."

### 9.4 HSTS Header Duplicated

Both `middleware.ts` (lines 56-58) and `next.config.ts` (line 23) set `Strict-Transport-Security`. Redundant.

### 9.5 CSP Overly Permissive

#### `next.config.ts` — Line 34
```typescript
value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ..."
```
**Issue:** `'unsafe-inline'` and `'unsafe-eval'` significantly weaken the Content Security Policy, allowing inline scripts and `eval()` which are common XSS vectors.

### 9.6 Type Safety Issues

| File | Line | Issue |
|------|------|-------|
| `app/api/jobs/route.ts` | 25 | `experienceLevel: searchParams.get("experienceLevel") as any` — unsafe cast |
| `app/api/applications/route.ts` | 36 | `eq(applications.status, status as any)` — unsafe cast |
| `app/api/webhooks/lemonsqueezy/route.ts` | 42 | `plan: plan as any` — unsafe cast on user plan update |

---

## 10. RECOMMENDATIONS BY PRIORITY

### Critical (Fix Immediately)
1. **Fix fake Google OAuth** — Verify the OAuth code with Google's token endpoint before creating/logging in a user.
2. **Fix IDOR in resume analysis** — Verify `resume.userId === userId` before reading cached analysis.
3. **Add CSRF to refresh endpoint** — `POST /api/auth/refresh` must validate CSRF tokens.
4. **Require webhook signature verification** — `POST /api/webhooks/lemonsqueezy` must reject requests without valid signatures unconditionally.
5. **Add Zod validation to portfolio route** — Use `portfolioSchema` and sanitize HTML content.

### High (Fix This Sprint)
6. **Extract shared `getUserId` helper** into `lib/auth.ts` and remove all 10+ duplications.
7. **Add `.strict()` to all PATCH/POST schemas** to reject unexpected fields.
8. **Add Zod validation to AI outputs** before storing in database.
9. **Add rate limiting** to `/api/auth/refresh`, `/api/auth/reset-password`, and `/api/portfolio`.
10. **Fix hardcoded `sessionId: 1`** in the interview frontend.
11. **Implement actual file upload** to Vercel Blob/S3 instead of fake URLs.
12. **Fix the favorite button** in the application tracker to actually toggle `isFavorite`.

### Medium (Fix Next Sprint)
13. **Remove 19+ dead dependencies** from `package.json`.
14. **Fix community frontend data types** to match API response shape (`userId` vs `author`).
15. **Implement password change endpoint** and wire up the settings UI.
16. **Add transactions** for multi-step DB operations (registration, portfolio updates).
17. **Fix email enumeration** in registration by returning generic messages.
18. **Complete DOCX magic bytes validation** in `validateFileUpload`.
19. **Add `DELETE` endpoints** for applications, resumes, and portfolios.
20. **Implement public portfolio route** at `/p/[slug]`.

### Low (Backlog)
21. **Harden CSP** by removing `'unsafe-inline'` and `'unsafe-eval'` where possible.
22. **Fix analytics mock data** for interview category scores.
23. **Implement checkout flow** using `lib/payments.ts#createCheckoutUrl`.
24. **Add comment/upvote endpoints** for community posts.
25. **Remove duplicated HSTS headers** (pick one: middleware or next.config).

---

## Appendix: File-by-File Summary

| File | Purpose | Issues |
|------|---------|--------|
| `app/api/analytics/route.ts` | Aggregates user career stats | `getUserId` duplicated; no POST/PATCH to update |
| `app/api/applications/route.ts` | CRUD for job applications | `getUserId` duplicated; no DELETE; PATCH missing `.strict()`; frontend favorite broken |
| `app/api/auth/forgot-password/route.ts` | Sends password reset email | Timing side-channel; no rate limit on email sending |
| `app/api/auth/google/route.ts` | Google OAuth login | **CRITICAL: Complete auth bypass** — no code verification |
| `app/api/auth/login/route.ts` | User login | Lockout race condition; error logged |
| `app/api/auth/logout/route.ts` | Session revocation | `cookies` imported but unused; error logged |
| `app/api/auth/profile/route.ts` | Read/update profile | `getUserId` duplicated; PATCH missing `.strict()` |
| `app/api/auth/refresh/route.ts` | Refresh access token | **Missing CSRF**; no rate limit; error logged |
| `app/api/auth/register/route.ts` | User registration | No transaction; email enumeration; error logged |
| `app/api/auth/reset-password/route.ts` | Reset password | No rate limit; weak password validation; no confirmPassword check |
| `app/api/coach/route.ts` | AI career coach chat | `getUserId` duplicated; no input Zod validation; no AI output Zod validation; GET has no rate limit |
| `app/api/community/route.ts` | Community posts | `getUserId` duplicated; GET public by design (OK) |
| `app/api/health/route.ts` | Health check | None — clean |
| `app/api/interview/generate/route.ts` | Generate interview questions | `getUserId` duplicated; no AI output Zod validation |
| `app/api/interview/submit/route.ts` | Submit interview answers | `getUserId` duplicated; no AI output Zod validation; frontend hardcodes `sessionId: 1` |
| `app/api/jobs/route.ts` | Search job listings | `jobFilterSchema` imported but never used; `as any` casts; `isRemote` only filtered when true |
| `app/api/portfolio/route.ts` | Save portfolio | `getUserId` duplicated; **no Zod validation at all**; no HTML sanitization |
| `app/api/resume/analyze/route.ts` | AI resume analysis | `getUserId` duplicated; **IDOR cache leak**; no AI output Zod validation |
| `app/api/resume/upload/route.ts` | Upload resume | `getUserId` duplicated; fake file URL; no magic bytes check; no fileBuffer passed |
| `app/api/webhooks/lemonsqueezy/route.ts` | Payment webhooks | Signature verification optional; no rate limit; `as any` cast |
| `app/(auth)/*` | Auth pages | Login/register UIs functional; reset-password has hardcoded `sessionId: 1` bug |
| `app/(dashboard)/*` | Dashboard pages | Interview `sessionId` hardcoded; favorite broken; analytics mock data; community wrong types; settings non-functional password change; checkout non-functional |
| `app/(marketing)/*` | Marketing pages | Functional; no issues |
| `components/*` | Shared components | Clean; no issues |
| `lib/ai/openai.ts` | OpenAI client | Config logged; no output validation; generic error logging |
| `lib/db/schema.ts` | Database schema | `userJobMatches`, `events`, `communityComments` unused |
| `lib/email.ts` | Email service | Config logged; error may leak secrets |
| `lib/payments.ts` | Payment utilities | `createCheckoutUrl` unused; `lemonsqueezy` client created but only used here |
| `lib/rate-limit.ts` | Rate limiting | Upstash configured; some limiters unused by routes |
| `lib/security.ts` | Security utilities | DOCX magic bytes defined but unchecked; `ENCRYPTION_KEY` falls back to random (data loss on restart); encryption/decryption functions unused |
| `lib/validation.ts` | Zod schemas | Several schemas missing `.strict()`; `portfolioSchema` unused in route |
| `lib/utils.ts` | Utilities | `date-fns` dead dependency; custom `formatDate` used instead |
| `middleware.ts` | Next.js middleware | HSTS duplicated; `x-user-*` headers set but not consumed by routes (routes re-verify token) |
| `next.config.ts` | Next.js config | HSTS duplicated; CSP overly permissive |
| `package.json` | Dependencies | 19+ dead dependencies |
