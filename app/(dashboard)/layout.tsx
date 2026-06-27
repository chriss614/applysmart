"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Briefcase, Search, FileText, MessageSquare, Globe,
  BarChart3, Sparkles, Users, Settings, Menu, X, ChevronLeft, ChevronRight,
  Bell, Zap, Crown, LogOut
} from "lucide-react";
import { DASHBOARD_NAV } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Briefcase, Search, FileText, MessageSquare, Globe,
  BarChart3, Sparkles, Users, Settings,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "x-csrf-token": csrfToken },
    });
    window.location.href = "/login";
  }

  const [user, setUser] = useState<{ name: string; email: string; plan: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  const displayName = user?.name || "User";
  const planLabel = user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) + " Plan" : "Free Plan";
  const isPro = user?.plan === "pro" || user?.plan === "accelerator";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[280px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100">
          <Link href="/dashboard/overview" className="flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-brand-500 shrink-0" />
            {!collapsed && (
              <span className="text-xl font-bold gradient-text whitespace-nowrap">ApplySmart</span>
            )}
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {DASHBOARD_NAV.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const isPremiumRoute = ["/dashboard/coach", "/dashboard/analytics", "/dashboard/portfolio"].some(r => item.href.startsWith(r));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "sidebar-active"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                } ${isPremiumRoute ? "relative" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                {!collapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className="badge-premium text-[10px] py-0.5">{item.badge}</span>
                    )}
                    {isPremiumRoute && (
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 text-slate-500 hover:text-slate-700 text-sm"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <Link href="/dashboard/checkout" className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
              <Zap className="w-3.5 h-3.5" /> Upgrade to Pro
            </Link>

            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{planLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
