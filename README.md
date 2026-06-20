# ApplySmart 2.0

A production-ready Next.js 15 SaaS platform for remote tech job seekers. AI-powered resume optimization, interview practice, job tracking, and career coaching.

## Features

- **AI Resume Analyzer** — ATS score, keyword matching, strengths/weaknesses
- **Interview Simulator** — Technical, behavioral, and system design questions with AI feedback
- **Job Tracker** — Kanban board to manage applications from saved to offer
- **AI Career Coach** — Personalized guidance and mock interviews
- **Portfolio Builder** — Multiple themes, live preview, one-click publish
- **Analytics Dashboard** — Visual insights on your job search progress
- **Community** — Connect with fellow job seekers and mentors
- **Premium Plans** — Free, Pro, and Accelerator tiers via Lemon Squeezy

## Tech Stack

- **Framework**: Next.js 15.1 + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` config)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: JWT (jose) + bcryptjs + CSRF tokens + Google OAuth
- **Rate Limiting**: Upstash Redis
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Lemon Squeezy
- **Email**: Resend
- **Storage**: Vercel Blob
- **Analytics**: Vercel Analytics + Speed Insights

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- Redis instance (Upstash recommended)
- OpenAI API key
- Resend API key
- Lemon Squeezy account
- Vercel Blob (for resume uploads)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd applysmart

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your values

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

See `.env.local.example` for all required environment variables.

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Push schema (dev only)
npm run db:push
```

## Project Structure

```
applysmart/
├── app/
│   ├── (auth)/          # Auth pages (login, register, forgot-password, reset-password)
│   ├── (dashboard)/      # Dashboard layout + pages
│   ├── (marketing)/     # Landing page, faqs, community, legal
│   ├── api/             # API routes (auth, AI, jobs, applications, etc.)
│   ├── globals.css       # Tailwind v4 CSS-first config
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── landing/          # Marketing components
│   ├── shared/           # Shared components (logo, premium-card, score-ring)
│   └── ui/               # UI components
├── lib/
│   ├── ai/               # OpenAI integration
│   ├── db/               # Drizzle schema + connection
│   ├── security.ts       # Auth, encryption, validation
│   ├── rate-limit.ts     # Upstash rate limiting
│   ├── payments.ts       # Lemon Squeezy integration
│   ├── email.ts          # Resend email wrapper
│   ├── validation.ts     # Zod schemas
│   └── utils.ts          # Utilities, constants, helpers
├── types/                # Shared TypeScript types
├── middleware.ts          # Next.js middleware (auth, CSRF, premium gating)
├── next.config.ts         # Next.js config (CSP, PPR, image optimization)
├── drizzle.config.ts      # Drizzle kit config
└── package.json
```

## Security Features

- **JWT Authentication** with 15-minute access tokens and 30-day refresh tokens
- **CSRF Protection** with double-submit cookie pattern
- **AES-256-GCM Encryption** for sensitive data
- **Rate Limiting** per endpoint and per user plan
- **Prompt Injection Detection** on all AI inputs
- **File Upload Validation** with magic bytes verification
- **Content Security Policy (CSP)** in headers
- **Account Lockout** after failed login attempts
- **Secure Cookies** with httpOnly and sameSite
- **HSTS, X-Frame-Options, COOP, COEP** headers

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/forgot-password` | POST | Send password reset email |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/google` | POST | Google OAuth callback |
| `/api/health` | GET | Health check |
| `/api/jobs` | GET | Search jobs with filters |
| `/api/applications` | GET/POST/PATCH | Application CRUD |
| `/api/resume/analyze` | POST | AI resume analysis |
| `/api/resume/upload` | POST | Upload resume to Vercel Blob |
| `/api/interview/generate` | POST | Generate interview questions |
| `/api/interview/submit` | POST | Submit answers for AI feedback |
| `/api/coach` | GET/POST | AI career coach chat |
| `/api/analytics` | GET | User analytics data |
| `/api/portfolio` | GET/POST | Portfolio builder |
| `/api/community` | GET/POST | Community posts |
| `/api/webhooks/lemonsqueezy` | POST | Payment webhooks |

## License

MIT

## Support

For support, email support@applysmart.io or join our community.
