"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface KPIProgress {
  id: string;
  currentValue: number;
  note: string | null;
  updatedAt: string;
}

interface KPI {
  id: string;
  title: string;
  description: string | null;
  target: number;
  weight: number;
  period: string;
  progress: KPIProgress[];
  user?: { name: string };
}

export default function KPIPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateModal, setUpdateModal] = useState<KPI | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchKPIs = async () => {
    try {
      const res = await fetch("/api/kpi");
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis || []);
      }
    } catch (err) {
      console.error("Failed to fetch KPIs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const getLatestProgress = (kpi: KPI) => {
    if (!kpi.progress || kpi.progress.length === 0) return 0;
    return kpi.progress[0].currentValue;
  };

  const getProgressPercent = (kpi: KPI) => {
    const current = getLatestProgress(kpi);
    if (kpi.target === 0) return 0;
    return Math.min(Math.round((current / kpi.target) * 100), 100);
  };

  const getOverallScore = () => {
    if (kpis.length === 0) return 0;
    let totalWeightedScore = 0;
    let totalWeight = 0;
    kpis.forEach((kpi) => {
      const percent = getProgressPercent(kpi);
      totalWeightedScore += percent * kpi.weight;
      totalWeight += kpi.weight;
    });
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  };

  const handleUpdateProgress = async () => {
    if (!updateModal || !progressValue) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/kpi/${updateModal.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentValue: parseFloat(progressValue),
          note: progressNote.trim() || null,
        }),
      });
      if (res.ok) {
        showToast("success", "อัปเดตความคืบหน้าเรียบร้อย");
        setUpdateModal(null);
        setProgressValue("");
        setProgressNote("");
        fetchKPIs();
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

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return "text-success";
    if (percent >= 50) return "text-warning";
    return "text-danger";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const overallScore = getOverallScore();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">KPI</h1>
        <p className="mt-1 text-slate-500 font-medium">
          {isAdmin ? "ดูภาพรวม KPI ของทุกคน" : "ติดตามผลงานและเป้าหมายของคุณ"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">คะแนนรวม</span>
            <span className="material-symbols-outlined text-primary">trending_up</span>
          </div>
          <div className={`text-2xl font-black ${getScoreColor(overallScore)}`}>{overallScore}%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">จำนวน KPI</span>
            <span className="material-symbols-outlined text-primary">flag</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">สำเร็จแล้ว</span>
            <span className="material-symbols-outlined text-success">check_circle</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis.filter((k) => getProgressPercent(k) >= 100).length}
          </div>
        </div>
      </div>

      {kpis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="material-symbols-outlined text-4xl text-slate-300">trending_up</span>
          <span className="text-sm font-bold text-slate-400">ยังไม่มี KPI</span>
        </div>
      ) : (
        <div className="space-y-4">
          {kpis.map((kpi) => {
            const percent = getProgressPercent(kpi);
            const current = getLatestProgress(kpi);
            return (
              <Card key={kpi.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{kpi.title}</h3>
                      <Badge variant={percent >= 100 ? "success" : percent >= 50 ? "warning" : "danger"}>
                        {percent}%
                      </Badge>
                    </div>
                    {kpi.description && <p className="text-xs text-slate-500 mt-1">{kpi.description}</p>}
                    {isAdmin && kpi.user && (
                      <p className="text-xs text-slate-400 mt-1">พนักงาน: {kpi.user.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">น้ำหนัก: {kpi.weight}%</p>
                    <p className="text-xs text-slate-400">ช่วงเวลา: {kpi.period}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>ความคืบหน้า: {current} / {kpi.target}</span>
                    <span className={`font-bold ${getScoreColor(percent)}`}>{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent >= 100 ? "bg-success" : percent >= 50 ? "bg-warning" : "bg-danger"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {!isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon="update"
                    onClick={() => {
                      setUpdateModal(kpi);
                      setProgressValue(String(current));
                    }}
                  >
                    อัปเดตความคืบหน้า
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!updateModal}
        onClose={() => setUpdateModal(null)}
        title="อัปเดตความคืบหน้า KPI"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUpdateModal(null)}>ยกเลิก</Button>
            <Button icon="save" isLoading={submitting} onClick={handleUpdateProgress}>บันทึก</Button>
          </>
        }
      >
        {updateModal && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-900">{updateModal.title}</p>
            <p className="text-xs text-slate-500">เป้าหมาย: {updateModal.target}</p>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ค่าปัจจุบัน</label>
              <input
                type="number"
                step="0.01"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">หมายเหตุ</label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
                placeholder="เพิ่มหมายเหตุ... (ไม่บังคับ)"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
