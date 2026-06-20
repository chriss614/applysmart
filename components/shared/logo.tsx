"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
}

export default function Logo({ size = "md", gradient = true }: LogoProps) {
  const sizes = {
    sm: { icon: "w-5 h-5", text: "text-lg" },
    md: { icon: "w-6 h-6", text: "text-xl" },
    lg: { icon: "w-8 h-8", text: "text-2xl" },
  };

  return (
    <Link href="/" className="flex items-center gap-2">
      <Sparkles className={`${sizes[size].icon} text-brand-500`} />
      <span className={`font-bold ${sizes[size].text} ${gradient ? "gradient-text" : "text-slate-900"}`}>
        ApplySmart
      </span>
    </Link>
  );
}
