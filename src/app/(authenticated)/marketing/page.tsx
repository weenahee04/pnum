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

interface CampaignMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  spent: number;
  ctr: number;
  cpc: number;
  roas: number;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  createdBy: { name: string };
  metrics: CampaignMetric[];
  _count: { metrics: number; insights: number };
}

const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  FACEBOOK: { label: "Facebook", color: "bg-blue-100 text-blue-700", icon: "campaign" },
  GOOGLE: { label: "Google Ads", color: "bg-red-100 text-red-700", icon: "ads_click" },
  TIKTOK: { label: "TikTok", color: "bg-slate-900 text-white", icon: "play_circle" },
  LINE: { label: "LINE Ads", color: "bg-green-100 text-green-700", icon: "chat" },
  INSTAGRAM: { label: "Instagram", color: "bg-pink-100 text-pink-700", icon: "photo_camera" },
  YOUTUBE: { label: "YouTube", color: "bg-red-100 text-red-700", icon: "smart_display" },
  OTHER: { label: "อื่นๆ", color: "bg-slate-100 text-slate-700", icon: "language" },
};

const typeLabels: Record<string, string> = {
  AWARENESS: "Brand Awareness",
  TRAFFIC: "Traffic",
  ENGAGEMENT: "Engagement",
  LEADS: "Lead Generation",
  SALES: "Sales/Conversion",
  RETARGETING: "Retargeting",
};

const statusConfig: Record<string, { label: string; variant: "neutral" | "success" | "warning" | "danger" | "primary" }> = {
  DRAFT: { label: "ร่าง", variant: "neutral" },
  ACTIVE: { label: "กำลังทำงาน", variant: "success" },
  PAUSED: { label: "หยุดชั่วคราว", variant: "warning" },
  COMPLETED: { label: "เสร็จสิ้น", variant: "primary" },
  CANCELLED: { label: "ยกเลิก", variant: "danger" },
};

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MarketingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", platform: "FACEBOOK", type: "AWARENESS",
    objective: "", targetAudience: "", budget: "",
    startDate: "", endDate: "", landingUrl: "", notes: "",
  });

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/marketing");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleCreate = async () => {
    if (!form.name.trim()) { showToast("warning", "กรุณาระบุชื่อแคมเปญ"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0 }),
      });
      if (res.ok) {
        showToast("success", "สร้างแคมเปญเรียบร้อย");
        setForm({ name: "", platform: "FACEBOOK", type: "AWARENESS", objective: "", targetAudience: "", budget: "", startDate: "", endDate: "", landingUrl: "", notes: "" });
        setShowModal(false);
        fetchCampaigns();
      } else {
        const d = await res.json();
        showToast("error", d.error);
      }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบแคมเปญนี้?")) return;
    try {
      const res = await fetch(`/api/marketing/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "ลบแคมเปญเรียบร้อย");
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/marketing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast("success", "อัพเดทสถานะเรียบร้อย");
        fetchCampaigns();
      }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  // Aggregate stats
  const totalBudget = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalImpressions = campaigns.reduce((s, c) => s + c.metrics.reduce((ms, m) => ms + m.impressions, 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.metrics.reduce((ms, m) => ms + m.clicks, 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.metrics.reduce((ms, m) => ms + m.conversions, 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.metrics.reduce((ms, m) => ms + m.revenue, 0), 0);
  const overallRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marketing Analytics</h1>
          <p className="mt-1 text-slate-500 font-medium">วิเคราะห์แคมเปญโฆษณา วัดผล ROI และรับคำแนะนำอัจฉริยะ</p>
        </div>
        <Button icon="add" onClick={() => setShowModal(true)}>สร้างแคมเปญ</Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon="campaign" iconBg="bg-primary" label="แคมเปญทำงาน" value={`${activeCampaigns} / ${campaigns.length}`} />
        <StatCard icon="payments" iconBg="bg-amber-500" label="งบใช้ไป" value={`${fmt(totalSpent)} บาท`} sub={totalBudget > 0 ? `จาก ${fmt(totalBudget)} บาท (${((totalSpent / totalBudget) * 100).toFixed(0)}%)` : undefined} />
        <StatCard icon="visibility" iconBg="bg-blue-500" label="Impressions" value={fmt(totalImpressions)} sub={`${fmt(totalClicks)} คลิก`} />
        <StatCard icon="trending_up" iconBg={overallRoas >= 1 ? "bg-green-500" : "bg-red-500"} label="ROAS รวม" value={`${fmtDec(overallRoas)}x`} sub={`Revenue ${fmt(totalRevenue)} / ${fmt(totalConversions)} Conv.`} />
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">campaign</span>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-900">ยังไม่มีแคมเปญ</p>
              <p className="text-sm text-slate-500 mt-1">สร้างแคมเปญแรกเพื่อเริ่มวิเคราะห์ผลโฆษณา</p>
            </div>
            <Button icon="add" onClick={() => setShowModal(true)}>สร้างแคมเปญแรก</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const pf = platformConfig[campaign.platform] || platformConfig.OTHER;
            const st = statusConfig[campaign.status] || statusConfig.DRAFT;
            const mets = campaign.metrics;
            const cImpressions = mets.reduce((s, m) => s + m.impressions, 0);
            const cClicks = mets.reduce((s, m) => s + m.clicks, 0);
            const cConversions = mets.reduce((s, m) => s + m.conversions, 0);
            const cRevenue = mets.reduce((s, m) => s + m.revenue, 0);
            const cRoas = campaign.spent > 0 ? cRevenue / campaign.spent : 0;
            const cCtr = cImpressions > 0 ? (cClicks / cImpressions) * 100 : 0;
            const budgetPct = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

            return (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => router.push(`/marketing/${campaign.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${pf.color} flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-lg">{pf.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">{campaign.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{pf.label}</span>
                          <span className="text-xs text-slate-300">|</span>
                          <span className="text-xs text-slate-400">{typeLabels[campaign.type] || campaign.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        {campaign.status === "DRAFT" && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(campaign.id, "ACTIVE"); }} className="p-1 rounded text-green-500 hover:bg-green-50" title="เริ่มทำงาน">
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                          </button>
                        )}
                        {campaign.status === "ACTIVE" && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(campaign.id, "PAUSED"); }} className="p-1 rounded text-amber-500 hover:bg-amber-50" title="หยุดชั่วคราว">
                            <span className="material-symbols-outlined text-sm">pause</span>
                          </button>
                        )}
                        {campaign.status === "PAUSED" && (
                          <button onClick={(e) => { e.stopPropagation(); handleStatusChange(campaign.id, "ACTIVE"); }} className="p-1 rounded text-green-500 hover:bg-green-50" title="เริ่มทำงานต่อ">
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(campaign.id); }} className="p-1 rounded text-red-400 hover:bg-red-50" title="ลบ">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
                    <MiniStat label="Impressions" value={fmt(cImpressions)} />
                    <MiniStat label="Clicks" value={fmt(cClicks)} />
                    <MiniStat label="CTR" value={`${cCtr.toFixed(2)}%`} color={cCtr > 1.5 ? "text-green-600" : cCtr > 0.5 ? "text-amber-600" : "text-red-600"} />
                    <MiniStat label="Conversions" value={fmt(cConversions)} />
                    <MiniStat label="ROAS" value={`${fmtDec(cRoas)}x`} color={cRoas >= 1 ? "text-green-600" : "text-red-600"} />
                    <MiniStat label="ใช้งบ" value={`${fmt(campaign.spent)}`} sub={campaign.budget > 0 ? `/ ${fmt(campaign.budget)}` : undefined} />
                  </div>

                  {/* Budget Progress */}
                  {campaign.budget > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 60 ? "bg-amber-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(budgetPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="สร้างแคมเปญใหม่"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button icon="add" isLoading={saving} onClick={handleCreate}>สร้างแคมเปญ</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="ชื่อแคมเปญ" icon="campaign" placeholder="เช่น Summer Sale 2026" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">แพลตฟอร์ม</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {Object.entries(platformConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">ประเภทแคมเปญ</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <Input label="วัตถุประสงค์" icon="flag" placeholder="เช่น เพิ่มยอดขายสินค้าใหม่ 30%" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
          <Input label="กลุ่มเป้าหมาย" icon="group" placeholder="เช่น ผู้หญิง 25-45 ปี สนใจแฟชั่น" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
          <Input label="งบประมาณ (บาท)" icon="payments" type="number" placeholder="เช่น 50000" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="วันเริ่ม" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="วันสิ้นสุด" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>

          <Input label="Landing Page URL" icon="link" placeholder="https://example.com/promo" value={form.landingUrl} onChange={(e) => setForm({ ...form, landingUrl: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, sub }: { icon: string; iconBg: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center mb-2`}>
        <span className="material-symbols-outlined text-white text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className={`text-sm font-black ${color || "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}
