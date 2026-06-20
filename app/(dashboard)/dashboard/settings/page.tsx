"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Briefcase, MapPin, DollarSign, Sparkles, Save, Loader2,
  Shield, AlertTriangle, Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    targetRole: "",
    yearsExperience: "",
    preferredLocation: "",
    salaryExpectation: "",
    skills: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          ...profile,
          skills: profile.skills.split(",").map((s) => s.trim()).filter(Boolean),
          yearsExperience: profile.yearsExperience ? parseInt(profile.yearsExperience) : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your profile, preferences, and account</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Profile
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="input-premium pl-10 text-sm"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="input-premium pl-10 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.targetRole}
                    onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                    className="input-premium pl-10 text-sm"
                    placeholder="e.g. Senior Frontend Engineer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                <input
                  type="number"
                  value={profile.yearsExperience}
                  onChange={(e) => setProfile({ ...profile, yearsExperience: e.target.value })}
                  className="input-premium text-sm"
                  placeholder="3"
                  min={0}
                  max={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.preferredLocation}
                    onChange={(e) => setProfile({ ...profile, preferredLocation: e.target.value })}
                    className="input-premium pl-10 text-sm"
                    placeholder="Remote / San Francisco"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Salary Expectation</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.salaryExpectation}
                    onChange={(e) => setProfile({ ...profile, salaryExpectation: e.target.value })}
                    className="input-premium pl-10 text-sm"
                    placeholder="$100k - $150k"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills (comma separated)</label>
                <input
                  type="text"
                  value={profile.skills}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  className="input-premium text-sm"
                  placeholder="React, TypeScript, Node.js, Python..."
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary mt-6 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          {/* Password */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" /> Security
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                <input type="password" className="input-premium text-sm" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                <input type="password" className="input-premium text-sm" placeholder="••••••••" />
              </div>
            </div>
            <button className="btn-secondary mt-4 text-sm">Update Password</button>
          </div>

          {/* Danger Zone */}
          <div className="card-premium p-6 border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-sm text-slate-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
            <button
              onClick={() => toast.error("Account deletion is disabled in demo")}
              className="flex items-center gap-2 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="card-premium p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" /> Current Plan
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="font-semibold text-slate-900">Free</p>
              <p className="text-sm text-slate-500">3 resume optimizations/month</p>
            </div>
            <a href="/dashboard/checkout" className="btn-primary w-full text-sm text-center flex items-center justify-center gap-2">
              Upgrade to Pro
            </a>
          </div>

          <div className="card-premium p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              {["Email alerts for new jobs", "Interview reminders", "Application follow-ups", "Weekly progress report"].map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-brand-600" />
                  <span className="text-sm text-slate-600">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
