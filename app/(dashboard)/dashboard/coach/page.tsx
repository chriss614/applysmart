"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Send, Sparkles, User, Bot, Loader2, Crown, Zap, Target, Briefcase
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFreePlan] = useState(true); // In real app, check from user context

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    try {
      const res = await fetch("/api/coach");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistic update
    setMessages((prev) => [...prev, {
      id: Date.now(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1] || "";
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        body: JSON.stringify({
          message: userMessage,
          context: { currentRole: "Developer", targetRole: "Senior Engineer" },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        }]);
      } else {
        toast.error(data.error || "Failed to get response");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-500" /> AI Career Coach
          </h1>
          <p className="text-slate-500">Personalized career guidance powered by AI</p>
        </div>
        {isFreePlan && (
          <div className="badge-warning flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" /> Limited on Free Plan
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat */}
        <div className="flex-1 card-premium flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Your AI Career Coach</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Ask me anything about your career — resume tips, interview prep, salary negotiation, career path planning, and more.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {["How do I negotiate salary?", "Resume tips for FAANG", "Interview prep for system design"].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </motion.div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your career coach..."
                className="input-premium flex-1 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-4 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Context Sidebar */}
        <div className="w-64 hidden lg:block card-premium p-4">
          <h3 className="font-semibold text-slate-900 mb-4">Context</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Current: Developer</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Target: Senior Engineer</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">Experience: 3 years</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Topics</h4>
            <div className="space-y-2">
              {["Resume review", "Salary negotiation", "Interview prep", "Career path", "Networking"].map((topic) => (
                <button
                  key={topic}
                  onClick={() => setInput(`Help me with ${topic.toLowerCase()}`)}
                  className="block text-sm text-slate-500 hover:text-brand-600 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
