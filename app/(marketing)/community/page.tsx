"use client";

import { motion } from "framer-motion";
import { Users, MessageSquare, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Active Members", value: "2,400+", icon: Users },
  { label: "Daily Discussions", value: "150+", icon: MessageSquare },
  { label: "Success Stories", value: "380+", icon: TrendingUp },
  { label: "Expert Mentors", value: "45", icon: Award },
];

const topics = [
  "Resume Reviews",
  "Interview Prep",
  "Salary Negotiation",
  "Remote Work Tips",
  "Career Growth",
  "Job Search Strategies",
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Join Our Community
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-300 text-lg mb-8"
          >
            Connect with fellow job seekers, share experiences, and get advice from industry experts.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/register"
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Join for Free
            </Link>
            <Link
              href="/dashboard/community"
              className="bg-white/10 text-white border border-white/20 px-8 py-3 rounded-lg font-medium hover:bg-white/20 transition"
            >
              Browse Discussions
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 text-center border border-slate-200"
            >
              <stat.icon className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Join?</h2>
            <ul className="space-y-4">
              {[
                "Get feedback on your resume from peers and mentors",
                "Practice mock interviews with community members",
                "Learn salary negotiation tactics from those who've done it",
                "Share your journey and inspire others",
                "Access exclusive webinars and Q&A sessions",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Popular Topics</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
