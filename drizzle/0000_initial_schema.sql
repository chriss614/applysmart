CREATE TYPE "user_role" AS ENUM ('user', 'premium', 'admin');
CREATE TYPE "application_status" AS ENUM ('saved', 'applied', 'phone_screen', 'technical', 'onsite', 'offer', 'rejected', 'withdrawn', 'ghosted');
CREATE TYPE "interview_difficulty" AS ENUM ('junior', 'mid', 'senior', 'staff');
CREATE TYPE "plan" AS ENUM ('free', 'pro', 'accelerator');

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(100),
	"avatar_url" text,
	"google_id" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"license_key" uuid DEFAULT gen_random_uuid(),
	"email_verified" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"password_reset_token" varchar(255),
	"password_reset_expires" timestamp,
	"last_login_at" timestamp,
	"last_login_ip" varchar(45),
	"onboarding_completed" boolean DEFAULT false,
	"target_role" varchar(100),
	"years_experience" integer,
	"preferred_location" varchar(100),
	"salary_expectation" varchar(50),
	"skills" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"ip_address" varchar(45),
	"revoked" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "resumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" varchar(50) NOT NULL,
	"file_hash" varchar(64) NOT NULL,
	"parsed_content" text,
	"ats_score" integer,
	"match_score" integer,
	"readability_score" integer,
	"keyword_density" jsonb,
	"ai_feedback" jsonb,
	"optimized_version" text,
	"analysis_version" varchar(10) DEFAULT 'v2',
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cached_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"resume_id" integer NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"result" jsonb NOT NULL,
	"prompt_hash" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" varchar(255),
	"title" varchar(255) NOT NULL,
	"company" varchar(100) NOT NULL,
	"company_logo" text,
	"location" varchar(100) DEFAULT 'Remote',
	"salary_range" varchar(100),
	"salary_min" integer,
	"salary_max" integer,
	"currency" varchar(3) DEFAULT 'USD',
	"description" text NOT NULL,
	"requirements" jsonb,
	"skills" jsonb,
	"experience_level" varchar(20),
	"employment_type" varchar(20),
	"source_url" text,
	"source_platform" varchar(50),
	"posted_at" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_remote" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"apply_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_job_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer NOT NULL,
	"match_score" integer NOT NULL,
	"skill_gap" jsonb,
	"status" "application_status" DEFAULT 'saved' NOT NULL,
	"notes" text,
	"applied_at" timestamp,
	"last_contact_at" timestamp,
	"next_follow_up_at" timestamp,
	"recruiter_name" varchar(100),
	"recruiter_email" varchar(255),
	"offer_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "interview_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_role" varchar(100) NOT NULL,
	"difficulty" "interview_difficulty" NOT NULL,
	"questions" jsonb NOT NULL,
	"responses" jsonb,
	"ai_feedback" jsonb,
	"overall_score" integer,
	"time_spent_seconds" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "portfolios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"theme" varchar(50) DEFAULT 'modern' NOT NULL,
	"content" jsonb NOT NULL,
	"html_export" text,
	"is_published" boolean DEFAULT false,
	"public_slug" varchar(100),
	"custom_domain" varchar(255),
	"view_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" integer,
	"company" varchar(100) NOT NULL,
	"role" varchar(100) NOT NULL,
	"location" varchar(100),
	"salary_range" varchar(100),
	"job_url" text,
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"date_applied" timestamp DEFAULT now(),
	"date_response" timestamp,
	"date_interview" timestamp,
	"date_offer" timestamp,
	"notes" text,
	"recruiter_name" varchar(100),
	"recruiter_email" varchar(255),
	"resume_used" integer,
	"cover_letter" text,
	"follow_up_count" integer DEFAULT 0,
	"last_follow_up_at" timestamp,
	"next_follow_up_at" timestamp,
	"is_favorite" boolean DEFAULT false,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"resumes_optimized" integer DEFAULT 0,
	"interviews_completed" integer DEFAULT 0,
	"applications_sent" integer DEFAULT 0,
	"responses_received" integer DEFAULT 0,
	"interviews_scheduled" integer DEFAULT 0,
	"offers_received" integer DEFAULT 0,
	"ats_score_avg" integer,
	"interview_score_avg" integer,
	"time_to_response" integer,
	"streak_days" integer DEFAULT 0,
	"weekly_goal" integer DEFAULT 10,
	"weekly_progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coach_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"tags" jsonb,
	"upvotes" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "community_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"upvotes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lemon_squeezy_id" varchar(255) NOT NULL,
	"order_id" varchar(255),
	"status" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"plan" "plan" DEFAULT 'pro' NOT NULL,
	"refunded_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"session_id" varchar(255),
	"event_type" varchar(50) NOT NULL,
	"metadata" jsonb,
	"ip_hash" varchar(64),
	"ua_hash" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Constraints
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash");
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "cached_analyses" ADD CONSTRAINT "cached_analyses_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE;
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_external_id_unique" UNIQUE("external_id");
ALTER TABLE "user_job_matches" ADD CONSTRAINT "user_job_matches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_job_matches" ADD CONSTRAINT "user_job_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE;
ALTER TABLE "user_job_matches" ADD CONSTRAINT "user_job_matches_user_id_job_id_unique" UNIQUE("user_id", "job_id");
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_public_slug_unique" UNIQUE("public_slug");
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL;
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_used_resumes_id_fk" FOREIGN KEY ("resume_used") REFERENCES "resumes"("id");
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_date_unique" UNIQUE("user_id", "date");
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "community_posts"("id") ON DELETE CASCADE;
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_lemon_squeezy_id_unique" UNIQUE("lemon_squeezy_id");
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "email_idx" ON "users" USING btree ("email");
CREATE INDEX IF NOT EXISTS "google_id_idx" ON "users" USING btree ("google_id");
CREATE INDEX IF NOT EXISTS "license_key_idx" ON "users" USING btree ("license_key");
CREATE INDEX IF NOT EXISTS "role_idx" ON "users" USING btree ("role");
CREATE INDEX IF NOT EXISTS "created_at_idx" ON "users" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "token_hash_idx" ON "sessions" USING btree ("token_hash");
CREATE INDEX IF NOT EXISTS "user_sessions_idx" ON "sessions" USING btree ("user_id", "expires_at");
CREATE INDEX IF NOT EXISTS "revoked_idx" ON "sessions" USING btree ("revoked");
CREATE INDEX IF NOT EXISTS "user_resumes_idx" ON "resumes" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "file_hash_idx" ON "resumes" USING btree ("file_hash");
CREATE INDEX IF NOT EXISTS "primary_resume_idx" ON "resumes" USING btree ("user_id", "is_primary");
CREATE INDEX IF NOT EXISTS "cache_lookup_idx" ON "cached_analyses" USING btree ("resume_id", "analysis_type", "prompt_hash");
CREATE INDEX IF NOT EXISTS "cache_expiry_idx" ON "cached_analyses" USING btree ("expires_at");
CREATE INDEX IF NOT EXISTS "jobs_active_idx" ON "jobs" USING btree ("is_active", "posted_at");
CREATE INDEX IF NOT EXISTS "jobs_skills_idx" ON "jobs" USING btree ("skills");
CREATE INDEX IF NOT EXISTS "jobs_company_idx" ON "jobs" USING btree ("company");
CREATE INDEX IF NOT EXISTS "jobs_remote_idx" ON "jobs" USING btree ("is_remote", "is_active");
CREATE INDEX IF NOT EXISTS "jobs_salary_idx" ON "jobs" USING btree ("salary_min", "salary_max");
CREATE INDEX IF NOT EXISTS "jobs_search_idx" ON "jobs" USING btree ("title", "description");
CREATE INDEX IF NOT EXISTS "match_score_idx" ON "user_job_matches" USING btree ("match_score");
CREATE INDEX IF NOT EXISTS "user_status_idx" ON "user_job_matches" USING btree ("user_id", "status");
CREATE INDEX IF NOT EXISTS "user_job_matches_follow_up_idx" ON "user_job_matches" USING btree ("next_follow_up_at");
CREATE INDEX IF NOT EXISTS "user_interviews_idx" ON "interview_sessions" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "completed_idx" ON "interview_sessions" USING btree ("completed_at");
CREATE INDEX IF NOT EXISTS "user_portfolios_idx" ON "portfolios" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "public_slug_idx" ON "portfolios" USING btree ("public_slug");
CREATE INDEX IF NOT EXISTS "user_applications_idx" ON "applications" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications" USING btree ("status");
CREATE INDEX IF NOT EXISTS "applications_company_idx" ON "applications" USING btree ("company");
CREATE INDEX IF NOT EXISTS "applications_follow_up_idx" ON "applications" USING btree ("next_follow_up_at");
CREATE INDEX IF NOT EXISTS "applications_favorite_idx" ON "applications" USING btree ("user_id", "is_favorite");
CREATE INDEX IF NOT EXISTS "streak_idx" ON "analytics" USING btree ("streak_days");
CREATE INDEX IF NOT EXISTS "user_coach_idx" ON "coach_messages" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "category_idx" ON "community_posts" USING btree ("category");
CREATE INDEX IF NOT EXISTS "pinned_idx" ON "community_posts" USING btree ("is_pinned", "created_at");
CREATE INDEX IF NOT EXISTS "user_posts_idx" ON "community_posts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "post_comments_idx" ON "community_comments" USING btree ("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "user_payments_idx" ON "payments" USING btree ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" USING btree ("status");
CREATE INDEX IF NOT EXISTS "events_type_idx" ON "events" USING btree ("event_type", "created_at");
CREATE INDEX IF NOT EXISTS "events_user_idx" ON "events" USING btree ("user_id", "created_at");
