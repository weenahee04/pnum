"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import BannerCarousel from "@/components/ui/BannerCarousel";
import { useToast } from "@/components/ui/Toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface Stats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  leaveToday: number;
  reportsToday: number;
  activeSurveys: number;
  checkInsToday: number;
  pendingLeaves: number;
  totalPayrolls: number;
  totalEvaluations: number;
  openJobs: number;
  totalApplications: number;
  activeCourses: number;
  totalEnrollments: number;
  weekData: { day: string; count: number }[];
}

interface RecentReport {
  id: string;
  date: string;
  content: string;
  user: { name: string };
}

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#6366f1"];

interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerList, setBannerList] = useState<BannerItem[]>([]);
  const [bannerForm, setBannerForm] = useState({ title: "", imageUrl: "", linkUrl: "" });
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/reports?limit=5"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setRecentReports(data.reports || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const isAdmin = session?.user?.role === "ADMIN";

  const openBannerManage = async () => {
    try {
      const res = await fetch("/api/banners");
      if (res.ok) { const d = await res.json(); setBannerList(d.banners || []); }
    } catch (e) { console.error(e); }
    setShowBannerModal(true);
  };

  const handleAddBanner = async () => {
    if (!bannerForm.title || !bannerForm.imageUrl) { showToast("warning", "กรุณาระบุชื่อและ URL รูปภาพ"); return; }
    setBannerSaving(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bannerForm, order: bannerList.length }),
      });
      if (res.ok) {
        showToast("success", "เพิ่ม Banner เรียบร้อย");
        setBannerForm({ title: "", imageUrl: "", linkUrl: "" });
        const d = await (await fetch("/api/banners")).json();
        setBannerList(d.banners || []);
        setBannerKey((k) => k + 1);
      } else { const d = await res.json(); showToast("error", d.error); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setBannerSaving(false); }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "ลบ Banner เรียบร้อย");
        setBannerList((prev) => prev.filter((b) => b.id !== id));
        setBannerKey((k) => k + 1);
      }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  const toggleBannerActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/banners/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      setBannerList((prev) => prev.map((b) => b.id === id ? { ...b, isActive: !isActive } : b));
      setBannerKey((k) => k + 1);
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  const attendancePieData = stats ? [
    { name: "มาทำงาน", value: stats.presentToday },
    { name: "มาสาย", value: stats.lateToday },
    { name: "ขาด", value: stats.absentToday },
    { name: "ลา", value: stats.leaveToday },
  ].filter((d) => d.value > 0) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Banner Carousel */}
      <BannerCarousel key={bannerKey} isAdmin={isAdmin} onManage={openBannerManage} />

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard แบบเรียลไทม์</h1>
        <p className="mt-1 text-slate-500 font-medium">
          {isAdmin ? "ภาพรวมข้อมูล HR ทั้งหมดในที่เดียว พร้อมรายงานและกราฟวิเคราะห์" : `สวัสดี, ${session?.user?.name}`}
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: "พนักงาน", value: stats?.totalEmployees, icon: "groups", color: "bg-primary", href: "/admin/employees" },
          { label: "เช็คอินวันนี้", value: stats?.checkInsToday, icon: "fingerprint", color: "bg-success", href: "/checkin" },
          { label: "ใบลารออนุมัติ", value: stats?.pendingLeaves, icon: "event_busy", color: "bg-warning", href: "/leave" },
          { label: "ตำแหน่งเปิดรับ", value: stats?.openJobs, icon: "work", color: "bg-info", href: "/recruitment" },
          { label: "หลักสูตรอบรม", value: stats?.activeCourses, icon: "school", color: "bg-purple-500", href: "/training" },
          { label: "การประเมิน", value: stats?.totalEvaluations, icon: "rate_review", color: "bg-rose-500", href: "/evaluation" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <span className="material-symbols-outlined text-white text-lg">{s.icon}</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{s.value ?? 0}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-primary transition-colors">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Check-in Chart */}
        <div className="lg:col-span-2">
          <Card title="การเช็คอินรายสัปดาห์">
            {stats?.weekData && stats.weekData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weekData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Bar dataKey="count" name="เช็คอิน" fill="#003399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-slate-400">ยังไม่มีข้อมูล</div>
            )}
          </Card>
        </div>

        {/* Attendance Pie */}
        <Card title="สถานะพนักงานวันนี้">
          {attendancePieData.length > 0 ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {attendancePieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {attendancePieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-xs text-slate-500">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">ยังไม่มีข้อมูลวันนี้</div>
          )}
        </Card>
      </div>

      {/* Module Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/payroll" className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-primary text-2xl mb-2">payments</span>
          <h3 className="text-sm font-bold text-slate-900 mb-1">เงินเดือน</h3>
          <p className="text-2xl font-black text-primary">{stats?.totalPayrolls ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">สลิปทั้งหมด</p>
        </Link>
        <Link href="/recruitment" className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-success text-2xl mb-2">person_search</span>
          <h3 className="text-sm font-bold text-slate-900 mb-1">สรรหาบุคลากร</h3>
          <p className="text-2xl font-black text-success">{stats?.totalApplications ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">ผู้สมัครทั้งหมด</p>
        </Link>
        <Link href="/training" className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-purple-600 text-2xl mb-2">school</span>
          <h3 className="text-sm font-bold text-slate-900 mb-1">ฝึกอบรม</h3>
          <p className="text-2xl font-black text-purple-600">{stats?.totalEnrollments ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">การลงทะเบียน</p>
        </Link>
        <Link href="/surveys" className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl border border-amber-100 hover:shadow-md transition-shadow">
          <span className="material-symbols-outlined text-warning text-2xl mb-2">quiz</span>
          <h3 className="text-sm font-bold text-slate-900 mb-1">แบบประเมิน</h3>
          <p className="text-2xl font-black text-warning">{stats?.activeSurveys ?? 0}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase">แบบประเมินที่เปิดอยู่</p>
        </Link>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="รายงานล่าสุด">
          {recentReports.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="material-symbols-outlined text-4xl text-slate-300">description</span>
              <span className="text-sm font-bold text-slate-400">ยังไม่มีรายงาน</span>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{report.user.name}</span>
                      <span className="text-xs text-slate-400">{report.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">{report.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="สถานะวันนี้">
          <div className="space-y-4">
            {[
              { label: "เช็คอินวันนี้", value: `${stats?.checkInsToday ?? 0} คน`, variant: "success" as const, hasDot: true },
              { label: "รายงานวันนี้", value: `${stats?.reportsToday ?? 0} รายงาน`, variant: "info" as const, hasDot: false },
              { label: "มาทำงาน", value: `${stats?.presentToday ?? 0} คน`, variant: "success" as const, hasDot: true },
              { label: "มาสาย", value: `${stats?.lateToday ?? 0} คน`, variant: "warning" as const, hasDot: true },
              { label: "ขาด/ลา", value: `${(stats?.absentToday ?? 0) + (stats?.leaveToday ?? 0)} คน`, variant: "danger" as const, hasDot: true },
              { label: "ใบลารออนุมัติ", value: `${stats?.pendingLeaves ?? 0} ใบ`, variant: "warning" as const, hasDot: true },
              { label: "แบบประเมินเปิดอยู่", value: `${stats?.activeSurveys ?? 0}`, variant: "primary" as const, hasDot: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                <Badge variant={item.variant} hasDot={item.hasDot}>{item.value}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Banner Management Modal (Admin) */}
      <Modal isOpen={showBannerModal} onClose={() => setShowBannerModal(false)} title="จัดการ Banner"
        footer={<Button variant="ghost" onClick={() => setShowBannerModal(false)}>ปิด</Button>}>
        <div className="space-y-6">
          {/* Add new banner */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900">เพิ่ม Banner ใหม่</h3>
            <Input label="ชื่อ Banner" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} placeholder="เช่น ประกาศวันหยุดปีใหม่" required />
            <Input label="URL รูปภาพ" value={bannerForm.imageUrl} onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} placeholder="https://example.com/banner.jpg" required />
            <Input label="ลิงก์เมื่อคลิก (ไม่บังคับ)" value={bannerForm.linkUrl} onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} placeholder="https://..." />
            <Button icon="add" size="sm" isLoading={bannerSaving} onClick={handleAddBanner}>เพิ่ม Banner</Button>
          </div>

          {/* Existing banners */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Banner ทั้งหมด ({bannerList.length})</h3>
            {bannerList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">ยังไม่มี Banner</p>
            ) : (
              <div className="space-y-2">
                {bannerList.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <img src={b.imageUrl} alt={b.title} className="w-20 h-12 object-cover rounded-lg flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='48'%3E%3Crect fill='%23e2e8f0' width='80' height='48'/%3E%3C/svg%3E"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{b.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{b.imageUrl}</p>
                    </div>
                    <button onClick={() => toggleBannerActive(b.id, b.isActive)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${b.isActive ? "bg-primary" : "bg-slate-300"}`}>
                      <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                        style={{ left: b.isActive ? "22px" : "2px" }} />
                    </button>
                    <button onClick={() => handleDeleteBanner(b.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
