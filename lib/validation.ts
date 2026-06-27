import { z } from "zod";

//============================================
// Auth Validation
//============================================
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  csrfToken: z.string().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least one special character"),
}).strict();

//============================================
// Resume Upload Validation
//============================================
export const resumeUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().max(10 * 1024 * 1024, "File must be under 10MB"),
  mimeType: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]),
});

//============================================
// AI Output Validation (Zod schemas for AI responses)
//============================================
export const resumeAnalysisResultSchema = z.object({
  atsScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  keywordDensity: z.record(z.number()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
  optimizedSummary: z.string(),
  missingKeywords: z.array(z.string()),
});

export const interviewQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  type: z.enum(["technical", "behavioral", "system_design", "coding"]),
  difficulty: z.enum(["junior", "mid", "senior", "staff"]),
  expectedPoints: z.array(z.string()),
  timeEstimate: z.string(),
});

export const interviewQuestionsResultSchema = z.object({
  questions: z.array(interviewQuestionSchema),
});

export const interviewFeedbackResultSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  areasToImprove: z.array(z.string()),
  modelAnswer: z.string(),
  followUpQuestions: z.array(z.string()),
});

export const coachResponseSchema = z.object({
  response: z.string(),
});

//============================================
// Interview Configuration
//============================================
export const interviewConfigSchema = z.object({
  jobRole: z.string().min(2).max(100),
  difficulty: z.enum(["junior", "mid", "senior", "staff"]),
  questionCount: z.number().min(1).max(10).default(5),
  focusAreas: z.array(z.string()).max(5).optional(),
}).strict();

export const interviewResponseSchema = z.object({
  sessionId: z.number(),
  questionId: z.number(),
  response: z.string().min(1).max(10000),
}).strict();

//============================================
// Job Filter Validation
//============================================
export const jobFilterSchema = z.object({
  query: z.string().max(100).optional(),
  skills: z.array(z.string().max(50)).max(10).optional(),
  location: z.string().max(100).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  remote: z.boolean().optional(),
  experienceLevel: z.enum(["junior", "mid", "senior", "staff"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
}).strict();

//============================================
// Application Tracker Validation
//============================================
export const applicationSchema = z.object({
  company: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
  salaryRange: z.string().max(100).optional(),
  jobUrl: z.string().url().optional(),
  status: z.enum([
    "saved", "applied", "phone_screen", "technical",
    "onsite", "offer", "rejected", "withdrawn", "ghosted"
  ]).default("applied"),
  dateApplied: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
  recruiterName: z.string().max(100).optional(),
  recruiterEmail: z.string().email().optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
}).strict();

export const applicationUpdateSchema = z.object({
  status: z.enum([
    "saved", "applied", "phone_screen", "technical",
    "onsite", "offer", "rejected", "withdrawn", "ghosted"
  ]).optional(),
  notes: z.string().max(5000).optional(),
  dateResponse: z.string().datetime().optional(),
  dateInterview: z.string().datetime().optional(),
  dateOffer: z.string().datetime().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
}).strict();

//============================================
// Portfolio Validation
//============================================
export const portfolioSchema = z.object({
  theme: z.enum(["modern", "minimal", "creative", "professional"]).default("modern"),
  content: z.object({
    name: z.string().min(1).max(100),
    title: z.string().min(1).max(100),
    bio: z.string().max(2000),
    skills: z.array(z.string().max(50)).max(20),
    projects: z.array(z.object({
      name: z.string().max(100),
      description: z.string().max(500),
      url: z.string().url().optional(),
      technologies: z.array(z.string().max(30)).max(10),
    })).max(10),
    experience: z.array(z.object({
      company: z.string().max(100),
      role: z.string().max(100),
      duration: z.string().max(50),
      description: z.string().max(1000),
    })).max(10),
    education: z.array(z.object({
      institution: z.string().max(100),
      degree: z.string().max(100),
      year: z.string().max(20),
    })).max(5),
    contact: z.object({
      email: z.string().email(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      website: z.string().url().optional(),
    }),
  }).strict(),
}).strict();

//============================================
// Coach Message Validation
//============================================
export const coachMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.object({
    currentRole: z.string().optional(),
    targetRole: z.string().optional(),
    recentActivity: z.string().optional(),
  }).optional(),
}).strict();

//============================================
// Community Post Validation
//============================================
export const communityPostSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(20).max(10000),
  category: z.enum([
    "resume-review", "interview-prep", "job-search",
    "career-advice", "salary-negotiation", "networking", "general"
  ]),
  tags: z.array(z.string().max(20)).max(5).optional(),
}).strict();

export const communityCommentSchema = z.object({
  postId: z.number(),
  content: z.string().min(1).max(2000),
}).strict();

//============================================
// User Profile Update (allow-list only, no mass-assignment)
//============================================
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  targetRole: z.string().max(100).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  preferredLocation: z.string().max(100).optional(),
  salaryExpectation: z.string().max(50).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
}).strict();

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/\d/, "Must contain at least one number")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Must contain at least one special character"),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type InterviewConfig = z.infer<typeof interviewConfigSchema>;
export type JobFilters = z.infer<typeof jobFilterSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type CoachMessageInput = z.infer<typeof coachMessageSchema>;
export type CommunityPostInput = z.infer<typeof communityPostSchema>;
export type ResumeAnalysisResult = z.infer<typeof resumeAnalysisResultSchema>;
export type InterviewFeedbackResult = z.infer<typeof interviewFeedbackResultSchema>;
