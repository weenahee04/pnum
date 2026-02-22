"use client";

import React from "react";

interface CardProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  action,
  footer,
  noPadding = false,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          {title && (
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
