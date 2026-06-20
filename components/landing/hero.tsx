'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, TrendingUp, Users } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/50 via-white to-accent-50/30 -z-10" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-premium mb-6 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Career Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6"
          >
            Land Your Dream{' '}
            <span className="gradient-text">Remote Tech Job</span>{' '}
            with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Optimize your resume for ATS, discover matched remote jobs, practice interviews with AI feedback, and build a stunning portfolio — all in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <a href="/register" className="btn-primary text-lg px-8 py-3.5 flex items-center justify-center gap-2">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#how-it-works" className="btn-secondary text-lg px-8 py-3.5 flex items-center justify-center gap-2">
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center gap-8 text-sm text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <span><strong className="text-slate-900">10,000+</strong> developers</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span><strong className="text-slate-900">94%</strong> ATS pass rate</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span><strong className="text-slate-900">3x</strong> faster job search</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
