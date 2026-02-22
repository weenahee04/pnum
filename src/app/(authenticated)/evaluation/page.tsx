"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface User { id: string; name: string; department: string; }

interface EvalRecord {
  id: string;
  period: string;
  type: string;
  overallScore: number;
  strengths: string | null;
  improvements: string | null;
  comments: string | null;
  createdAt: string;
  evaluator: { name: string };
  evaluatee: { name: string };
}

const typeLabels: Record<string, string> = {
  SELF: "ประเมินตนเอง", PEER: "เพื่อนร่วมงาน", MANAGER: "หัวหน้า", SUBORDINATE: "ลูกน้อง",
};

const categories = [
  { key: "quality", label: "คุณภาพงาน" },
  { key: "teamwork", label: "การทำงานเป็นทีม" },
  { key: "communication", label: "การสื่อสาร" },
  { key: "leadership", label: "ภาวะผู้นำ" },
  { key: "initiative", label: "ความคิดริเริ่ม" },
];

export default function EvaluationPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const [evaluations, setEvaluations] = useState<EvalRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    evaluateeId: "", period: "2026-Q1", type: "PEER",
    scores: {} as Record<string, number>,
    strengths: "", improvements: "", comments: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [evalRes, usersRes] = await Promise.all([fetch("/api/evaluation"), fetch("/api/users")]);
      if (evalRes.ok) { const d = await evalRes.json(); setEvaluations(d.evaluations || []); }
      if (usersRes.ok) { const d = await usersRes.json(); setUsers((d.users || []).filter((u: User) => u.id !== session?.user?.id)); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [session?.user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!form.evaluateeId) { showToast("warning", "กรุณาเลือกพนักงาน"); return; }
    const filledScores = Object.values(form.scores).filter((v) => v > 0);
    if (filledScores.length === 0) { showToast("warning", "กรุณาให้คะแนนอย่างน้อย 1 หมวด"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/evaluation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("success", "บันทึกการประเมินเรียบร้อย");
        setShowModal(false);
        setForm({ evaluateeId: "", period: "2026-Q1", type: "PEER", scores: {}, strengths: "", improvements: "", comments: "" });
        fetchData();
      } else { const d = await res.json(); showToast("error", d.error || "เกิดข้อผิดพลาด"); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); } finally { setSubmitting(false); }
  };

  const renderStars = (score: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`material-symbols-outlined text-base ${s <= Math.round(score) ? "text-warning" : "text-slate-200"}`}>star</span>
      ))}
      <span className="text-xs font-bold text-slate-700 ml-1">{score.toFixed(1)}</span>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  // Group evaluations by evaluatee for summary view (admin)
  const summaryMap = new Map<string, { name: string; avgScore: number; count: number }>();
  if (isAdmin) {
    evaluations.forEach((e) => {
      const key = e.evaluatee.name;
      const existing = summaryMap.get(key);
      if (existing) { existing.avgScore = (existing.avgScore * existing.count + e.overallScore) / (existing.count + 1); existing.count++; }
      else summaryMap.set(key, { name: key, avgScore: e.overallScore, count: 1 });
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">ประเมินผลพนักงาน 360°</h1>
          <p className="mt-1 text-slate-500 font-medium">ระบบประเมินผลแบบ 360 องศา พร้อมรายงานวิเคราะห์</p>
        </div>
        <Button icon="rate_review" onClick={() => setShowModal(true)}>ประเมินพนักงาน</Button>
      </div>

      {/* Summary Cards for Admin */}
      {isAdmin && summaryMap.size > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from(summaryMap.values()).map((s) => (
            <div key={s.name} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{s.name}</p>
              </div>
              {renderStars(s.avgScore)}
              <p className="text-xs text-slate-400 mt-1">{s.count} การประเมิน</p>
            </div>
          ))}
        </div>
      )}

      {/* Evaluations List */}
      <div className="space-y-4">
        {evaluations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <span className="material-symbols-outlined text-4xl text-slate-300">rate_review</span>
            <span className="text-sm font-bold text-slate-400">ยังไม่มีการประเมิน</span>
          </div>
        ) : evaluations.map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-900">{e.evaluator.name}</span>
                  <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
                  <span className="text-sm font-bold text-primary">{e.evaluatee.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Badge variant="neutral">{typeLabels[e.type] || e.type}</Badge>
                  <span>ช่วง: {e.period}</span>
                </div>
              </div>
              {renderStars(e.overallScore)}
            </div>
            {(e.strengths || e.improvements || e.comments) && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {e.strengths && <p className="text-xs text-slate-600"><span className="font-bold text-success">จุดแข็ง:</span> {e.strengths}</p>}
                {e.improvements && <p className="text-xs text-slate-600"><span className="font-bold text-warning">ควรปรับปรุง:</span> {e.improvements}</p>}
                {e.comments && <p className="text-xs text-slate-600"><span className="font-bold text-slate-500">ความเห็น:</span> {e.comments}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Evaluation Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="ประเมินพนักงาน"
        footer={<><Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button><Button icon="save" isLoading={submitting} onClick={handleSubmit}>บันทึก</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">เลือกพนักงาน</label>
            <select value={form.evaluateeId} onChange={(e) => setForm({ ...form, evaluateeId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
              <option value="">-- เลือก --</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ช่วงเวลา</label>
              <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
                <option value="2026-Q1">2026 Q1</option><option value="2026-Q2">2026 Q2</option>
                <option value="2026-Q3">2026 Q3</option><option value="2026-Q4">2026 Q4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">ประเภท</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">ให้คะแนน (1-5)</p>
            {categories.map((c) => (
              <div key={c.key} className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm text-slate-600">{c.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} type="button" onClick={() => setForm({ ...form, scores: { ...form.scores, [c.key]: v } })}
                      className={`w-8 h-8 rounded text-xs font-bold transition-all ${form.scores[c.key] === v ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <textarea value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={2} placeholder="จุดแข็ง..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" />
          <textarea value={form.improvements} onChange={(e) => setForm({ ...form, improvements: e.target.value })} rows={2} placeholder="ควรปรับปรุง..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" />
          <textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={2} placeholder="ความเห็นเพิ่มเติม..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none" />
        </div>
      </Modal>
    </div>
  );
}
