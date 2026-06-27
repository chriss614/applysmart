# Changelog

All notable changes to ApplySmart 2.0 are documented in this file.

## [2.0.0] — 2025-06-27

### Security (Production Hardening)
- **Webhook Authentication**: Mandatory HMAC signature verification for Lemon Squeezy webhooks with raw body parsing, `timingSafeEqual`, and idempotency checks
- **Refresh Token Hashing**: All refresh tokens are SHA-256 hashed before DB storage (login, register, Google, refresh, logout)
- **Duplicate Index Fix**: Renamed conflicting Postgres index names (`applications_status_idx`, `payments_status_idx`, etc.)
- **Centralized Auth**: New `lib/auth.ts` with `getCurrentUser`, `getUserId`, `getUserPlan` — eliminates 10+ duplicated auth helpers across routes
- **Encryption Key Handling**: `ENCRYPTION_KEY` must be exactly 64 hex chars; key-version prefix supports rotation
- **Input Validation**: All Zod schemas use `.strict()`; dedicated schemas for all AI outputs (resume, interview, coach)
- **File Upload Security**: Magic bytes verification for PDF, DOCX, DOC; MIME/magic mismatch rejection; random server-generated storage keys
- **IDOR Protection**: Ownership checks on resume/analyze, interview/submit, applications/PATCH, portfolio
- **Mass Assignment Protection**: Allow-list schemas for profile/settings updates
- **Account Enumeration Prevention**: Generic forgot-password responses, constant-time delays, generic register messages
- **Rate Limiter Resilience**: In-memory fallback when Upstash Redis is unavailable (dev); production still requires Upstash
- **CSP Headers**: Removed HSTS duplication; `connect-src` includes Upstash endpoints
- **Redacted Logging**: `redactedLog()` replaces all `console.error` in API routes — no secrets leaked

### Bug Fixes
- **Dashboard Layout**: Now fetches real user data (name, plan) from `/api/auth/profile`
- **Interview Page**: Stores and uses real `sessionId` from `/api/interview/generate` instead of hardcoded `1`
- **Applications Page**: Favorite button now correctly PATCHes `isFavorite` instead of broken status toggle
- **Settings Page**: Password change now wired to `/api/auth/password` with validation and loading states
- **Checkout Page**: Now calls `/api/checkout` to create real Lemon Squeezy checkout URLs
- **Community API**: GET now JOINs `users` table to return author name
- **Community Page**: Author display works correctly with joined user data

### New Features
- **Dark Mode**: Full light/dark/system theme support with `ThemeProvider`, `localStorage` persistence, and system preference listener
- **Theme Toggle**: Three-state toggle (light/dark/system) in dashboard header
- **Checkout API**: New `/api/checkout` route creates Lemon Squeezy checkout sessions with CSRF protection and rate limiting
- **Profile API**: New `/api/auth/profile` GET/PATCH endpoints for user profile management
- **Password Change API**: New `/api/auth/password` endpoint with current password verification

### Testing
- **Security Tests**: `__tests__/security.test.ts` — hashRefreshToken, validateFileUpload, redactedLog, JWT secrets
- **Validation Tests**: `__tests__/validation.test.ts` — all Zod schemas (login, register, password, profile, application, community, AI outputs)
- **Auth Tests**: `__tests__/auth.test.ts` — getCurrentUser, getUserId, getUserPlan edge cases
- **Test Config**: `vitest.config.ts` with jsdom environment and path aliases

### Infrastructure
- **Database Migration**: Full schema deployed to Neon PostgreSQL — 15 tables, 4 enums, 50+ indexes, all foreign keys
- **Dead Dependencies Removed**: `ioredis`, `rate-limiter-flexible`, `@aws-sdk/client-ses`, `@aws-sdk/client-s3`, `@vercel/blob`, `@vercel/edge-config`, `@vercel/functions`, `html2canvas`, `jspdf`, `react-markdown`, `remark-gfm`, `cmdk`, `@tanstack/react-table`, `react-intersection-observer`, `react-textarea-autosize`, `use-debounce`, `nanoid`, `sharp`, `date-fns`, `@types/bun`
- **Middleware Cleanup**: Removed broken `x-user-*` response headers; strips incoming spoofed headers before processing

## [1.0.0] — Initial Release
- AI Resume Optimizer with ATS scoring
- Interview Simulator with AI feedback
- Job Tracker with Kanban board
- AI Career Coach chat
- Portfolio Builder with themes
- Analytics Dashboard
- Community Forum
- Premium plans via Lemon Squeezy
- Google OAuth authentication
- JWT session management
- Email verification and password reset
