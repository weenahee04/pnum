"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  createdAt: string;
}

export default function AdminEmployeesPage() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "",
    position: "",
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      showToast("warning", "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("success", "เพิ่มพนักงานเรียบร้อยแล้ว");
        setShowModal(false);
        setForm({ name: "", email: "", password: "", role: "EMPLOYEE", department: "", position: "" });
        fetchEmployees();
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
    if (!confirm("ต้องการลบพนักงานนี้หรือไม่?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "ลบพนักงานเรียบร้อยแล้ว");
        fetchEmployees();
      } else {
        const data = await res.json();
        showToast("error", data.error || "เกิดข้อผิดพลาด");
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">จัดการพนักงาน</h1>
          <p className="mt-1 text-slate-500 font-medium">เพิ่ม แก้ไข และจัดการข้อมูลพนักงาน</p>
        </div>
        <Button icon="person_add" onClick={() => setShowModal(true)}>เพิ่มพนักงาน</Button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">ชื่อ</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">อีเมล</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">แผนก</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">ตำแหน่ง</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">บทบาท</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-slate-300">groups</span>
                      <span className="text-sm font-bold text-slate-400">ยังไม่มีพนักงาน</span>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-sm">person</span>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">{emp.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">{emp.department || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 border-b border-slate-100">{emp.position || "-"}</td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <Badge variant={emp.role === "ADMIN" ? "primary" : "neutral"}>
                        {emp.role === "ADMIN" ? "ผู้ดูแล" : "พนักงาน"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <button
                        onClick={() => handleDelete(emp.id)}
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
        title="เพิ่มพนักงานใหม่"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button icon="person_add" isLoading={submitting} onClick={handleCreate}>เพิ่มพนักงาน</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="ชื่อ-นามสกุล" icon="person" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="สมชาย ใจดี" required />
          <Input label="อีเมล" icon="mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" required />
          <Input label="รหัสผ่าน" icon="lock" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">บทบาท</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
            >
              <option value="EMPLOYEE">พนักงาน</option>
              <option value="ADMIN">ผู้ดูแลระบบ</option>
            </select>
          </div>
          <Input label="แผนก" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
          <Input label="ตำแหน่ง" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Software Developer" />
        </div>
      </Modal>
    </div>
  );
}
