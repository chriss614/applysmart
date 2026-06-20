'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Frontend Engineer',
    company: 'Stripe',
    quote: 'ApplySmart helped me optimize my resume for ATS and I started getting callbacks within a week. The AI interview practice was a game changer for my technical rounds.',
    stars: 5,
    avatar: 'SC',
  },
  {
    name: 'Marcus Johnson',
    role: 'Full Stack Developer',
    company: 'Vercel',
    quote: 'The application tracker kept me organized during my job search. I applied to 50+ jobs and the AI insights helped me focus on the ones with highest match scores.',
    stars: 5,
    avatar: 'MJ',
  },
  {
    name: 'Elena Rodriguez',
    role: 'DevOps Engineer',
    company: 'Datadog',
    quote: 'From resume optimization to salary negotiation scripts, ApplySmart covered everything. I landed a 40% raise using their AI coach for negotiation prep.',
    stars: 5,
    avatar: 'ER',
  },
];

export default function SocialProof() {
  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-premium mb-4"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Loved by developers worldwide
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-premium card-premium-hover p-6"
            >
              <Quote className="w-8 h-8 text-brand-200 mb-4" />
              <p className="text-slate-600 text-sm leading-relaxed mb-6">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role} at {t.company}</p>
                </div>
              </div>
              <div className="flex gap-0.5 mt-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
