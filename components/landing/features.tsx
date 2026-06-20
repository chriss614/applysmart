'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, FileSearch, MessageSquare, Globe } from 'lucide-react';

const features = [
  {
    icon: FileSearch,
    title: 'Resume Optimizer',
    description: 'AI-powered ATS scoring with keyword analysis and readability optimization. Get your resume past the bots every time.',
    color: 'from-brand-500 to-brand-600',
    bg: 'bg-brand-50',
  },
  {
    icon: Zap,
    title: 'Smart Job Matching',
    description: 'Discover remote tech jobs matched to your skills and experience. AI scores each opportunity for you.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: MessageSquare,
    title: 'Interview Simulator',
    description: 'Practice with AI-generated interview questions and receive detailed feedback on your responses.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Globe,
    title: 'Portfolio Generator',
    description: 'Build stunning, export-ready developer portfolios in minutes. Choose from modern themes and publish instantly.',
    color: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Sparkles,
    title: 'AI Career Coach',
    description: 'Get personalized career guidance, salary negotiation scripts, and referral optimization strategies.',
    color: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-50',
  },
  {
    icon: FileSearch,
    title: 'Application Tracker',
    description: 'Track every application from saved to offer. Get follow-up reminders and AI pipeline insights.',
    color: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-premium mb-4"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Everything you need to land your dream job
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            From resume optimization to offer negotiation, ApplySmart's AI toolkit covers your entire job search journey.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-premium card-premium-hover p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} style={{ color: 'inherit' }} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
