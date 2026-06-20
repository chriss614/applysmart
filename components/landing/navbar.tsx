'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { NAV_LINKS } from '@/lib/utils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className={`w-6 h-6 ${scrolled ? 'text-brand-500' : 'text-brand-500'}`} />
            <span className={`text-xl font-bold ${scrolled ? 'gradient-text' : 'text-slate-900'}`}>ApplySmart</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors ${
                scrolled ? 'text-slate-600 hover:text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2">
              Log in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-slate-600">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-slate-900 py-2">
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 py-2">Log in</Link>
            <Link href="/register" className="btn-primary text-sm text-center">Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
