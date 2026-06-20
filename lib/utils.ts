import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//============================================
// Navigation Links
//============================================
export const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "/faqs", label: "FAQs" },
  { href: "/community", label: "Community" },
];

//============================================
// Dashboard Navigation
//============================================
export const DASHBOARD_NAV = [
  { href: "/dashboard/overview", icon: "LayoutDashboard", label: "Overview" },
  { href: "/dashboard/applications", icon: "Briefcase", label: "Applications", badge: "New" },
  { href: "/dashboard/jobs", icon: "Search", label: "Job Search" },
  { href: "/dashboard/resume", icon: "FileText", label: "Resume" },
  { href: "/dashboard/interview", icon: "MessageSquare", label: "Interview" },
  { href: "/dashboard/portfolio", icon: "Globe", label: "Portfolio" },
  { href: "/dashboard/analytics", icon: "BarChart3", label: "Analytics" },
  { href: "/dashboard/coach", icon: "Sparkles", label: "AI Coach" },
  { href: "/dashboard/community", icon: "Users", label: "Community" },
  { href: "/dashboard/settings", icon: "Settings", label: "Settings" },
];

//============================================
// Pricing Plans
//============================================
export const PRICING_PLANS = [
  {
    name: "Free",
    description: "Get started with AI career tools",
    price: "$0",
    period: "forever",
    features: [
      "3 resume optimizations/month",
      "Basic ATS scoring",
      "Job matching (5/day)",
      "3 interview practices/month",
      "Basic portfolio template",
      "Community access",
    ],
    cta: "Start Free",
    href: "/register",
    popular: false,
  },
  {
    name: "Pro",
    description: "Unlock unlimited AI tools",
    price: "$19",
    period: "/month",
    features: [
      "Unlimited resume optimizations",
      "Advanced ATS + readability scoring",
      "Unlimited job matching",
      "Unlimited interview practice",
      "All portfolio themes + custom domain",
      "Application tracker with AI insights",
      "Priority AI processing",
      "Export to PDF/HTML",
    ],
    cta: "Get Pro",
    href: "/dashboard/checkout",
    popular: true,
  },
  {
    name: "Accelerator",
    description: "AI-powered career acceleration",
    price: "$49",
    period: "/month",
    features: [
      "Everything in Pro",
      "1-on-1 AI Career Coach",
      "Weekly personalized reports",
      "Salary negotiation scripts",
      "Referral optimization",
      "LinkedIn profile optimization",
      "Priority support",
      "Early access to new features",
    ],
    cta: "Get Accelerator",
    href: "/dashboard/checkout?plan=accelerator",
    popular: false,
  },
];

//============================================
// FAQ Categories
//============================================
export const FAQ_CATEGORIES = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How does ApplySmart work?",
        a: "Upload your resume, and our AI analyzes it for ATS compatibility, keyword optimization, and readability. Then use our job matching, interview practice, and portfolio tools to accelerate your job search.",
      },
      {
        q: "Is ApplySmart free to use?",
        a: "Yes! Our Free plan includes 3 resume optimizations per month, basic job matching, and limited interview practice. Upgrade to Pro for unlimited access.",
      },
    ],
  },
  {
    category: "Resume Optimization",
    questions: [
      {
        q: "What file formats are supported?",
        a: "We support PDF, DOC, and DOCX files up to 10MB. Our system extracts text while preserving formatting structure.",
      },
      {
        q: "How accurate is the ATS scoring?",
        a: "Our AI is trained on real ATS systems used by Fortune 500 companies. Scores correlate with 94% accuracy to actual ATS pass rates.",
      },
    ],
  },
  {
    category: "Application Tracker",
    questions: [
      {
        q: "How does the application tracker work?",
        a: "Log every job application with status, dates, and notes. Our AI analyzes your pipeline and sends follow-up reminders to maximize your response rate.",
      },
      {
        q: "Can I import applications from other platforms?",
        a: "Coming soon! We're building integrations with LinkedIn, Indeed, and Greenhouse to auto-sync your applications.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Is my resume data secure?",
        a: "Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, and never share your data with third parties. Your resume is processed securely and never used to train AI models.",
      },
      {
        q: "Do you store my payment information?",
        a: "No. All payments are processed securely through Lemon Squeezy. We never see or store your card details.",
      },
    ],
  },
];

//============================================
// Formatting Utilities
//============================================
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

//============================================
// Score Color Helpers
//============================================
export function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 70) return "text-brand-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

export function getScoreBg(score: number): string {
  if (score >= 90) return "bg-emerald-50";
  if (score >= 70) return "bg-brand-50";
  if (score >= 50) return "bg-amber-50";
  return "bg-red-50";
}

export function getScoreGradient(score: number): string {
  if (score >= 90) return "from-emerald-400 to-emerald-600";
  if (score >= 70) return "from-brand-400 to-accent-500";
  if (score >= 50) return "from-amber-400 to-amber-600";
  return "from-red-400 to-red-600";
}

//============================================
// Application Status Helpers
//============================================
export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  saved: { label: "Saved", color: "text-slate-600", bg: "bg-slate-100", icon: "Bookmark" },
  applied: { label: "Applied", color: "text-brand-600", bg: "bg-brand-50", icon: "Send" },
  phone_screen: { label: "Phone Screen", color: "text-purple-600", bg: "bg-purple-50", icon: "Phone" },
  technical: { label: "Technical", color: "text-amber-600", bg: "bg-amber-50", icon: "Code" },
  onsite: { label: "Onsite", color: "text-orange-600", bg: "bg-orange-50", icon: "Building" },
  offer: { label: "Offer", color: "text-emerald-600", bg: "bg-emerald-50", icon: "Trophy" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50", icon: "XCircle" },
  withdrawn: { label: "Withdrawn", color: "text-slate-500", bg: "bg-slate-50", icon: "MinusCircle" },
  ghosted: { label: "Ghosted", color: "text-slate-400", bg: "bg-slate-50", icon: "Ghost" },
};

export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.saved;
}

//============================================
// SEO Helpers
//============================================
export function generateMetaTags(options: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://applysmart.io";

  return {
    title: `${options.title} | ApplySmart`,
    description: options.description,
    openGraph: {
      title: options.title,
      description: options.description,
      url: options.url || baseUrl,
      siteName: "ApplySmart",
      images: [
        {
          url: options.image || `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
      type: options.type || "website",
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [options.image || `${baseUrl}/og-image.png`],
    },
  };
}
