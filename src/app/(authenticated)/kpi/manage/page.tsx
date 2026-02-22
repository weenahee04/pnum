"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface User {
  id: string;
  name: string;
  department: string;
}

interface KPI {
  id: string;
  title: string;
  description: string | null;
  target: number;
  weight: number;
  period: string;
  user: { name: string };
}

export default function KPIManagePage() {
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    title: "",
    description: "",
    target: "",
    weight: "",
    period: "2026-Q1",
  });

  const fetchData = async () => {
    try {
      const [kpiRes, usersRes] = await Promise.all([
        fetch("/api/kpi?all=true"),
        fetch("/api/users"),
      ]);
      if (kpiRes.ok) {
        const data = await kpiRes.json();
        setKpis(data.kpis || []);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!form.userId || !form.title || !form.target || !form.weight) {
      showToast("warning", "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          title: form.title,
          description: form.description || null,
          target: parseFloat(form.target),
          weight: parseFloat(form.weight),
          period: form.period,
        }),
      });
      if (res.ok) {
        showToast("success", "สร้าง KPI เรียบร้อยแล้ว");
        setShowModal(false);
        setForm({ userId: "", title: "", description: "", target: "", weight: "", period: "2026-Q1" });
        fetchData();
      } else {
        const data = await res.json();
        showToast("error", data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบ KPI นี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/kpi/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "ลบ KPI เรียบร้อยแล้ว");
        fetchData();
      } else {
        showToast("error", "เกิดข้อผิดพลาด");
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">จัดการ KPI</h1>
          <p className="mt-1 text-slate-500 font-medium">กำหนดและจัดการ KPI ของพนักงาน</p>
        </div>
        <Button icon="add" onClick={() => setShowModal(true)}>สร้าง KPI</Button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">พนักงาน</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">KPI</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">เป้าหมาย</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">น้ำหนัก</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">ช่วงเวลา</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {kpis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-slate-300">trending_up</span>
                      <span className="text-sm font-bold text-slate-400">ยังไม่มี KPI</span>
                    </div>
                  </td>
                </tr>
              ) : (
                kpis.map((kpi) => (
                  <tr key={kpi.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700 border-b border-slate-100">{kpi.user.name}</td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{kpi.title}</p>
                      {kpi.description && <p className="text-xs text-slate-400">{kpi.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 border-b border-slate-100">{kpi.target}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 border-b border-slate-100">{kpi.weight}%</td>
                    <td className="px-6 py-4 text-sm text-slate-700 border-b border-slate-100">{kpi.period}</td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <button
                        onClick={() => handleDelete(kpi.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="สร้าง KPI ใหม่"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button icon="save" isLoading={submitting} onClick={handleCreate}>สร้าง KPI</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">พนักงาน</label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
            >
              <option value="">-- เลือกพนักงาน --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </select>
          </div>
          <Input label="ชื่อ KPI" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="เช่น ยอดขายรายเดือน" />
          <Input label="รายละเอียด" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="ไม่บังคับ" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="เป้าหมาย" type="number" step="0.01" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="100" />
            <Input label="น้ำหนัก (%)" type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="25" />
          </div>
          <Input label="ช่วงเวลา" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2026-Q1" />
        </div>
      </Modal>
    </div>
  );
}
