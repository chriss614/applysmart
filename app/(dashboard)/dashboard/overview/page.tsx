"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase, FileText, MessageSquare, Search, Sparkles, TrendingUp,
  ArrowRight, Zap, Target, Award, Clock, ChevronRight
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Stats {
  totalApplications: number;
  interviewsCompleted: number;
  avgAtsScore: number;
  responseRate: number;
  weeklyProgress: number;
  weeklyGoal: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalApplications: 0,
    interviewsCompleted: 0,
    avgAtsScore: 0,
    responseRate: 0,
    weeklyProgress: 0,
    weeklyGoal: 10,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, appsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/applications?limit=5"),
        ]);

        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setStats(data.summary || stats);
        }
        if (appsRes.ok) {
          const data = await appsRes.json();
          setRecentApplications(data.applications || []);
        }
      } catch (error) {
        console.error("Overview fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const statCards = [
    { label: "Applications", value: stats.totalApplications, icon: Briefcase, color: "text-brand-500", bg: "bg-brand-50" },
    { label: "Interviews", value: stats.interviewsCompleted, icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Avg ATS Score", value: stats.avgAtsScore, icon: Target, color: "text-purple-500", bg: "bg-purple-50", suffix: "%" },
    { label: "Response Rate", value: stats.responseRate, icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50", suffix: "%" },
  ];

  const quickActions = [
    { label: "Optimize Resume", href: "/dashboard/resume", icon: FileText, color: "from-brand-500 to-brand-600" },
    { label: "Practice Interview", href: "/dashboard/interview", icon: MessageSquare, color: "from-emerald-500 to-teal-500" },
    { label: "Find Jobs", href: "/dashboard/jobs", icon: Search, color: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's your job search overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-premium card-premium-hover p-5"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{loading ? "—" : `${card.value}${card.suffix || ""}`}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Weekly Goal</h3>
                <p className="text-sm text-slate-500">{stats.weeklyProgress} of {stats.weeklyGoal} applications</p>
              </div>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-gradient-to-r from-brand-500 to-accent-500 h-full rounded-full"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <div className="card-premium card-premium-hover p-5 group cursor-pointer">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{action.label}</h4>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    Get started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Applications */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Recent Applications</h3>
              <Link href="/dashboard/applications" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 skeleton" />
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Briefcase className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p>No applications yet. Start tracking your job search!</p>
                <Link href="/dashboard/applications" className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4" /> Add Application
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-brand-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{app.company}</p>
                        <p className="text-xs text-slate-500">{app.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`badge-premium text-xs capitalize ${
                        app.status === 'offer' ? 'bg-emerald-50 text-emerald-700' :
                        app.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-brand-50 text-brand-700'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(app.dateApplied || app.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Coach Preview */}
          <div className="card-premium p-6 bg-gradient-to-br from-brand-50 to-accent-50/50 border-brand-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-brand-500" />
              <h3 className="font-semibold text-slate-900">AI Career Coach</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Get personalized career guidance, resume tips, and interview prep from your AI coach.
            </p>
            <Link href="/dashboard/coach" className="btn-primary text-sm w-full flex items-center justify-center gap-2">
              Chat with Coach <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Activity */}
          <div className="card-premium p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">Resume uploaded</p>
                  <p className="text-xs text-slate-400">{formatDate(new Date())}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">Interview practice completed</p>
                  <p className="text-xs text-slate-400">{formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-700">Job application tracked</p>
                  <p className="text-xs text-slate-400">{formatDate(new Date(Date.now() - 48 * 60 * 60 * 1000))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="card-premium p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Career Tip</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Follow up on applications 5-7 days after applying. Companies respond 3x more often to candidates who send thoughtful follow-up emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
