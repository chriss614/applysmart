# ApplySmart 2.0

A production-ready Next.js 15 SaaS platform for remote tech job seekers. AI-powered resume optimization, interview practice, job tracking, career coaching, and portfolio building — all in one place.

## Features

- **AI Resume Analyzer** — ATS score, keyword matching, strengths/weaknesses, readability score
- **Interview Simulator** — Technical, behavioral, and system design questions with AI feedback
- **Job Tracker** — Kanban board to manage applications from saved to offer
- **AI Career Coach** — Personalized guidance and mock interviews
- **Portfolio Builder** — Multiple themes, live preview, one-click publish
- **Analytics Dashboard** — Visual insights on your job search progress
- **Community** — Connect with fellow job seekers and mentors
- **Premium Plans** — Free, Pro, and Accelerator tiers via Lemon Squeezy
- **Dark Mode** — Full light/dark/system theme support with persistent preference

## Tech Stack

- **Framework**: Next.js 15.1 + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` config)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: JWT (jose) + bcryptjs + CSRF tokens + Google OAuth
- **Rate Limiting**: Upstash Redis (with in-memory fallback for dev)
- **AI**: OpenAI GPT-4o-mini with Zod-validated outputs
- **Payments**: Lemon Squeezy with HMAC webhook verification
- **Email**: Resend
- **Analytics**: Vercel Analytics + Speed Insights
- **Testing**: Vitest + jsdom + @testing-library/react

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended) or use dev fallback
- OpenAI API key
- Resend API key
- Lemon Squeezy account

### Installation

```bash
# Clone the repository
git clone https://github.com/chriss614/applysmart.git
cd applysmart

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for all required environment variables.

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Push schema (dev only)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## Project Structure

```
applysmart/
├── app/
│   ├── (auth)/              # Auth pages (login, register, forgot-password, reset-password)
│   ├── (dashboard)/          # Dashboard layout + pages
│   ├── (marketing)/          # Landing page, FAQs, community, legal
│   ├── api/                  # API routes (auth, AI, jobs, applications, etc.)
│   ├── globals.css           # Tailwind v4 CSS-first config with dark mode
│   ├── layout.tsx            # Root layout with ThemeProvider
│   └── page.tsx              # Landing page
├── components/
│   ├── landing/              # Marketing components
│   ├── shared/               # Shared components (logo, premium-card, score-ring)
│   └── ui/                   # UI components (theme-toggle)
├── lib/
│   ├── ai/                   # OpenAI integration with Zod validation
│   ├── db/                   # Drizzle schema + connection
│   ├── auth.ts               # Centralized auth helpers (getCurrentUser, getUserId, getUserPlan)
│   ├── security.ts           # Hashing, encryption, file validation, CSRF, redacted logging
│   ├── theme.tsx             # ThemeProvider (light/dark/system)
│   ├── rate-limit.ts         # Upstash rate limiting + in-memory fallback
│   ├── payments.ts           # Lemon Squeezy integration
│   ├── email.ts              # Resend email wrapper
│   ├── validation.ts         # Zod schemas with .strict() for all inputs
│   └── utils.ts              # Utilities, constants, helpers
├── __tests__/                # Unit tests (security, validation, auth)
├── types/                    # Shared TypeScript types
├── middleware.ts             # Next.js middleware (auth, CSRF, premium gating)
├── next.config.ts            # Next.js config (CSP, PPR, image optimization)
├── drizzle.config.ts         # Drizzle kit config
├── vitest.config.ts          # Vitest test config
└── package.json
```

## Security Features

- **JWT Authentication** with 15-minute access tokens and 30-day refresh tokens (SHA-256 hashed before DB storage)
- **CSRF Protection** with double-submit cookie pattern on all state-changing routes
- **AES-256-GCM Encryption** for sensitive data with key-versioned rotation support
- **Rate Limiting** per endpoint and per user plan (Upstash Redis + in-memory dev fallback)
- **Zod `.strict()` Validation** on all API inputs with dedicated AI output schemas
- **Prompt Injection Detection** on all AI inputs with logging and sanitization
- **File Upload Validation** with magic bytes verification (PDF, DOCX, DOC)
- **Content Security Policy (CSP)** in headers
- **Account Lockout** after 5 failed login attempts with exponential backoff
- **Secure Cookies** with `httpOnly`, `sameSite: "lax"`, and `Secure` in production
- **HSTS, X-Frame-Options, COOP, COEP** headers
- **Redacted Logging** — no secrets, tokens, or passwords in logs
- **IDOR Protection** — ownership checks on all user-scoped resources
- **Mass Assignment Protection** — allow-list schemas for profile/settings updates
- **Account Enumeration Prevention** — generic responses for forgot-password/register
- **Webhook HMAC Verification** — timing-safe signature validation for Lemon Squeezy

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | Logout + revoke session |
| `/api/auth/refresh` | POST | Refresh access token (hashed refresh token) |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/google` | POST | Google OAuth callback |
| `/api/auth/profile` | GET/PATCH | Get/update user profile |
| `/api/auth/password` | POST | Change password (current + new) |
| `/api/health` | GET | Health check |
| `/api/jobs` | GET | Search jobs with filters |
| `/api/applications` | GET/POST/PATCH | Application CRUD |
| `/api/resume/analyze` | POST | AI resume analysis with Zod validation |
| `/api/resume/upload` | POST | Upload resume with magic bytes check |
| `/api/interview/generate` | POST | Generate interview questions |
| `/api/interview/submit` | POST | Submit answers for AI feedback |
| `/api/coach` | GET/POST | AI career coach chat |
| `/api/analytics` | GET | User analytics data |
| `/api/portfolio` | GET/POST | Portfolio builder |
| `/api/community` | GET/POST | Community posts with author JOIN |
| `/api/checkout` | POST | Create Lemon Squeezy checkout URL |
| `/api/webhooks/lemonsqueezy` | POST | Payment webhooks with HMAC verification |

## Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm run test:ui
```

Tests cover:
- `lib/security.ts` — hashRefreshToken, validateFileUpload, redactedLog, JWT secrets
- `lib/validation.ts` — all Zod schemas (auth, application, community, AI outputs)
- `lib/auth.ts` — getCurrentUser, getUserId, getUserPlan edge cases

## License

MIT

## Support

For support, email support@applysmart.io or join our community.
