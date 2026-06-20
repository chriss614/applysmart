"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, Palette, Eye, Upload, Check, ExternalLink, Code, Monitor
} from "lucide-react";
import { toast } from "sonner";

const themes = [
  { id: "modern", name: "Modern", color: "from-brand-500 to-accent-500", preview: "bg-gradient-to-br from-slate-900 to-slate-800" },
  { id: "minimal", name: "Minimal", color: "from-slate-500 to-slate-600", preview: "bg-white" },
  { id: "creative", name: "Creative", color: "from-purple-500 to-pink-500", preview: "bg-gradient-to-br from-purple-900 to-pink-900" },
  { id: "professional", name: "Professional", color: "from-emerald-500 to-teal-500", preview: "bg-gradient-to-br from-emerald-900 to-teal-900" },
];

export default function PortfolioPage() {
  const [selectedTheme, setSelectedTheme] = useState("modern");
  const [published, setPublished] = useState(false);
  const [content, setContent] = useState({
    name: "John Doe",
    title: "Full Stack Developer",
    bio: "Passionate developer with 5+ years of experience building scalable web applications.",
    skills: "React, TypeScript, Node.js, Python, AWS",
  });

  async function handlePublish() {
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ theme: selectedTheme, content, isPublished: true }),
      });

      if (res.ok) {
        setPublished(true);
        toast.success("Portfolio published!");
      } else {
        toast.error("Failed to publish");
      }
    } catch (error) {
      toast.error("Failed to publish portfolio");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Portfolio Generator</h1>
        <p className="text-slate-500">Build and publish your developer portfolio</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          {/* Theme Selector */}
          <div className="card-premium p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-500" /> Choose Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    selectedTheme === theme.id ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className={`h-16 rounded-lg ${theme.preview} mb-3`} />
                  <p className="font-medium text-sm text-slate-900">{theme.name}</p>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div className="card-premium p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={content.name}
                  onChange={(e) => setContent({ ...content, name: e.target.value })}
                  className="input-premium text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  className="input-premium text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
                <textarea
                  value={content.bio}
                  onChange={(e) => setContent({ ...content, bio: e.target.value })}
                  rows={3}
                  className="input-premium text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Skills</label>
                <input
                  type="text"
                  value={content.skills}
                  onChange={(e) => setContent({ ...content, skills: e.target.value })}
                  className="input-premium text-sm"
                />
              </div>
            </div>
          </div>

          <button onClick={handlePublish} className="btn-primary w-full flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" /> {published ? "Update Portfolio" : "Publish Portfolio"}
          </button>
        </div>

        {/* Preview */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-500" /> Live Preview
            </h3>
            {published && (
              <a href="#" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> View Live
              </a>
            )}
          </div>

          <div className="bg-slate-100 rounded-xl p-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Mock portfolio preview */}
              <div className={`h-32 bg-gradient-to-r ${themes.find((t) => t.id === selectedTheme)?.color || "from-brand-500 to-accent-500"}`} />
              <div className="p-6 -mt-12">
                <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center text-xl font-bold text-slate-700 mx-auto mb-4">
                  {content.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <h2 className="text-xl font-bold text-center text-slate-900">{content.name}</h2>
                <p className="text-center text-slate-500 text-sm">{content.title}</p>
                <p className="text-center text-slate-600 text-sm mt-3 max-w-sm mx-auto">{content.bio}</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {content.skills.split(",").map((skill) => (
                    <span key={skill} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{skill.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
