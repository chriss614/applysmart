"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check, ArrowRight, Crown, Zap, Sparkles, Shield, HelpCircle
} from "lucide-react";
import { PRICING_PLANS } from "@/lib/utils";

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const plan = PRICING_PLANS.find((p) => p.name.toLowerCase() === selectedPlan);
      if (!plan) return;

      // In real app, redirect to Lemon Squeezy checkout
      window.location.href = plan.href;
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  }

  const planDetails = {
    free: { color: "bg-slate-100", border: "border-slate-200", text: "text-slate-600" },
    pro: { color: "bg-brand-500", border: "border-brand-500", text: "text-white" },
    accelerator: { color: "bg-gradient-to-r from-amber-500 to-orange-500", border: "border-amber-500", text: "text-white" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upgrade Your Plan</h1>
        <p className="text-slate-500">Unlock unlimited AI tools and accelerate your career</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {PRICING_PLANS.map((plan, i) => {
          const isSelected = selectedPlan === plan.name.toLowerCase();
          const styles = planDetails[plan.name.toLowerCase() as keyof typeof planDetails];

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedPlan(plan.name.toLowerCase())}
              className={`card-premium card-premium-hover p-6 cursor-pointer relative transition-all ${
                isSelected ? `ring-2 ${plan.name === "Pro" ? "ring-brand-500" : plan.name === "Accelerator" ? "ring-amber-500" : "ring-slate-300"}` : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-premium bg-brand-600 text-white border-brand-600 px-4 py-1 text-xs">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-500 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className={`w-5 h-5 shrink-0 ${plan.popular ? "text-brand-500" : "text-emerald-500"}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto ${
                isSelected ? (plan.name === "Pro" ? "border-brand-500 bg-brand-500" : plan.name === "Accelerator" ? "border-amber-500 bg-amber-500" : "border-slate-400 bg-slate-400") : "border-slate-300"
              }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card-premium p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Selected Plan</h3>
            <p className="text-sm text-slate-500">
              {PRICING_PLANS.find((p) => p.name.toLowerCase() === selectedPlan)?.name} — {PRICING_PLANS.find((p) => p.name.toLowerCase() === selectedPlan)?.price}
              {PRICING_PLANS.find((p) => p.name.toLowerCase() === selectedPlan)?.period}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading || selectedPlan === "free"}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue to Payment <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> Secure checkout</span>
          <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Instant access</span>
          <span className="flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> 30-day refund</span>
        </div>
      </div>
    </div>
  );
}
