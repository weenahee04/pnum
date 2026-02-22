"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: string;
  isLoading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-800 focus:ring-primary/30",
  secondary:
    "bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary/20",
  outline:
    "border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary focus:ring-primary/10",
  ghost:
    "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-primary focus:ring-primary/10",
  danger:
    "bg-danger-50 text-danger-700 hover:bg-danger-100 border border-danger-100 focus:ring-danger/20",
  success:
    "bg-success-600 text-white shadow-lg shadow-success/20 hover:bg-success-700 focus:ring-success/30",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
};

const iconSizes: Record<string, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-lg font-bold
        transition-all duration-200 focus:outline-none focus:ring-4
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className={`material-symbols-outlined ${iconSizes[size]}`}>
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}
