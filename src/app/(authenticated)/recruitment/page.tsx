"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  salary: string | null;
  location: string;
  type: string;
  status: string;
  createdAt: string;
  _count: { applications: number };
}

interface JobApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  posting: { title: string };
}

const stageLabels: Record<string, { label: string; variant: "neutral" | "primary" | "warning" | "success" | "danger" }> = {
  APPLIED: { label: "สมัคร", variant: "neutral" },
  SCREENING: { label: "คัดกรอง", variant: "primary" },
  INTERVIEW: { label: "สัมภาษณ์", variant: "warning" },
  OFFER: { label: "เสนอ", variant: "success" },
  HIRED: { label: "รับแล้ว", variant: "success" },
  REJECTED: { label: "ปฏิเสธ", variant: "danger" },
};

const typeLabels: Record<string, string> = {
  FULL_TIME: "เต็มเวลา", PART_TIME: "พาร์ทไทม์", CONTRACT: "สัญญาจ้าง",
};

export default function RecruitmentPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"postings" | "applications">("postings");

  const [postingForm, setPostingForm] = useState({ title: "", department: "", description: "", requirements: "", salary: "", location: "", type: "FULL_TIME" });
  const [applyForm, setApplyForm] = useState({ name: "", email: "", phone: "", coverLetter: "" });

  const fetchData = useCallback(async () => {
    try {
      const [pRes, aRes] = await Promise.all([fetch("/api/recruitment"), fetch("/api/recruitment/applications")]);
      if (pRes.ok) { const d = await pRes.json(); setPostings(d.postings || []); }
      if (aRes.ok) { const d = await aRes.json(); setApplications(d.applications || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreatePosting = async () => {
    if (!postingForm.title || !postingForm.department || !postingForm.description || !postingForm.requirements) {
      showToast("warning", "กรุณากรอกข้อมูลให้ครบ"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recruitment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postingForm),
      });
      if (res.ok) {
        showToast("success", "สร้างประกาศรับสมัครเรียบร้อย");
        setShowPostingModal(false);
        setPostingForm({ title: "", department: "", description: "", requirements: "", salary: "", location: "", type: "FULL_TIME" });
        fetchData();
      } else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setSubmitting(false); }
  };

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email) { showToast("warning", "กรุณากรอกชื่อและอีเมล"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recruitment/applications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...applyForm, postingId: showApplyModal }),
      });
      if (res.ok) {
        showToast("success", "ส่งใบสมัครเรียบร้อย");
        setShowApplyModal(null);
        setApplyForm({ name: "", email: "", phone: "", coverLetter: "" });
        fetchData();
      } else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setSubmitting(false); }
  };

  const handleUpdateStage = async (appId: string, stage: string) => {
    try {
      const res = await fetch(`/api/recruitment/applications/${appId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (res.ok) { showToast("success", "อัปเดตสถานะเรียบร้อย"); fetchData(); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">จัดการสรรหาบุคลากร</h1>
          <p className="mt-1 text-slate-500 font-medium">ระบบรับสมัครงาน คัดกรองผู้สมัคร และติดตามกระบวนการสัมภาษณ์</p>
        </div>
        {isAdmin && <Button icon="add" onClick={() => setShowPostingModal(true)}>สร้างประกาศ</Button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("postings")} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${tab === "postings" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>ตำแหน่งงาน ({postings.length})</button>
        {isAdmin && <button onClick={() => setTab("applications")} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${tab === "applications" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>ผู้สมัคร ({applications.length})</button>}
      </div>

      {tab === "postings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {postings.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center gap-3 py-20">
              <span className="material-symbols-outlined text-4xl text-slate-300">work</span>
              <span className="text-sm font-bold text-slate-400">ยังไม่มีประกาศรับสมัคร</span>
            </div>
          ) : postings.map((p) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-500">{p.department} · {typeLabels[p.type] || p.type}</p>
                </div>
                <Badge variant={p.status === "OPEN" ? "success" : "neutral"} hasDot>{p.status === "OPEN" ? "เปิดรับ" : "ปิดแล้ว"}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                {p.salary && <span>💰 {p.salary}</span>}
                {p.location && <span>📍 {p.location}</span>}
                <span>👥 {p._count.applications} ผู้สมัคร</span>
              </div>
              {p.status === "OPEN" && (
                <Button variant="outline" size="sm" icon="send" onClick={() => setShowApplyModal(p.id)}>สมัครงาน</Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "applications" && isAdmin && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">ชื่อ</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">ตำแหน่ง</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">อีเมล</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">สถานะ</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">ยังไม่มีผู้สมัคร</td></tr>
                ) : applications.map((a) => {
                  const sl = stageLabels[a.stage] || { label: a.stage, variant: "neutral" as const };
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-bold text-slate-900 border-b border-slate-100">{a.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100">{a.posting.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 border-b border-slate-100">{a.email}</td>
                      <td className="px-4 py-3 border-b border-slate-100"><Badge variant={sl.variant}>{sl.label}</Badge></td>
                      <td className="px-4 py-3 border-b border-slate-100">
                        <select value={a.stage} onChange={(e) => handleUpdateStage(a.id, e.target.value)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-primary focus:outline-none">
                          {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Posting Modal */}
      <Modal isOpen={showPostingModal} onClose={() => setShowPostingModal(false)} title="สร้างประกาศรับสมัคร"
        footer={<><Button variant="ghost" onClick={() => setShowPostingModal(false)}>ยกเลิก</Button><Button icon="save" isLoading={submitting} onClick={handleCreatePosting}>สร้าง</Button></>}>
        <div className="space-y-4">
          <Input label="ตำแหน่ง" value={postingForm.title} onChange={(e) => setPostingForm({ ...postingForm, title: e.target.value })} placeholder="Software Developer" required />
          <Input label="แผนก" value={postingForm.department} onChange={(e) => setPostingForm({ ...postingForm, department: e.target.value })} placeholder="Engineering" required />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียด</label>
            <textarea value={postingForm.description} onChange={(e) => setPostingForm({ ...postingForm, description: e.target.value })} rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" placeholder="รายละเอียดงาน..." required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">คุณสมบัติ</label>
            <textarea value={postingForm.requirements} onChange={(e) => setPostingForm({ ...postingForm, requirements: e.target.value })} rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" placeholder="คุณสมบัติที่ต้องการ..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="เงินเดือน" value={postingForm.salary} onChange={(e) => setPostingForm({ ...postingForm, salary: e.target.value })} placeholder="30,000 - 50,000" />
            <Input label="สถานที่" value={postingForm.location} onChange={(e) => setPostingForm({ ...postingForm, location: e.target.value })} placeholder="กรุงเทพฯ" />
          </div>
        </div>
      </Modal>

      {/* Apply Modal */}
      <Modal isOpen={!!showApplyModal} onClose={() => setShowApplyModal(null)} title="สมัครงาน"
        footer={<><Button variant="ghost" onClick={() => setShowApplyModal(null)}>ยกเลิก</Button><Button icon="send" isLoading={submitting} onClick={handleApply}>ส่งใบสมัคร</Button></>}>
        <div className="space-y-4">
          <Input label="ชื่อ-นามสกุล" value={applyForm.name} onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })} required />
          <Input label="อีเมล" type="email" value={applyForm.email} onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })} required />
          <Input label="เบอร์โทร" value={applyForm.phone} onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })} />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">จดหมายสมัครงาน</label>
            <textarea value={applyForm.coverLetter} onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })} rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" placeholder="แนะนำตัวเอง..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
