import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import SocialProof from "@/components/landing/social-proof";
import FAQ from "@/components/landing/faq";
import { generateMetaTags } from "@/lib/utils";

export const metadata = generateMetaTags({
  title: "AI-Powered Remote Tech Job Platform",
  description: "Optimize resumes with AI ATS scoring, discover remote tech jobs, practice interviews with AI feedback, and build stunning portfolios. The complete career acceleration platform.",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <SocialProof />
      <section className="py-20 bg-gradient-to-br from-brand-600 to-brand-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
            Join 10,000+ developers who landed their dream remote jobs with ApplySmart's AI-powered toolkit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="btn-primary bg-white text-brand-600 hover:bg-brand-50 shadow-lg">
              Get Started Free
            </a>
            <a href="#features" className="btn-secondary border-white/30 text-white hover:bg-white/10">
              Explore Features
            </a>
          </div>
        </div>
      </section>
      <FAQ />
    </>
  );
}
