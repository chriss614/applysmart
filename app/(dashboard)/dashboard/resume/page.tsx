"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import {
  Upload, FileText, Target, Wand2, Download, Loader2, AlertCircle,
  CheckCircle, X, ChevronRight, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  atsScore: number;
  readabilityScore: number;
  keywordDensity: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  optimizedSummary: string;
  missingKeywords: string[];
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resumeText, setResumeText] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit");
        return;
      }
      const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Only PDF, DOC, DOCX, TXT allowed");
        return;
      }
      setFile(file);
      if (file.type === "text/plain") {
        file.text().then(setResumeText);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        body: formData,
      });

      if (res.ok) {
        toast.success("Resume uploaded successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!resumeText && !file) {
      toast.error("Please upload a resume or paste text");
      return;
    }

    setAnalyzing(true);
    try {
      const textToAnalyze = resumeText || "Resume content...";
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ resumeText: textToAnalyze }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setResult(data.result);
        toast.success(data.cached ? "Analysis loaded from cache" : "Analysis complete!");
      } else {
        toast.error(data.error || "Analysis failed");
      }
    } catch (error) {
      toast.error("Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const scoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-red-50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resume Optimizer</h1>
        <p className="text-slate-500">Upload your resume and get AI-powered ATS analysis</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`card-premium p-8 border-2 border-dashed cursor-pointer transition-all ${
              isDragActive ? "border-brand-500 bg-brand-50/50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-brand-500" />
              </div>
              <p className="font-medium text-slate-900 mb-1">
                {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
              </p>
              <p className="text-sm text-slate-500">PDF, DOC, DOCX up to 10MB</p>
            </div>
          </div>

          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-premium p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-brand-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleUpload} disabled={uploading} className="btn-primary text-sm px-4 py-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                </button>
                <button onClick={() => { setFile(null); setResult(null); }} className="p-2 text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="card-premium p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Or paste resume text</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={8}
              className="input-premium text-sm resize-none"
              placeholder="Paste your resume content here for analysis..."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!file && !resumeText)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div>
          {result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Score Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`card-premium p-5 text-center ${scoreBg(result.atsScore)}`}>
                  <Target className={`w-8 h-8 mx-auto mb-2 ${scoreColor(result.atsScore)}`} />
                  <p className={`text-3xl font-bold ${scoreColor(result.atsScore)}`}>{result.atsScore}%</p>
                  <p className="text-sm text-slate-600">ATS Score</p>
                </div>
                <div className={`card-premium p-5 text-center ${scoreBg(result.readabilityScore)}`}>
                  <FileText className={`w-8 h-8 mx-auto mb-2 ${scoreColor(result.readabilityScore)}`} />
                  <p className={`text-3xl font-bold ${scoreColor(result.readabilityScore)}`}>{result.readabilityScore}%</p>
                  <p className="text-sm text-slate-600">Readability</p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="card-premium p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-premium p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Areas to Improve</h3>
                <ul className="space-y-2">
                  {result.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-premium p-5">
                <h3 className="font-semibold text-slate-900 mb-3">Suggestions</h3>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <Wand2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {result.missingKeywords.length > 0 && (
                <div className="card-premium p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywords.map((k) => (
                      <span key={k} className="badge-error text-xs">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-premium p-5 bg-gradient-to-br from-brand-50 to-accent-50/30">
                <h3 className="font-semibold text-slate-900 mb-2">Optimized Summary</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{result.optimizedSummary}</p>
                <button className="btn-primary mt-4 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download Optimized Version
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="card-premium p-8 h-full flex items-center justify-center text-center">
              <div>
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Upload your resume and click Analyze to see your ATS score and optimization suggestions.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
