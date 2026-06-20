'use client';

import Link from 'next/link';
import { Sparkles, Twitter, Github, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-brand-400" />
              <span className="text-xl font-bold text-white">ApplySmart</span>
            </Link>
            <p className="text-sm mb-4">AI-powered career acceleration for remote tech professionals.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#features" className="hover:text-white transition-colors">Resume Optimizer</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Job Matching</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">Interview Simulator</Link></li>
              <li><Link href="#features" className="hover:text-white transition-colors">AI Career Coach</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              <li><Link href="/legal" className="hover:text-white transition-colors">Legal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Stay Updated</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Enter your email" className="input-premium text-sm flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
              <button className="btn-primary text-sm px-4">Subscribe</button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-center">
          © {new Date().getFullYear()} ApplySmart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
