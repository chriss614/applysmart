import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Privacy",
  description: "Terms of Service and Privacy Policy for ApplySmart",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Legal</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Terms of Service</h2>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p className="mb-4">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="mb-4">
              Welcome to ApplySmart. By using our services, you agree to these terms.
              Please read them carefully.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">1. Acceptance of Terms</h3>
            <p className="mb-4">
              By accessing or using ApplySmart, you agree to be bound by these Terms of Service
              and all applicable laws and regulations. If you do not agree with any of these terms,
              you are prohibited from using or accessing this site.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">2. Use License</h3>
            <p className="mb-4">
              Permission is granted to temporarily use ApplySmart for personal, non-commercial
              transitory viewing only. This is the grant of a license, not a transfer of title.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">3. User Accounts</h3>
            <p className="mb-4">
              You are responsible for maintaining the confidentiality of your account and password.
              You agree to accept responsibility for all activities that occur under your account.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">4. AI-Generated Content</h3>
            <p className="mb-4">
              ApplySmart uses AI to provide resume analysis, interview practice, and coaching.
              While we strive for accuracy, AI-generated content should be reviewed by you before use.
              We are not responsible for outcomes based on AI recommendations.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">5. Subscription & Payments</h3>
            <p className="mb-4">
              Paid subscriptions are billed in advance on a monthly or annual basis. You may cancel
              at any time, but no refunds will be provided for partial months. We reserve the right
              to change pricing with 30 days notice.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">6. Limitation of Liability</h3>
            <p className="mb-4">
              ApplySmart and its suppliers shall not be liable for any damages arising out of the use
              or inability to use the materials on ApplySmart.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Privacy Policy</h2>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p className="mb-4">
              ApplySmart is committed to protecting your privacy. This policy explains how we
              collect, use, and safeguard your information.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Information We Collect</h3>
            <p className="mb-4">
              We collect information you provide directly (name, email, resume data) and
              automatically (usage data, cookies, IP addresses). Resume content is processed
              by AI services for analysis.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">How We Use Your Information</h3>
            <p className="mb-4">
              We use your information to provide and improve our services, process payments,
              send notifications, and personalize your experience. We do not sell your
              personal data to third parties.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Data Security</h3>
            <p className="mb-4">
              We implement industry-standard security measures including encryption at rest
              and in transit, secure authentication, and regular security audits. However,
              no method of transmission over the internet is 100% secure.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Your Rights</h3>
            <p className="mb-4">
              You have the right to access, correct, or delete your personal data. You may
              also request a copy of your data or object to certain processing activities.
              Contact us at privacy@applysmart.io to exercise these rights.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Cookies</h3>
            <p className="mb-4">
              We use cookies to maintain your session, remember preferences, and analyze
              traffic. You can control cookies through your browser settings.
            </p>
            <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2">Contact Us</h3>
            <p>
              If you have any questions about these terms or our privacy practices, please
              contact us at <a href="mailto:legal@applysmart.io" className="text-emerald-600 hover:underline">legal@applysmart.io</a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
