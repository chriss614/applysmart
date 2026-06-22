"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Tag, Send, User } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  tags: string[];
  upvotes: number;
  commentCount: number;
  createdAt: string;
}

export default function DashboardCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTag, setActiveTag] = useState("all");

  const tags = ["all", "Resume Help", "Interview Tips", "Salary Negotiation", "Remote Work", "Career Advice"];

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch("/api/community", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: "general",
          tags: newPostTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        toast.success("Post created successfully!");
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostTags("");
        fetchPosts();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create post");
      }
    } catch (error) {
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredPosts = activeTag === "all" 
    ? posts 
    : posts.filter((p) => p.tags.includes(activeTag));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Community</h1>
        <p className="text-slate-500">Share experiences, ask questions, and help others succeed.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">Create a Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Post title..."
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <textarea
            placeholder="What's on your mind?"
            rows={3}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={newPostTags}
            onChange={(e) => setNewPostTags(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newPostTitle.trim() || !newPostContent.trim()}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              activeTag === tag
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tag === "all" ? "All Posts" : tag}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading posts...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No posts yet. Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{post.author}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{post.title}</h3>
              <p className="text-slate-600 text-sm mb-3 line-clamp-3">{post.content}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{post.upvotes}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.commentCount}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
