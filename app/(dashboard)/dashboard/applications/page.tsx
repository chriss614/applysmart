"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Search, Filter, Star, Briefcase, Bookmark, Send, Phone, Code,
  Building, Trophy, XCircle, MinusCircle, Ghost, ChevronDown, Calendar
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_CONFIG } from "@/lib/utils";

const statusColumns = [
  "saved", "applied", "phone_screen", "technical", "onsite", "offer", "rejected", "withdrawn", "ghosted"
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formData, setFormData] = useState({
    company: "", role: "", location: "", salaryRange: "", jobUrl: "", status: "applied", notes: "", tags: ""
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success("Application added!");
        setShowModal(false);
        setFormData({ company: "", role: "", location: "", salaryRange: "", jobUrl: "", status: "applied", notes: "", tags: "" });
        fetchApplications();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add application");
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  async function updateStatus(id: number, status: string) {
    const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        setApplications((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
        toast.success("Status updated");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  }

  const filtered = applications.filter((app) => {
    const matchesSearch = !searchQuery ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const groupedByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = filtered.filter((a) => a.status === status);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Application Tracker</h1>
          <p className="text-slate-500">Track and manage your job applications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies or roles..."
            className="input-premium pl-9 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-premium text-sm pr-8"
        >
          <option value="">All Statuses</option>
          {statusColumns.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {statusColumns.map((status) => {
            const apps = groupedByStatus[status] || [];
            const config = STATUS_CONFIG[status];
            return (
              <div key={status} className="w-72 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 ${config.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  <span className="ml-auto text-xs text-slate-400">{apps.length}</span>
                </div>
                <div className="space-y-2">
                  {apps.map((app) => (
                    <motion.div
                      key={app.id}
                      layout
                      className="card-premium p-3 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{app.company}</p>
                          <p className="text-xs text-slate-500">{app.role}</p>
                        </div>
                        <button
                          onClick={() => updateStatus(app.id, app.isFavorite ? "saved" : "saved")}
                          className="text-slate-300 hover:text-amber-400"
                        >
                          <Star className={`w-4 h-4 ${app.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                        </button>
                      </div>
                      {app.location && <p className="text-xs text-slate-400 mb-2">{app.location}</p>}
                      {app.tags && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {app.tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400">{new Date(app.dateApplied || app.createdAt).toLocaleDateString()}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add Application</h2>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
                    <input type="text" required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="input-premium text-sm" placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                    <input type="text" required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-premium text-sm" placeholder="e.g. Senior Engineer" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-premium text-sm" placeholder="Remote / City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
                    <input type="text" value={formData.salaryRange} onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })} className="input-premium text-sm" placeholder="$100k - $150k" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job URL</label>
                  <input type="url" value={formData.jobUrl} onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })} className="input-premium text-sm" placeholder="https://..." />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-premium text-sm">
                    {statusColumns.map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input-premium text-sm" placeholder="remote, frontend, react" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="input-premium text-sm resize-none" placeholder="Any notes about this application..." />
                </div>

                <button type="submit" className="btn-primary w-full">Add Application</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
