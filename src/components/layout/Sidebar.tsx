"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  icon: string;
  href: string;
  adminOnly?: boolean;
}

const mainMenu: MenuItem[] = [
  { label: "แดชบอร์ด", icon: "dashboard", href: "/dashboard" },
  { label: "ลงเวลาอัจฉริยะ", icon: "fingerprint", href: "/checkin" },
  { label: "จัดการใบลา", icon: "event_busy", href: "/leave" },
  { label: "ขาด/ลา/มาสาย", icon: "event_available", href: "/attendance" },
  { label: "รายงานประจำวัน", icon: "description", href: "/reports" },
];

const hrMenu: MenuItem[] = [
  { label: "คำนวณเงินเดือน", icon: "payments", href: "/payroll" },
  { label: "สรรหาบุคลากร", icon: "person_search", href: "/recruitment" },
  { label: "ฝึกอบรม", icon: "school", href: "/training" },
  { label: "SEO Analyzer", icon: "search_insights", href: "/seo" },
  { label: "แจ้งเตือน LINE", icon: "notifications", href: "/line-notify" },
];

const evaluationMenu: MenuItem[] = [
  { label: "ประเมิน 360°", icon: "rate_review", href: "/evaluation" },
  { label: "แบบประเมิน", icon: "quiz", href: "/surveys" },
  { label: "KPI", icon: "trending_up", href: "/kpi" },
];

const adminMenu: MenuItem[] = [
  { label: "จัดการพนักงาน", icon: "person_add", href: "/admin/employees", adminOnly: true },
  { label: "จัดการ KPI", icon: "admin_panel_settings", href: "/kpi/manage", adminOnly: true },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const NavItem = ({ item }: { item: MenuItem }) => (
    <Link
      href={item.href}
      onClick={onClose}
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200
        ${
          isActive(item.href)
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "text-slate-500 hover:bg-primary-50 hover:text-primary"
        }
      `}
    >
      <span className="material-symbols-outlined text-lg">{item.icon}</span>
      {item.label}
    </Link>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <p className="px-4 pt-6 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
      {title}
    </p>
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-slate-200 
          flex flex-col transition-transform duration-300
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                corporate_fare
              </span>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                HR System
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Management
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2">
          <SectionTitle title="เมนูหลัก" />
          <div className="space-y-1">
            {mainMenu.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <SectionTitle title="บริหารงาน HR" />
          <div className="space-y-1">
            {hrMenu.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <SectionTitle title="ประเมินผล" />
          <div className="space-y-1">
            {evaluationMenu.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          {user.role === "ADMIN" && (
            <>
              <SectionTitle title="ผู้ดูแลระบบ" />
              <div className="space-y-1">
                {adminMenu.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">
                  person
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "พนักงาน"}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition-colors"
                title="ออกจากระบบ"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
