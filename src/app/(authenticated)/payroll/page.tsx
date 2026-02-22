"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PayrollRecord {
  id: string;
  month: string;
  baseSalary: number;
  otHours: number;
  otAmount: number;
  bonus: number;
  allowance: number;
  deduction: number;
  socialSecurity: number;
  tax: number;
  netSalary: number;
  status: string;
  user?: { name: string; department: string };
}

const statusConfig: Record<string, { label: string; variant: "neutral" | "warning" | "success" }> = {
  DRAFT: { label: "ร่าง", variant: "neutral" },
  CONFIRMED: { label: "ยืนยันแล้ว", variant: "warning" },
  PAID: { label: "จ่ายแล้ว", variant: "success" },
};

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PayrollPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [detail, setDetail] = useState<PayrollRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll");
      if (res.ok) { const d = await res.json(); setRecords(d.records || []); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/payroll/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      if (res.ok) { showToast("success", "สร้างสลิปเงินเดือนเรียบร้อย"); setShowModal(false); fetchData(); }
      else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setSubmitting(false); }
  };

  const handleConfirm = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      if (res.ok) { showToast("success", "ยืนยันเรียบร้อย"); fetchData(); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });
      if (res.ok) { showToast("success", "บันทึกการจ่ายเรียบร้อย"); fetchData(); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">คำนวณเงินเดือน</h1>
          <p className="mt-1 text-slate-500 font-medium">คำนวณเงินเดือน OT โบนัส หักภาษี ประกันสังคม สร้างสลิปอัตโนมัติ</p>
        </div>
        {isAdmin && <Button icon="calculate" onClick={() => setShowModal(true)}>สร้างสลิปเงินเดือน</Button>}
      </div>

      {/* Summary Cards */}
      {isAdmin && records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">เงินเดือนรวม</p>
            <p className="text-2xl font-black text-primary">฿{fmt(records.reduce((s, r) => s + r.netSalary, 0))}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">จำนวนสลิป</p>
            <p className="text-2xl font-black text-slate-900">{records.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">จ่ายแล้ว</p>
            <p className="text-2xl font-black text-success">{records.filter((r) => r.status === "PAID").length}</p>
          </div>
        </div>
      )}

      {/* Records */}
      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {isAdmin && <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">พนักงาน</th>}
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">เดือน</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-right">เงินเดือน</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-right">OT</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-right">หัก</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-right">สุทธิ</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">สถานะ</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-sm text-slate-400">ยังไม่มีข้อมูลเงินเดือน</td></tr>
              ) : records.map((r) => {
                const sc = statusConfig[r.status] || { label: r.status, variant: "neutral" as const };
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    {isAdmin && <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100">{r.user?.name}</td>}
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">{r.month}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 text-right">฿{fmt(r.baseSalary)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 text-right">฿{fmt(r.otAmount)}</td>
                    <td className="px-4 py-3 text-sm text-danger border-b border-slate-100 text-right">-฿{fmt(r.deduction + r.socialSecurity + r.tax)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-primary border-b border-slate-100 text-right">฿{fmt(r.netSalary)}</td>
                    <td className="px-4 py-3 border-b border-slate-100"><Badge variant={sc.variant} hasDot>{sc.label}</Badge></td>
                    <td className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDetail(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary-50 transition-colors">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        {isAdmin && r.status === "DRAFT" && (
                          <button onClick={() => handleConfirm(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-warning hover:bg-warning-50 transition-colors">
                            <span className="material-symbols-outlined text-lg">check</span>
                          </button>
                        )}
                        {isAdmin && r.status === "CONFIRMED" && (
                          <button onClick={() => handlePay(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-success hover:bg-success-50 transition-colors">
                            <span className="material-symbols-outlined text-lg">paid</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="สร้างสลิปเงินเดือน"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button><Button icon="calculate" isLoading={submitting} onClick={handleGenerate}>สร้างสลิป</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">เดือน</label>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none" />
          </div>
          <p className="text-xs text-slate-500">ระบบจะคำนวณเงินเดือนให้พนักงานทุกคนโดยอัตโนมัติ รวมถึง OT, โบนัส, หักภาษี และประกันสังคม</p>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="สลิปเงินเดือน"
        footer={<Button variant="ghost" onClick={() => setDetail(null)}>ปิด</Button>}>
        {detail && (
          <div className="space-y-3">
            {isAdmin && <p className="text-sm font-bold text-slate-900">{detail.user?.name} — {detail.user?.department}</p>}
            <p className="text-xs text-slate-500">เดือน: {detail.month}</p>
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">เงินเดือนพื้นฐาน</span><span className="font-bold">฿{fmt(detail.baseSalary)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">OT ({detail.otHours} ชม.)</span><span className="font-bold text-success">+฿{fmt(detail.otAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">โบนัส</span><span className="font-bold text-success">+฿{fmt(detail.bonus)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">เบี้ยเลี้ยง</span><span className="font-bold text-success">+฿{fmt(detail.allowance)}</span></div>
              <div className="border-t border-slate-100 pt-2" />
              <div className="flex justify-between text-sm"><span className="text-slate-500">หักอื่นๆ</span><span className="font-bold text-danger">-฿{fmt(detail.deduction)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">ประกันสังคม</span><span className="font-bold text-danger">-฿{fmt(detail.socialSecurity)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">ภาษี</span><span className="font-bold text-danger">-฿{fmt(detail.tax)}</span></div>
              <div className="border-t-2 border-primary pt-2" />
              <div className="flex justify-between text-base"><span className="font-bold text-slate-900">เงินเดือนสุทธิ</span><span className="font-black text-primary">฿{fmt(detail.netSalary)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
