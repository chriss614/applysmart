"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, MapPin, DollarSign, Briefcase, Filter, Bookmark, ExternalLink,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: number;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  salaryRange?: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  skills: string[];
  experienceLevel?: string;
  employmentType?: string;
  isRemote: boolean;
  postedAt?: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    remote: false,
    experienceLevel: "",
    salaryMin: "",
    salaryMax: "",
  });

  useEffect(() => {
    fetchJobs();
  }, [page, query]);

  async function fetchJobs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (query) params.set("query", query);
      if (filters.remote) params.set("remote", "true");
      if (filters.experienceLevel) params.set("experienceLevel", filters.experienceLevel);
      if (filters.salaryMin) params.set("salaryMin", filters.salaryMin);
      if (filters.salaryMax) params.set("salaryMax", filters.salaryMax);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Jobs fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    setPage(1);
    fetchJobs();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Job Search</h1>
        <p className="text-slate-500">Discover remote tech jobs matched to your skills</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchJobs()}
            placeholder="Search by title, company, or keywords..."
            className="input-premium pl-10"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-brand-500' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="card-premium p-4 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.remote}
              onChange={(e) => setFilters({ ...filters, remote: e.target.checked })}
              className="rounded border-slate-300 text-brand-600"
            />
            <span className="text-sm text-slate-700">Remote only</span>
          </label>
          <select
            value={filters.experienceLevel}
            onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
            className="input-premium text-sm"
          >
            <option value="">Any Experience</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
            <option value="staff">Staff+</option>
          </select>
          <input
            type="number"
            value={filters.salaryMin}
            onChange={(e) => setFilters({ ...filters, salaryMin: e.target.value })}
            placeholder="Min Salary"
            className="input-premium text-sm"
          />
          <input
            type="number"
            value={filters.salaryMax}
            onChange={(e) => setFilters({ ...filters, salaryMax: e.target.value })}
            placeholder="Max Salary"
            className="input-premium text-sm"
          />
          <button onClick={handleFilter} className="btn-primary text-sm col-span-2 md:col-span-4">Apply Filters</button>
        </motion.div>
      )}

      {/* Job Cards */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No jobs found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-premium card-premium-hover p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    {job.isRemote && (
                      <span className="badge-premium text-[10px]">Remote</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-2">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    {job.salaryRange && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salaryRange}</span>}
                    {job.experienceLevel && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.experienceLevel}</span>}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills?.map((skill) => (
                      <span key={skill} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => toast.success("Job saved to your list")}
                    className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <a
                    href={job.sourceUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
