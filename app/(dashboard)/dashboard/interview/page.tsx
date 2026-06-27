"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play, Send, MessageSquare, CheckCircle, XCircle, Loader2, Clock,
  ChevronRight, Star, RotateCcw, Sparkles, Trophy
} from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: number;
  question: string;
  type: string;
  difficulty: string;
  expectedPoints: string[];
  timeEstimate: string;
}

interface Feedback {
  score: number;
  strengths: string[];
  areasToImprove: string[];
  modelAnswer: string;
  followUpQuestions: string[];
}

export default function InterviewPage() {
  const [step, setStep] = useState<"setup" | "interview" | "feedback" | "history">("setup");
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("mid");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [responses, setResponses] = useState<Record<number, { response: string; feedback: Feedback }>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const [sessionId, setSessionId] = useState<number | null>(null);

  async function startInterview() {
    if (!jobRole) {
      toast.error("Please enter a job role");
      return;
    }

    setLoading(true);
    try {
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({ jobRole, difficulty, questionCount }),
      });

      const data = await res.json();
      if (res.ok && data.questions && data.sessionId) {
        setQuestions(data.questions);
        setSessionId(data.sessionId);
        setStep("interview");
        setCurrentQuestion(0);
        setResponse("");
        setFeedback(null);
        setTimerActive(true);
      } else {
        toast.error(data.error || "Failed to generate questions");
      }
    } catch (error) {
      toast.error("Failed to start interview");
    } finally {
      setLoading(false);
    }
  }

  async function submitResponse() {
    if (!response.trim()) {
      toast.error("Please enter your response");
      return;
    }
    if (!sessionId) {
      toast.error("Session expired");
      return;
    }

    setLoading(true);
    try {
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
      const res = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          sessionId,
          questionId: questions[currentQuestion].id,
          response,
        }),
      });

      const data = await res.json();
      if (res.ok && data.feedback) {
        setFeedback(data.feedback);
        setResponses((prev) => ({
          ...prev,
          [currentQuestion]: { response, feedback: data.feedback },
        }));

        // Calculate running average
        const allScores = Object.values({ ...responses, [currentQuestion]: { feedback: data.feedback } }).map(
          (r: any) => r.feedback.score
        );
        setOverallScore(Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length));
      } else {
        toast.error(data.error || "Failed to get feedback");
      }
    } catch (error) {
      toast.error("Failed to submit response");
    } finally {
      setLoading(false);
    }
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setResponse("");
      setFeedback(null);
    } else {
      setStep("feedback");
      setTimerActive(false);
    }
  }

  function restart() {
    setStep("setup");
    setQuestions([]);
    setSessionId(null);
    setCurrentQuestion(0);
    setResponse("");
    setFeedback(null);
    setOverallScore(0);
    setResponses({});
    setTimeSpent(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interview Simulator</h1>
        <p className="text-slate-500">Practice with AI-generated interview questions and feedback</p>
      </div>

      {step === "setup" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-6 max-w-lg"
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Configure Interview</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Role</label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Senior React Developer"
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {["junior", "mid", "senior", "staff"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      difficulty === d
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Questions: {questionCount}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span><span>5</span><span>10</span>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5" /> Start Interview</>}
            </button>
          </div>
        </motion.div>
      )}

      {step === "interview" && questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-slate-500 font-medium">
              {currentQuestion + 1} / {questions.length}
            </span>
          </div>

          {/* Question Card */}
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className={`badge-premium text-xs capitalize`}>{questions[currentQuestion].type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                difficulty === 'junior' ? 'bg-green-50 text-green-600' :
                difficulty === 'mid' ? 'bg-blue-50 text-blue-600' :
                difficulty === 'senior' ? 'bg-purple-50 text-purple-600' :
                'bg-red-50 text-red-600'
              }`}>
                {questions[currentQuestion].difficulty}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" /> {questions[currentQuestion].timeEstimate}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-4">{questions[currentQuestion].question}</h3>

            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Expected points to cover:</p>
              <ul className="space-y-1">
                {questions[currentQuestion].expectedPoints?.map((point, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
              className="input-premium text-sm resize-none"
              placeholder="Type your response here..."
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={submitResponse}
                disabled={loading || !response.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit</>}
              </button>
            </div>
          </div>

          {/* Feedback Panel */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="card-premium p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  feedback.score >= 80 ? 'bg-emerald-50' : feedback.score >= 60 ? 'bg-amber-50' : 'bg-red-50'
                }`}>
                  <Trophy className={`w-6 h-6 ${
                    feedback.score >= 80 ? 'text-emerald-500' : feedback.score >= 60 ? 'text-amber-500' : 'text-red-500'
                  }`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{feedback.score}/100</p>
                  <p className="text-sm text-slate-500">Your score</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-sm text-emerald-600 mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Strengths
                  </h4>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <Star className="w-3 h-3 text-emerald-500 shrink-0 mt-1" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-amber-600 mb-2 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Areas to Improve
                  </h4>
                  <ul className="space-y-1">
                    {feedback.areasToImprove.map((a, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-amber-500 shrink-0 mt-1" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-sm text-slate-900 mb-2">Model Answer</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{feedback.modelAnswer}</p>
              </div>

              <div className="flex justify-end">
                <button onClick={nextQuestion} className="btn-primary flex items-center gap-2">
                  {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {step === "feedback" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-8 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Complete!</h2>
          <p className="text-slate-500 mb-6">Here's your overall performance</p>

          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full border-4 border-brand-500 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{overallScore}</p>
                <p className="text-xs text-slate-500">Overall Score</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-900">{Object.keys(responses).length}</p>
              <p className="text-xs text-slate-500">Answered</p>
            </div>
          </div>

          <button onClick={restart} className="btn-primary flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Practice Again
          </button>
        </motion.div>
      )}
    </div>
  );
}
