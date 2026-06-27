import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  passwordResetSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  applicationSchema,
  applicationUpdateSchema,
  communityPostSchema,
  resumeAnalysisResultSchema,
  interviewQuestionsResultSchema,
  interviewFeedbackResultSchema,
} from "../lib/validation";

describe("validation.ts", () => {
  describe("loginSchema", () => {
    it("should accept valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "SecurePass123!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject mismatched passwords", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123!",
        confirmPassword: "DifferentPass123!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject weak password (missing uppercase)", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123!",
        confirmPassword: "securepass123!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject weak password (missing special char)", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("passwordChangeSchema", () => {
    it("should accept valid password change", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "oldpass123",
        newPassword: "NewSecure123!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject weak new password", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "oldpass123",
        newPassword: "weak",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("profileUpdateSchema", () => {
    it("should accept valid profile update", () => {
      const result = profileUpdateSchema.safeParse({
        name: "John Doe",
        targetRole: "Senior Engineer",
        yearsExperience: 5,
        skills: ["React", "TypeScript"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject unknown fields (strict)", () => {
      const result = profileUpdateSchema.safeParse({
        name: "John Doe",
        passwordHash: "should-not-be-allowed",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("applicationSchema", () => {
    it("should accept valid application", () => {
      const result = applicationSchema.safeParse({
        company: "Google",
        role: "Senior Engineer",
        location: "Remote",
        status: "applied",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = applicationSchema.safeParse({
        company: "Google",
        role: "Senior Engineer",
        status: "invalid_status",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("applicationUpdateSchema", () => {
    it("should allow isFavorite toggle", () => {
      const result = applicationUpdateSchema.safeParse({
        isFavorite: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("communityPostSchema", () => {
    it("should accept valid post", () => {
      const result = communityPostSchema.safeParse({
        title: "How to optimize my resume?",
        content: "I have been applying for months and need help with my resume formatting and keywords.",
        category: "resume-review",
        tags: ["help", "resume"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject short content", () => {
      const result = communityPostSchema.safeParse({
        title: "Help",
        content: "Too short",
        category: "general",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resumeAnalysisResultSchema", () => {
    it("should accept valid AI analysis", () => {
      const result = resumeAnalysisResultSchema.safeParse({
        atsScore: 85,
        readabilityScore: 78,
        keywordDensity: { react: 0.05, node: 0.03 },
        strengths: ["Good structure", "Clear summary"],
        weaknesses: ["Missing keywords", "Too long"],
        suggestions: ["Add more metrics", "Shorten to 1 page"],
        optimizedSummary: "Experienced developer...",
        missingKeywords: ["Kubernetes", "Docker"],
      });
      expect(result.success).toBe(true);
    });

    it("should reject scores out of range", () => {
      const result = resumeAnalysisResultSchema.safeParse({
        atsScore: 150,
        readabilityScore: 78,
        keywordDensity: {},
        strengths: [],
        weaknesses: [],
        suggestions: [],
        optimizedSummary: "",
        missingKeywords: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("interviewQuestionsResultSchema", () => {
    it("should accept valid questions", () => {
      const result = interviewQuestionsResultSchema.safeParse({
        questions: [
          {
            id: 1,
            question: "Explain React hooks",
            type: "technical",
            difficulty: "mid",
            expectedPoints: ["useState", "useEffect"],
            timeEstimate: "5 min",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid question type", () => {
      const result = interviewQuestionsResultSchema.safeParse({
        questions: [
          {
            id: 1,
            question: "Explain",
            type: "invalid",
            difficulty: "mid",
            expectedPoints: [],
            timeEstimate: "5 min",
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("interviewFeedbackResultSchema", () => {
    it("should accept valid feedback", () => {
      const result = interviewFeedbackResultSchema.safeParse({
        score: 85,
        strengths: ["Clear communication"],
        areasToImprove: ["More technical depth"],
        modelAnswer: "The best approach is...",
        followUpQuestions: ["Can you explain further?"],
      });
      expect(result.success).toBe(true);
    });
  });
});
