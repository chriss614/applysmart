import { ThemeProvider } from "@/lib/theme";
import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://applysmart.io"),
  title: {
    default: "ApplySmart — AI-Powered Remote Tech Job Platform",
    template: "%s | ApplySmart",
  },
  description:
    "Optimize resumes with AI ATS scoring, discover remote tech jobs, practice interviews with AI feedback, and build stunning portfolios. The complete career acceleration platform.",
  keywords: [
    "remote jobs", "tech jobs", "resume optimizer", "ATS scanner", "AI resume review",
    "interview practice", "portfolio generator", "job matching", "career tools",
    "job search", "AI career coach", "application tracker", "developer jobs",
  ],
  authors: [{ name: "ApplySmart", url: "https://applysmart.io" }],
  creator: "ApplySmart",
  publisher: "ApplySmart",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ApplySmart",
    title: "ApplySmart — AI-Powered Remote Tech Job Platform",
    description: "AI-optimized resumes, smart job matching, interview practice, and portfolio generation — all in one platform.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ApplySmart Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@applysmart",
    creator: "@applysmart",
    title: "ApplySmart — AI-Powered Remote Tech Job Platform",
    description: "Land your dream remote tech job with AI.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${interTight.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
