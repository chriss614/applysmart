import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/security";

//============================================
// Route Configuration
//============================================
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/faqs",
  "/legal",
  "/community",
  "/p/", // Public portfolios
];

const STATIC_PATHS = [
  "/images",
  "/_next",
  "/api/webhooks",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
  "/.well-known",
];

const AUTH_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/google",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh",
  "/api/health",
];

//============================================
// Security Headers
//============================================
const SECURITY_HEADERS = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), magnetometer=(), gyroscope=()",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const HSTS_HEADER = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

//============================================
// Main Middleware
//============================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip any incoming x-user-* headers from client to prevent spoofing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-user-role");
  requestHeaders.delete("x-user-plan");

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // HSTS in production
  if (process.env.NODE_ENV === "production") {
    Object.entries(HSTS_HEADER).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Skip static paths
  if (STATIC_PATHS.some((p) => pathname.startsWith(p))) {
    return response;
  }

  // Generate CSRF token for non-API requests
  if (!pathname.startsWith("/api/")) {
    const csrfToken = request.cookies.get("csrf-token")?.value || crypto.randomUUID();
    response.cookies.set("csrf-token", csrfToken, {
      httpOnly: false, // Must be accessible by JS
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed to lax for OAuth compatibility
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });
  }

  // Public routes don't need auth
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
    return response;
  }

  // Auth API routes don't need auth (they handle it themselves)
  if (AUTH_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return response;
  }

  // Check authentication for protected routes
  const token = request.cookies.get("token")?.value;
  let isAuthenticated = false;
  let userPayload = null;

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      isAuthenticated = true;
      userPayload = payload;
    }
  }

  // Redirect unauthenticated users from dashboard
  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect unauthenticated users from API
  if (pathname.startsWith("/api/") && !isAuthenticated && !AUTH_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect authenticated users from auth pages
  if (isAuthenticated && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard/overview", request.url));
  }

  // Check plan access for premium features
  const PREMIUM_ROUTES = ["/dashboard/coach", "/dashboard/analytics", "/dashboard/portfolio"];
  if (PREMIUM_ROUTES.some((route) => pathname.includes(route))) {
    if (userPayload && userPayload.plan === "free") {
      return NextResponse.redirect(new URL("/dashboard/checkout", request.url));
    }
  }

  return response;
}

//============================================
// Matcher Configuration
//============================================
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.png$|.*\.jpg$|.*\.svg$|.*\.ico$).*)",
  ],
};
