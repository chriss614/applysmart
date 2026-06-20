"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Target, Award, Calendar, ArrowUp, ArrowDown,
  Briefcase, MessageSquare, FileText, Trophy, Zap
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

interface AnalyticsData {
  summary: {
    totalApplications: number;
    responseRate: number;
    offerRate: number;
    avgAtsScore: number;
    avgInterviewScore: number;
    interviewsScheduled: number;
    offersReceived: number;
    streakDays: number;
    weeklyProgress: number;
    weeklyGoal: number;
  };
  dailyActivity: Array<{ date: string; applicationsSent: number; interviewsCompleted: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const analyticsData = await res.json();
          setData(analyticsData);
        }
      } catch (error) {
        console.error("Analytics fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#64748b"];

  const summaryCards = [
    { label: "Applications", value: data?.summary.totalApplications || 0, icon: Briefcase, color: "text-brand-500", bg: "bg-brand-50", change: "+12%" },
    { label: "Response Rate", value: `${data?.summary.responseRate || 0}%`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", change: "+5%" },
    { label: "Offers", value: data?.summary.offersReceived || 0, icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", change: "+2" },
    { label: "Avg ATS Score", value: data?.summary.avgAtsScore || 0, icon: Target, color: "text-purple-500", bg: "bg-purple-50", change: "+8" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 skeleton w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 skeleton" />
          <div className="h-80 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Analytics</h1>
        <p className="text-slate-500">Track your job search performance and insights</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card-premium card-premium-hover p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> {card.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Line Chart */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Activity Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.dailyActivity || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })} stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="applicationsSent" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} name="Applications" />
              <Area type="monotone" dataKey="interviewsCompleted" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Interviews" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie Chart */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Application Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.statusBreakdown || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
                nameKey="status"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {(data?.statusBreakdown || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Interview Scores */}
        <div className="card-premium p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Interview Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: "Technical", score: data?.summary.avgInterviewScore || 0 },
              { name: "Behavioral", score: Math.min(100, (data?.summary.avgInterviewScore || 0) + 5) },
              { name: "System Design", score: Math.max(0, (data?.summary.avgInterviewScore || 0) - 3) },
              { name: "Overall", score: data?.summary.avgInterviewScore || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#4f46e5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Goal */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Weekly Goal</h3>
            <span className="text-sm text-slate-500">
              {data?.summary.weeklyProgress || 0} / {data?.summary.weeklyGoal || 10} applications
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-6">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((data?.summary.weeklyProgress || 0) / (data?.summary.weeklyGoal || 10)) * 100, 100)}%` }}
              transition={{ duration: 1 }}
              className="bg-gradient-to-r from-brand-500 to-accent-500 h-full rounded-full"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <Zap className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-700">Streak: {data?.summary.streakDays || 0} days</p>
                <p className="text-xs text-emerald-600">Keep it up! Consistency is key.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
              <Award className="w-5 h-5 text-brand-500" />
              <div>
                <p className="text-sm font-medium text-brand-700">Insight</p>
                <p className="text-xs text-brand-600">
                  Your response rate is {(data?.summary.responseRate || 0) > 15 ? "above" : "below"} average. 
                  Try following up within 5-7 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
