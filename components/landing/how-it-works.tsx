'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Upload, Brain, Send, Trophy } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Resume',
    description: 'Upload your resume in PDF, DOC, or DOCX format. Our AI parses it instantly.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Analysis',
    description: 'Get ATS score, keyword analysis, readability score, and personalized optimization suggestions.',
  },
  {
    number: '03',
    icon: Send,
    title: 'Apply Smart',
    description: 'Discover matched jobs, track applications, and practice interviews with AI feedback.',
  },
  {
    number: '04',
    icon: Trophy,
    title: 'Land Your Job',
    description: 'Follow AI-guided follow-ups, negotiate offers, and build your portfolio to stand out.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="badge-premium mb-4"
          >
            How It Works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
          >
            Four steps to your dream job
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="card-premium card-premium-hover p-6 text-center h-full">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <span className="text-4xl font-bold text-slate-100 absolute top-4 right-4">{step.number}</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-slate-300" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
