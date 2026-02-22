"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface Metric {
  id: string; date: string; impressions: number; reach: number; clicks: number;
  ctr: number; cpc: number; cpm: number; conversions: number; conversionRate: number;
  costPerConversion: number; revenue: number; roas: number; spent: number;
  engagement: number; videoViews: number; leads: number;
}

interface Insight {
  id: string; type: string; category: string; title: string;
  description: string; priority: string; actionable: boolean; isRead: boolean;
}

interface Campaign {
  id: string; name: string; platform: string; type: string; status: string;
  objective: string | null; targetAudience: string | null;
  budget: number; spent: number; startDate: string | null; endDate: string | null;
  landingUrl: string | null; notes: string | null;
  createdBy: { name: string }; metrics: Metric[]; insights: Insight[];
}

const platformLabels: Record<string, string> = {
  FACEBOOK: "Facebook", GOOGLE: "Google Ads", TIKTOK: "TikTok",
  LINE: "LINE Ads", INSTAGRAM: "Instagram", YOUTUBE: "YouTube", OTHER: "อื่นๆ",
};

const typeLabels: Record<string, string> = {
  AWARENESS: "Brand Awareness", TRAFFIC: "Traffic", ENGAGEMENT: "Engagement",
  LEADS: "Lead Generation", SALES: "Sales/Conversion", RETARGETING: "Retargeting",
};

const insightTypeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  RECOMMENDATION: { icon: "lightbulb", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  WARNING: { icon: "warning", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  OPPORTUNITY: { icon: "rocket_launch", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  PERFORMANCE: { icon: "emoji_events", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
};

const priorityConfig: Record<string, { label: string; variant: "danger" | "warning" | "neutral" }> = {
  HIGH: { label: "สำคัญมาก", variant: "danger" },
  MEDIUM: { label: "ปานกลาง", variant: "warning" },
  LOW: { label: "ทั่วไป", variant: "neutral" },
};

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type TabType = "overview" | "metrics" | "insights";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("overview");
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [savingMetric, setSavingMetric] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const [metricForm, setMetricForm] = useState({
    date: today, impressions: "", reach: "", clicks: "", conversions: "",
    revenue: "", spent: "", engagement: "", videoViews: "", leads: "",
  });

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/marketing/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      } else { router.push("/marketing"); }
    } catch { router.push("/marketing"); }
    finally { setLoading(false); }
  }, [campaignId, router]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  const handleAddMetric = async () => {
    if (!metricForm.date) { showToast("warning", "กรุณาระบุวันที่"); return; }
    setSavingMetric(true);
    try {
      const res = await fetch(`/api/marketing/${campaignId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: metricForm.date,
          impressions: parseInt(metricForm.impressions) || 0,
          reach: parseInt(metricForm.reach) || 0,
          clicks: parseInt(metricForm.clicks) || 0,
          conversions: parseInt(metricForm.conversions) || 0,
          revenue: parseFloat(metricForm.revenue) || 0,
          spent: parseFloat(metricForm.spent) || 0,
          engagement: parseInt(metricForm.engagement) || 0,
          videoViews: parseInt(metricForm.videoViews) || 0,
          leads: parseInt(metricForm.leads) || 0,
        }),
      });
      if (res.ok) {
        showToast("success", "บันทึกข้อมูลเรียบร้อย");
        setShowMetricModal(false);
        setMetricForm({ date: today, impressions: "", reach: "", clicks: "", conversions: "", revenue: "", spent: "", engagement: "", videoViews: "", leads: "" });
        fetchCampaign();
      } else {
        const d = await res.json();
        showToast("error", d.error);
      }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setSavingMetric(false); }
  };

  const handleGenerateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const res = await fetch(`/api/marketing/${campaignId}/insights`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `วิเคราะห์เสร็จ — พบ ${data.count} คำแนะนำ`);
        fetchCampaign();
        setTab("insights");
      } else { showToast("error", data.error); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setGeneratingInsights(false); }
  };

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = [...campaign.metrics].sort((a, b) => a.date.localeCompare(b.date));
  const totalImp = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalConv = metrics.reduce((s, m) => s + m.conversions, 0);
  const totalRev = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalSpent = metrics.reduce((s, m) => s + m.spent, 0);
  const avgCtr = totalImp > 0 ? (totalClicks / totalImp) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgConvRate = totalClicks > 0 ? (totalConv / totalClicks) * 100 : 0;
  const roas = totalSpent > 0 ? totalRev / totalSpent : 0;
  const budgetPct = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

  const chartData = metrics.map((m) => ({
    date: m.date.slice(5),
    Impressions: m.impressions,
    Clicks: m.clicks,
    CTR: m.ctr,
    CPC: m.cpc,
    Conversions: m.conversions,
    Revenue: m.revenue,
    Spent: m.spent,
    ROAS: m.roas,
  }));

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "overview", label: "ภาพรวม", icon: "dashboard" },
    { key: "metrics", label: "ข้อมูลรายวัน", icon: "table_chart" },
    { key: "insights", label: `คำแนะนำ (${campaign.insights.length})`, icon: "lightbulb" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.push("/marketing")} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-slate-400">{platformLabels[campaign.platform]}</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm text-slate-400">{typeLabels[campaign.type]}</span>
            {campaign.startDate && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-400">{campaign.startDate} — {campaign.endDate || "ไม่กำหนด"}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" icon="lightbulb" isLoading={generatingInsights} onClick={handleGenerateInsights}>
          วิเคราะห์ AI
        </Button>
        <Button icon="add" onClick={() => setShowMetricModal(true)}>เพิ่มข้อมูล</Button>
      </div>

      {/* Info Cards */}
      {(campaign.objective || campaign.targetAudience) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 mt-4">
          {campaign.objective && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs font-bold text-blue-500 uppercase mb-1">วัตถุประสงค์</p>
              <p className="text-sm text-blue-800">{campaign.objective}</p>
            </div>
          )}
          {campaign.targetAudience && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-xs font-bold text-purple-500 uppercase mb-1">กลุ่มเป้าหมาย</p>
              <p className="text-sm text-purple-800">{campaign.targetAudience}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 mt-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
              tab === t.key ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Impressions" value={fmt(totalImp)} icon="visibility" />
            <KpiCard label="Clicks" value={fmt(totalClicks)} icon="ads_click" sub={`CTR ${avgCtr.toFixed(2)}%`} />
            <KpiCard label="Conversions" value={fmt(totalConv)} icon="shopping_cart" sub={`Rate ${avgConvRate.toFixed(2)}%`} />
            <KpiCard label="ROAS" value={`${fmtDec(roas)}x`} icon="trending_up" color={roas >= 1 ? "text-green-600" : "text-red-600"} sub={`Revenue ${fmt(totalRev)} บาท`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="ใช้งบ" value={`${fmt(totalSpent)} บาท`} icon="payments" sub={campaign.budget > 0 ? `${budgetPct.toFixed(0)}% ของ ${fmt(campaign.budget)}` : undefined} />
            <KpiCard label="CPC เฉลี่ย" value={`${fmtDec(avgCpc)} บาท`} icon="price_check" />
            <KpiCard label="Cost/Conv." value={totalConv > 0 ? `${fmtDec(totalSpent / totalConv)} บาท` : "-"} icon="calculate" />
            <KpiCard label="กำไร/ขาดทุน" value={`${fmt(totalRev - totalSpent)} บาท`} icon="account_balance" color={totalRev - totalSpent >= 0 ? "text-green-600" : "text-red-600"} />
          </div>

          {/* Budget Progress */}
          {campaign.budget > 0 && (
            <Card title="งบประมาณ">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">ใช้ไป {fmt(campaign.spent)} / {fmt(campaign.budget)} บาท</span>
                  <span className={`font-bold ${budgetPct > 90 ? "text-red-600" : "text-slate-900"}`}>{budgetPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div className={`h-3 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 60 ? "bg-amber-500" : "bg-green-500"}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-400">เหลือ {fmt(Math.max(0, campaign.budget - campaign.spent))} บาท</p>
              </div>
            </Card>
          )}

          {/* Charts */}
          {chartData.length > 1 && (
            <>
              <Card title="กราฟ Impressions & Clicks">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Impressions" fill="#003399" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Clicks" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="กราฟ CTR & CPC">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line yAxisId="left" dataKey="CTR" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="CTR (%)" />
                      <Line yAxisId="right" dataKey="CPC" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="CPC (บาท)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="กราฟ Revenue & ROAS">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue (บาท)" />
                      <Bar yAxisId="left" dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Spent (บาท)" />
                      <Line yAxisId="right" dataKey="ROAS" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="ROAS (x)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tab: Metrics */}
      {tab === "metrics" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{metrics.length} รายการ</p>
            <Button icon="add" size="sm" onClick={() => setShowMetricModal(true)}>เพิ่มข้อมูลรายวัน</Button>
          </div>

          {metrics.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-4 py-12">
                <span className="material-symbols-outlined text-4xl text-slate-300">table_chart</span>
                <p className="text-sm font-bold text-slate-400">ยังไม่มีข้อมูล — เพิ่มข้อมูลรายวันเพื่อเริ่มวิเคราะห์</p>
              </div>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse bg-white rounded-xl border border-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    {["วันที่", "Impressions", "Clicks", "CTR", "CPC", "Conv.", "Revenue", "Spent", "ROAS"].map((h) => (
                      <th key={h} className="border-b border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].reverse().map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-2 font-medium">{m.date}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{fmt(m.impressions)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{fmt(m.clicks)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <span className={m.ctr > 1.5 ? "text-green-600 font-bold" : m.ctr > 0.5 ? "text-amber-600" : "text-red-600"}>{m.ctr.toFixed(2)}%</span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2">{fmtDec(m.cpc)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{fmt(m.conversions)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{fmt(m.revenue)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">{fmt(m.spent)}</td>
                      <td className="border-b border-slate-100 px-3 py-2">
                        <span className={m.roas >= 1 ? "text-green-600 font-bold" : "text-red-600"}>{fmtDec(m.roas)}x</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Insights */}
      {tab === "insights" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{campaign.insights.length} คำแนะนำ</p>
            <Button icon="lightbulb" variant="outline" isLoading={generatingInsights} onClick={handleGenerateInsights}>วิเคราะห์ใหม่</Button>
          </div>

          {campaign.insights.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-4 py-12">
                <span className="material-symbols-outlined text-4xl text-slate-300">lightbulb</span>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-400">ยังไม่มีคำแนะนำ</p>
                  <p className="text-xs text-slate-400 mt-1">กดปุ่ม &quot;วิเคราะห์ AI&quot; เพื่อรับคำแนะนำอัจฉริยะ</p>
                </div>
                <Button icon="lightbulb" isLoading={generatingInsights} onClick={handleGenerateInsights}>วิเคราะห์ AI</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaign.insights.map((insight) => {
                const cfg = insightTypeConfig[insight.type] || insightTypeConfig.RECOMMENDATION;
                const pri = priorityConfig[insight.priority] || priorityConfig.MEDIUM;
                return (
                  <div key={insight.id} className={`${cfg.bg} border rounded-xl p-4`}>
                    <div className="flex items-start gap-3">
                      <span className={`material-symbols-outlined text-xl mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{insight.title}</h3>
                          <Badge variant={pri.variant}>{pri.label}</Badge>
                          <Badge variant="neutral">{insight.category}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Metric Modal */}
      <Modal
        isOpen={showMetricModal}
        onClose={() => setShowMetricModal(false)}
        title="เพิ่มข้อมูลรายวัน"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowMetricModal(false)}>ยกเลิก</Button>
            <Button icon="save" isLoading={savingMetric} onClick={handleAddMetric}>บันทึก</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="วันที่" type="date" value={metricForm.date} onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })} required />

          <p className="text-xs font-bold text-slate-400 uppercase pt-2">ข้อมูลการเข้าถึง</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Impressions" type="number" placeholder="0" value={metricForm.impressions} onChange={(e) => setMetricForm({ ...metricForm, impressions: e.target.value })} />
            <Input label="Reach" type="number" placeholder="0" value={metricForm.reach} onChange={(e) => setMetricForm({ ...metricForm, reach: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Clicks" type="number" placeholder="0" value={metricForm.clicks} onChange={(e) => setMetricForm({ ...metricForm, clicks: e.target.value })} />
            <Input label="Engagement" type="number" placeholder="0" value={metricForm.engagement} onChange={(e) => setMetricForm({ ...metricForm, engagement: e.target.value })} />
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase pt-2">Conversion & Revenue</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Conversions" type="number" placeholder="0" value={metricForm.conversions} onChange={(e) => setMetricForm({ ...metricForm, conversions: e.target.value })} />
            <Input label="Leads" type="number" placeholder="0" value={metricForm.leads} onChange={(e) => setMetricForm({ ...metricForm, leads: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Revenue (บาท)" type="number" placeholder="0" value={metricForm.revenue} onChange={(e) => setMetricForm({ ...metricForm, revenue: e.target.value })} />
            <Input label="Spent (บาท)" type="number" placeholder="0" value={metricForm.spent} onChange={(e) => setMetricForm({ ...metricForm, spent: e.target.value })} />
          </div>

          {(campaign.platform === "TIKTOK" || campaign.platform === "YOUTUBE") && (
            <>
              <p className="text-xs font-bold text-slate-400 uppercase pt-2">Video</p>
              <Input label="Video Views" type="number" placeholder="0" value={metricForm.videoViews} onChange={(e) => setMetricForm({ ...metricForm, videoViews: e.target.value })} />
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600">CTR, CPC, CPM, ROAS จะถูกคำนวณอัตโนมัติจากข้อมูลที่กรอก</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KpiCard({ label, value, icon, sub, color }: { label: string; value: string; icon: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-slate-400 text-lg">{icon}</span>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      </div>
      <p className={`text-xl font-black ${color || "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
