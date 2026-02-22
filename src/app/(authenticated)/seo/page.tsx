"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface SeoProject {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  createdBy: { name: string };
  _count: { audits: number; keywords: number };
  audits: { score: number; createdAt: string }[];
}

export default function SeoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });
  const [saving, setSaving] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/seo/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      showToast("warning", "กรุณาระบุชื่อและ URL");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/seo/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("success", "สร้างโปรเจคเรียบร้อย");
        setForm({ name: "", url: "" });
        setShowModal(false);
        fetchProjects();
      } else {
        const d = await res.json();
        showToast("error", d.error);
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบโปรเจคนี้?")) return;
    try {
      const res = await fetch(`/api/seo/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "ลบโปรเจคเรียบร้อย");
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 50) return "text-warning";
    return "text-danger";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 50) return "bg-warning";
    return "bg-danger";
  };

  const isAdmin = session?.user?.role === "ADMIN";
  const totalKeywords = projects.reduce((sum, p) => sum + p._count.keywords, 0);
  const avgScore = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.audits[0]?.score || 0), 0) / projects.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">SEO Analyzer</h1>
          <p className="mt-1 text-sm sm:text-base text-slate-500 font-medium">วิเคราะห์ SEO เว็บไซต์ ตรวจสอบ Audit และติดตาม Keyword Rankings</p>
        </div>
        <Button icon="add" onClick={() => setShowModal(true)} className="w-full sm:w-auto flex-shrink-0">สร้างโปรเจค</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white text-lg">folder</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{projects.length}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">โปรเจคทั้งหมด</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center mb-2">
            <span className="material-symbols-outlined text-white text-lg">key</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalKeywords}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Keywords ติดตาม</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className={`w-9 h-9 ${avgScore >= 50 ? "bg-success" : "bg-warning"} rounded-lg flex items-center justify-center mb-2`}>
            <span className="material-symbols-outlined text-white text-lg">speed</span>
          </div>
          <div className={`text-2xl font-black ${avgScore >= 50 ? "text-success" : "text-warning"}`}>{avgScore}</div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">คะแนน SEO เฉลี่ย</p>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">search_insights</span>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">ยังไม่มีโปรเจค SEO</p>
              <p className="text-sm text-slate-500 mt-1">สร้างโปรเจคแรกเพื่อเริ่มวิเคราะห์ SEO เว็บไซต์ของคุณ</p>
            </div>
            <Button icon="add" onClick={() => setShowModal(true)}>สร้างโปรเจคแรก</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const lastScore = project.audits[0]?.score;
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/seo/${project.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{project.url}</p>
                    </div>
                    {lastScore !== undefined && (
                      <div className={`w-12 h-12 rounded-xl ${getScoreBg(lastScore)} flex items-center justify-center flex-shrink-0 ml-3`}>
                        <span className="text-white text-sm font-black">{lastScore}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="primary">{project._count.audits} Audits</Badge>
                    <Badge variant="neutral">{project._count.keywords} Keywords</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      สร้างโดย {project.createdBy.name}
                    </span>
                    {(isAdmin || true) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {lastScore !== undefined && (
                  <div className="px-5 pb-3">
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${getScoreBg(lastScore)}`}
                        style={{ width: `${lastScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="สร้างโปรเจค SEO ใหม่"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button icon="add" isLoading={saving} onClick={handleCreate}>สร้างโปรเจค</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="ชื่อโปรเจค"
            icon="folder"
            placeholder="เช่น เว็บบริษัท ABC"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="URL เว็บไซต์"
            icon="link"
            placeholder="https://example.com"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            required
            helperText="ใส่ URL หลักของเว็บไซต์ที่ต้องการวิเคราะห์"
          />
        </div>
      </Modal>
    </div>
  );
}
