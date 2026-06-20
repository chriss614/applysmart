import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "premium", "admin"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "saved",
  "applied",
  "phone_screen",
  "technical",
  "onsite",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
]);
export const interviewDifficultyEnum = pgEnum("interview_difficulty", [
  "junior",
  "mid",
  "senior",
  "staff",
]);
export const planEnum = pgEnum("plan", ["free", "pro", "accelerator"]);

//============================================
// Users — Core identity with security fields
//============================================
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }),
    name: varchar("name", { length: 100 }),
    avatarUrl: text("avatar_url"),
    googleId: varchar("google_id", { length: 255 }).unique(),
    role: userRoleEnum("role").default("user").notNull(),
    plan: planEnum("plan").default("free").notNull(),
    licenseKey: uuid("license_key").defaultRandom(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lockedUntil: timestamp("locked_until"),
    lastLoginAt: timestamp("last_login_at"),
    lastLoginIp: varchar("last_login_ip", { length: 45 }),
    onboardingCompleted: boolean("onboarding_completed").default(false),
    targetRole: varchar("target_role", { length: 100 }),
    yearsExperience: integer("years_experience"),
    preferredLocation: varchar("preferred_location", { length: 100 }),
    salaryExpectation: varchar("salary_expectation", { length: 50 }),
    skills: jsonb("skills").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("email_idx").on(table.email),
    index("google_id_idx").on(table.googleId),
    index("license_key_idx").on(table.licenseKey),
    index("role_idx").on(table.role),
    index("created_at_idx").on(table.createdAt),
  ]
);

//============================================
// Sessions — JWT refresh token tracking
//============================================
export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    revoked: boolean("revoked").default(false),
  },
  (table) => [
    index("token_hash_idx").on(table.tokenHash),
    index("user_sessions_idx").on(table.userId, table.expiresAt),
    index("revoked_idx").on(table.revoked),
  ]
);

//============================================
// Resumes — User uploads with AI analysis cache
//============================================
export const resumes = pgTable(
  "resumes",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 50 }).notNull(),
    fileHash: varchar("file_hash", { length: 64 }).notNull(),
    parsedContent: text("parsed_content"),
    atsScore: integer("ats_score"),
    matchScore: integer("match_score"),
    readabilityScore: integer("readability_score"),
    keywordDensity: jsonb("keyword_density").$type<Record<string, number>>(),
    aiFeedback: jsonb("ai_feedback"),
    optimizedVersion: text("optimized_version"),
    analysisVersion: varchar("analysis_version", { length: 10 }).default("v2"),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_resumes_idx").on(table.userId, table.createdAt),
    index("file_hash_idx").on(table.fileHash),
    index("primary_resume_idx").on(table.userId, table.isPrimary),
  ]
);

//============================================
// Cached AI Results — Avoid expensive re-runs
//============================================
export const cachedAnalyses = pgTable(
  "cached_analyses",
  {
    id: serial("id").primaryKey(),
    resumeId: integer("resume_id")
      .references(() => resumes.id, { onDelete: "cascade" })
      .notNull(),
    analysisType: varchar("analysis_type", { length: 50 }).notNull(),
    result: jsonb("result").notNull(),
    promptHash: varchar("prompt_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cache_lookup_idx").on(
      table.resumeId,
      table.analysisType,
      table.promptHash
    ),
    index("cache_expiry_idx").on(table.expiresAt),
  ]
);

//============================================
// Jobs — Scraped/aggregated remote tech jobs
//============================================
export const jobs = pgTable(
  "jobs",
  {
    id: serial("id").primaryKey(),
    externalId: varchar("external_id", { length: 255 }).unique(),
    title: varchar("title", { length: 255 }).notNull(),
    company: varchar("company", { length: 100 }).notNull(),
    companyLogo: text("company_logo"),
    location: varchar("location", { length: 100 }).default("Remote"),
    salaryRange: varchar("salary_range", { length: 100 }),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    description: text("description").notNull(),
    requirements: jsonb("requirements").$type<string[]>(),
    skills: jsonb("skills").$type<string[]>(),
    experienceLevel: varchar("experience_level", { length: 20 }),
    employmentType: varchar("employment_type", { length: 20 }),
    sourceUrl: text("source_url"),
    sourcePlatform: varchar("source_platform", { length: 50 }),
    postedAt: timestamp("posted_at"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").default(true).notNull(),
    isRemote: boolean("is_remote").default(true),
    viewCount: integer("view_count").default(0),
    applyCount: integer("apply_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("jobs_active_idx").on(table.isActive, table.postedAt),
    index("jobs_skills_idx").on(table.skills),
    index("jobs_company_idx").on(table.company),
    index("jobs_remote_idx").on(table.isRemote, table.isActive),
    index("jobs_salary_idx").on(table.salaryMin, table.salaryMax),
    index("jobs_search_idx").on(table.title, table.description),
  ]
);

//============================================
// User Job Matches — Personalized AI scoring
//============================================
export const userJobMatches = pgTable(
  "user_job_matches",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    jobId: integer("job_id")
      .references(() => jobs.id, { onDelete: "cascade" })
      .notNull(),
    matchScore: integer("match_score").notNull(),
    skillGap: jsonb("skill_gap").$type<string[]>(),
    status: applicationStatusEnum("status").default("saved").notNull(),
    notes: text("notes"),
    appliedAt: timestamp("applied_at"),
    lastContactAt: timestamp("last_contact_at"),
    nextFollowUpAt: timestamp("next_follow_up_at"),
    recruiterName: varchar("recruiter_name", { length: 100 }),
    recruiterEmail: varchar("recruiter_email", { length: 255 }),
    offerDetails: jsonb("offer_details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_job_unique_idx").on(table.userId, table.jobId),
    index("match_score_idx").on(table.matchScore),
    index("user_status_idx").on(table.userId, table.status),
    index("follow_up_idx").on(table.nextFollowUpAt),
  ]
);

//============================================
// Interview Sessions — Practice history
//============================================
export const interviewSessions = pgTable(
  "interview_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    jobRole: varchar("job_role", { length: 100 }).notNull(),
    difficulty: interviewDifficultyEnum("difficulty").notNull(),
    questions: jsonb("questions").notNull(),
    responses: jsonb("responses"),
    aiFeedback: jsonb("ai_feedback"),
    overallScore: integer("overall_score"),
    timeSpentSeconds: integer("time_spent_seconds"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_interviews_idx").on(table.userId, table.createdAt),
    index("completed_idx").on(table.completedAt),
  ]
);

//============================================
// Portfolios — Generated portfolio data
//============================================
export const portfolios = pgTable(
  "portfolios",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    theme: varchar("theme", { length: 50 }).default("modern").notNull(),
    content: jsonb("content").notNull(),
    htmlExport: text("html_export"),
    isPublished: boolean("is_published").default(false),
    publicSlug: varchar("public_slug", { length: 100 }).unique(),
    customDomain: varchar("custom_domain", { length: 255 }),
    viewCount: integer("view_count").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_portfolios_idx").on(table.userId),
    index("public_slug_idx").on(table.publicSlug),
  ]
);

//============================================
// Applications — Job Application Tracker (NEW - Retention Core)
//============================================
export const applications = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
    company: varchar("company", { length: 100 }).notNull(),
    role: varchar("role", { length: 100 }).notNull(),
    location: varchar("location", { length: 100 }),
    salaryRange: varchar("salary_range", { length: 100 }),
    jobUrl: text("job_url"),
    status: applicationStatusEnum("status").default("applied").notNull(),
    dateApplied: timestamp("date_applied").defaultNow(),
    dateResponse: timestamp("date_response"),
    dateInterview: timestamp("date_interview"),
    dateOffer: timestamp("date_offer"),
    notes: text("notes"),
    recruiterName: varchar("recruiter_name", { length: 100 }),
    recruiterEmail: varchar("recruiter_email", { length: 255 }),
    resumeUsed: integer("resume_used").references(() => resumes.id),
    coverLetter: text("cover_letter"),
    followUpCount: integer("follow_up_count").default(0),
    lastFollowUpAt: timestamp("last_follow_up_at"),
    nextFollowUpAt: timestamp("next_follow_up_at"),
    isFavorite: boolean("is_favorite").default(false),
    tags: jsonb("tags").$type<string[]>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_applications_idx").on(table.userId, table.createdAt),
    index("status_idx").on(table.status),
    index("company_idx").on(table.company),
    index("follow_up_idx").on(table.nextFollowUpAt),
    index("favorite_idx").on(table.userId, table.isFavorite),
  ]
);

//============================================
// Analytics — User career metrics (NEW)
//============================================
export const analytics = pgTable(
  "analytics",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    date: timestamp("date").defaultNow().notNull(),
    resumesOptimized: integer("resumes_optimized").default(0),
    interviewsCompleted: integer("interviews_completed").default(0),
    applicationsSent: integer("applications_sent").default(0),
    responsesReceived: integer("responses_received").default(0),
    interviewsScheduled: integer("interviews_scheduled").default(0),
    offersReceived: integer("offers_received").default(0),
    atsScoreAvg: integer("ats_score_avg"),
    interviewScoreAvg: integer("interview_score_avg"),
    timeToResponse: integer("time_to_response"),
    streakDays: integer("streak_days").default(0),
    weeklyGoal: integer("weekly_goal").default(10),
    weeklyProgress: integer("weekly_progress").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_date_idx").on(table.userId, table.date),
    index("streak_idx").on(table.streakDays),
  ]
);

//============================================
// Coach Messages — AI Career Coach (NEW)
//============================================
export const coachMessages = pgTable(
  "coach_messages",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: varchar("role", { length: 20 }).notNull(), // user, assistant, system
    content: text("content").notNull(),
    context: jsonb("context"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_coach_idx").on(table.userId, table.createdAt),
  ]
);

//============================================
// Community — Peer interactions (NEW)
//============================================
export const communityPosts = pgTable(
  "community_posts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    tags: jsonb("tags").$type<string[]>(),
    upvotes: integer("upvotes").default(0),
    viewCount: integer("view_count").default(0),
    isPinned: boolean("is_pinned").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("category_idx").on(table.category),
    index("pinned_idx").on(table.isPinned, table.createdAt),
    index("user_posts_idx").on(table.userId),
  ]
);

export const communityComments = pgTable(
  "community_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .references(() => communityPosts.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    upvotes: integer("upvotes").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("post_comments_idx").on(table.postId, table.createdAt),
  ]
);

//============================================
// Payments — Lemon Squeezy transactions
//============================================
export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    lemonSqueezyId: varchar("lemon_squeezy_id", { length: 255 }).notNull().unique(),
    orderId: varchar("order_id", { length: 255 }),
    status: varchar("status", { length: 20 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    plan: planEnum("plan").default("pro").notNull(),
    refundedAt: timestamp("refunded_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_payments_idx").on(table.userId, table.createdAt),
    index("status_idx").on(table.status),
  ]
);

//============================================
// Events — Privacy-first analytics
//============================================
export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: varchar("session_id", { length: 255 }),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    metadata: jsonb("metadata"),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgentHash: varchar("ua_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("events_type_idx").on(table.eventType, table.createdAt),
    index("events_user_idx").on(table.userId, table.createdAt),
  ]
);

//============================================
// Relations
//============================================
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  sessions: many(sessions),
  jobMatches: many(userJobMatches),
  interviews: many(interviewSessions),
  portfolios: many(portfolios),
  payments: many(payments),
  applications: many(applications),
  analytics: many(analytics),
  coachMessages: many(coachMessages),
  communityPosts: many(communityPosts),
}));

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
  cachedAnalyses: many(cachedAnalyses),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  job: one(jobs, { fields: [applications.jobId], references: [jobs.id] }),
  resume: one(resumes, { fields: [applications.resumeUsed], references: [resumes.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, { fields: [communityPosts.userId], references: [users.id] }),
  comments: many(communityComments),
}));
