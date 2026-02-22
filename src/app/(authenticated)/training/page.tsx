"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string;
  category: string;
  duration: string;
  maxSeats: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  _count: { enrollments: number };
}

interface Enrollment {
  id: string;
  status: string;
  score: number | null;
  completedAt: string | null;
  course: { title: string; instructor: string; category: string };
}

const categoryLabels: Record<string, string> = {
  GENERAL: "ทั่วไป", TECHNICAL: "เทคนิค", SOFT_SKILL: "Soft Skill", COMPLIANCE: "กฎระเบียบ",
};

const statusConfig: Record<string, { label: string; variant: "neutral" | "primary" | "warning" | "success" | "danger" }> = {
  UPCOMING: { label: "เร็วๆ นี้", variant: "primary" },
  IN_PROGRESS: { label: "กำลังดำเนินการ", variant: "warning" },
  COMPLETED: { label: "เสร็จสิ้น", variant: "success" },
  CANCELLED: { label: "ยกเลิก", variant: "danger" },
  ENROLLED: { label: "ลงทะเบียน", variant: "primary" },
  DROPPED: { label: "ถอน", variant: "danger" },
};

export default function TrainingPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", instructor: "", category: "GENERAL", duration: "", maxSeats: "30", startDate: "", endDate: "" });

  const fetchData = useCallback(async () => {
    try {
      const [cRes, eRes] = await Promise.all([fetch("/api/training"), fetch("/api/training/enrollments")]);
      if (cRes.ok) { const d = await cRes.json(); setCourses(d.courses || []); }
      if (eRes.ok) { const d = await eRes.json(); setEnrollments(d.enrollments || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.title || !form.instructor) { showToast("warning", "กรุณากรอกข้อมูลให้ครบ"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/training", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, maxSeats: parseInt(form.maxSeats) || 30 }),
      });
      if (res.ok) {
        showToast("success", "สร้างหลักสูตรเรียบร้อย");
        setShowModal(false); setForm({ title: "", description: "", instructor: "", category: "GENERAL", duration: "", maxSeats: "30", startDate: "", endDate: "" });
        fetchData();
      } else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setSubmitting(false); }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const res = await fetch("/api/training/enrollments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) { showToast("success", "ลงทะเบียนเรียบร้อย"); fetchData(); }
      else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const enrolledIds = new Set(enrollments.map((e) => e.course.title));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ระบบฝึกอบรม</h1>
          <p className="mt-1 text-slate-500 font-medium">จัดการหลักสูตรฝึกอบรม ติดตามผลการเรียนรู้และพัฒนาทักษะพนักงาน</p>
        </div>
        {isAdmin && <Button icon="add" onClick={() => setShowModal(true)}>สร้างหลักสูตร</Button>}
      </div>

      {/* My Enrollments */}
      {!isAdmin && enrollments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">หลักสูตรของฉัน</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((e) => {
              const sc = statusConfig[e.status] || { label: e.status, variant: "neutral" as const };
              return (
                <div key={e.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">{e.course.title}</h3>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">ผู้สอน: {e.course.instructor}</p>
                  <p className="text-xs text-slate-400">{categoryLabels[e.course.category] || e.course.category}</p>
                  {e.score !== null && <p className="text-xs font-bold text-primary mt-2">คะแนน: {e.score}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Courses */}
      <h2 className="text-lg font-bold text-slate-900 mb-4">หลักสูตรทั้งหมด</h2>
      {courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="material-symbols-outlined text-4xl text-slate-300">school</span>
          <span className="text-sm font-bold text-slate-400">ยังไม่มีหลักสูตร</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => {
            const sc = statusConfig[c.status] || { label: c.status, variant: "neutral" as const };
            const isEnrolled = enrolledIds.has(c.title);
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={sc.variant}>{sc.label}</Badge>
                  <span className="text-xs text-slate-400">{categoryLabels[c.category] || c.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{c.title}</h3>
                {c.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description}</p>}
                <div className="space-y-1 text-xs text-slate-400 mb-4">
                  <p>👨‍🏫 {c.instructor}</p>
                  {c.duration && <p>⏱️ {c.duration}</p>}
                  {c.startDate && <p>📅 {c.startDate} → {c.endDate || "ไม่ระบุ"}</p>}
                  <p>👥 {c._count.enrollments} / {c.maxSeats} คน</p>
                </div>
                {!isAdmin && c.status !== "CANCELLED" && c.status !== "COMPLETED" && (
                  isEnrolled ? (
                    <span className="text-xs font-bold text-success"><span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>ลงทะเบียนแล้ว</span>
                  ) : c._count.enrollments < c.maxSeats ? (
                    <Button variant="outline" size="sm" icon="how_to_reg" onClick={() => handleEnroll(c.id)}>ลงทะเบียน</Button>
                  ) : (
                    <span className="text-xs font-bold text-danger">เต็มแล้ว</span>
                  )
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="สร้างหลักสูตรใหม่"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button><Button icon="save" isLoading={submitting} onClick={handleCreate}>สร้าง</Button></>}>
        <div className="space-y-4">
          <Input label="ชื่อหลักสูตร" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น React Advanced" required />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียด</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" />
          </div>
          <Input label="ผู้สอน" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">หมวดหมู่</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Input label="ระยะเวลา" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="8 ชั่วโมง" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="วันเริ่ม" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="วันสิ้นสุด" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Input label="จำนวนที่นั่ง" type="number" value={form.maxSeats} onChange={(e) => setForm({ ...form, maxSeats: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
