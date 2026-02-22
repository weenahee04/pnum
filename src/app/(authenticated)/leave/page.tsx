"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
  user?: { name: string };
  approvedBy?: { name: string } | null;
}

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
}

const typeLabels: Record<string, string> = {
  SICK: "ลาป่วย", PERSONAL: "ลากิจ", VACATION: "ลาพักร้อน", MATERNITY: "ลาคลอด", OTHER: "อื่นๆ",
};

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "danger" }> = {
  PENDING: { label: "รออนุมัติ", variant: "warning" },
  APPROVED: { label: "อนุมัติ", variant: "success" },
  REJECTED: { label: "ไม่อนุมัติ", variant: "danger" },
};

export default function LeavePage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "SICK", startDate: "", endDate: "", reason: "" });

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, balRes] = await Promise.all([
        fetch("/api/leave"),
        fetch("/api/leave/balance"),
      ]);
      if (reqRes.ok) { const d = await reqRes.json(); setRequests(d.requests || []); }
      if (balRes.ok) { const d = await balRes.json(); setBalances(d.balances || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      showToast("warning", "กรุณากรอกข้อมูลให้ครบ"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("success", "ส่งคำขอลาเรียบร้อยแล้ว");
        setShowModal(false); setForm({ type: "SICK", startDate: "", endDate: "", reason: "" });
        fetchData();
      } else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setSubmitting(false); }
  };

  const handleApprove = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) { showToast("success", action === "approve" ? "อนุมัติแล้ว" : "ปฏิเสธแล้ว"); fetchData(); }
      else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">จัดการใบลา</h1>
          <p className="mt-1 text-slate-500 font-medium">อนุมัติใบลาออนไลน์ ตรวจสอบสิทธิ์อัตโนมัติ</p>
        </div>
        {!isAdmin && <Button icon="add" onClick={() => setShowModal(true)}>ขอลา</Button>}
      </div>

      {/* Leave Balances */}
      {!isAdmin && balances.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {balances.map((b) => (
            <div key={b.type} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">{typeLabels[b.type] || b.type}</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-primary">{b.remaining}</span>
                <span className="text-xs text-slate-400 mb-1">/ {b.total} วัน</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${b.total > 0 ? ((b.total - b.remaining) / b.total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests Table */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {isAdmin && <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">พนักงาน</th>}
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">ประเภท</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">วันที่</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">จำนวน</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">เหตุผล</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">สถานะ</th>
                {isAdmin && <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-sm text-slate-400">ยังไม่มีคำขอลา</td></tr>
              ) : requests.map((r) => {
                const sc = statusConfig[r.status] || { label: r.status, variant: "neutral" as const };
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    {isAdmin && <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100">{r.user?.name}</td>}
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">{typeLabels[r.type] || r.type}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">{r.startDate} → {r.endDate}</td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-700 border-b border-slate-100">{r.days} วัน</td>
                    <td className="px-4 py-3 text-sm text-slate-500 border-b border-slate-100 max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-4 py-3 border-b border-slate-100"><Badge variant={sc.variant} hasDot>{sc.label}</Badge></td>
                    {isAdmin && (
                      <td className="px-4 py-3 border-b border-slate-100">
                        {r.status === "PENDING" && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleApprove(r.id, "approve")} className="p-1.5 rounded-lg text-success hover:bg-success-50 transition-colors">
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                            </button>
                            <button onClick={() => handleApprove(r.id, "reject")} className="p-1.5 rounded-lg text-danger hover:bg-danger-50 transition-colors">
                              <span className="material-symbols-outlined text-lg">cancel</span>
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="ขอลา"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button><Button icon="send" isLoading={submitting} onClick={handleSubmit}>ส่งคำขอ</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">ประเภทการลา</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
              {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="วันเริ่มต้น" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="วันสิ้นสุด" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">เหตุผล</label>
            <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" placeholder="ระบุเหตุผลการลา..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}
