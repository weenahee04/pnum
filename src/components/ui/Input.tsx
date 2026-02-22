"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, "-").toLowerCase();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900
              placeholder:text-slate-400 transition-all duration-200
              focus:outline-none focus:ring-4
              ${icon ? "pl-10" : ""}
              ${
                error
                  ? "border-danger-300 focus:border-danger-500 focus:ring-danger-100"
                  : "border-slate-300 focus:border-primary focus:ring-primary/10"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs font-medium text-danger-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs font-medium text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
