"use client";

import { cn } from "@/lib/utils";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradientBorder?: boolean;
}

export default function PremiumCard({ children, className, hover = true, gradientBorder = false }: PremiumCardProps) {
  return (
    <div className={cn(
      "bg-white/90 backdrop-blur-[14px] rounded-2xl border",
      gradientBorder ? "border-transparent bg-gradient-to-br from-white/90 to-white/80 p-[1px]" : "border-white/60",
      hover && "hover:shadow-[0_12px_40px_rgba(15,23,42,0.12)] transition-shadow duration-300",
      className
    )}>
      <div className={cn(
        "rounded-2xl h-full",
        gradientBorder && "bg-white/90 backdrop-blur-[14px] p-5"
      )}>
        {children}
      </div>
    </div>
  );
}
