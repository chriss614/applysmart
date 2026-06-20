export interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: "free" | "pro" | "accelerator";
  role: "user" | "admin" | "moderator";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStat {
  label: string;
  value: number;
  change: number;
  changeLabel: string;
}

export interface JobListing {
  id: number;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  isRemote: boolean;
  experienceLevel: string;
  skills: string[];
  description: string;
  applyUrl: string;
  postedAt: Date;
}

export interface ApplicationItem {
  id: number;
  jobTitle: string;
  company: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected" | "withdrawn";
  dateApplied: Date;
  notes?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeAnalysis {
  atsScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordMatches: { keyword: string; found: boolean }[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: "technical" | "behavioral" | "system_design" | "culture_fit";
  difficulty: "easy" | "medium" | "hard";
}

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  areasToImprove: string[];
  modelAnswer: string;
  communicationScore: number;
  technicalScore: number;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface PortfolioTheme {
  id: string;
  name: string;
  primaryColor: string;
  fontFamily: string;
  layout: "modern" | "classic" | "minimal" | "creative";
}

export interface CommunityPost {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  tags: string[];
  upvotes: number;
  commentCount: number;
  createdAt: Date;
}

export interface CommunityComment {
  id: number;
  content: string;
  author: string;
  authorAvatar?: string;
  upvotes: number;
  createdAt: Date;
}

export interface AnalyticsData {
  weeklyActivity: { day: string; applications: number; interviews: number }[];
  statusDistribution: { name: string; value: number }[];
  interviewScores: { date: string; score: number }[];
  weeklyGoal: { current: number; target: number };
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
  variantId?: string;
}
