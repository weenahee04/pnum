"use client";

import React from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "primary" | "neutral";
  hasDot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-green-100 text-green-700 border-green-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  danger: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
  primary: "bg-primary-50 text-primary-800 border-primary-100",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

const dotColors: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  primary: "bg-primary",
  neutral: "bg-slate-400",
};

export default function Badge({
  variant = "neutral",
  hasDot = false,
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-[11px] font-black uppercase tracking-tight border
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {hasDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
