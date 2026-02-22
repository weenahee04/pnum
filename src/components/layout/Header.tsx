"use client";

import React from "react";

interface HeaderProps {
  onMenuToggle: () => void;
  userName?: string;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 lg:ml-72">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-400">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="ค้นหา..."
              className="w-64 pl-10 pr-4 py-2 rounded-full bg-slate-100 text-sm text-slate-700 placeholder:text-slate-400 border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
            <span className="material-symbols-outlined text-xl">
              notifications
            </span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
