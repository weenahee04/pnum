"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Ranking { id: string; rank: number; url: string | null; checkedAt: string; }
interface Keyword {
  id: string; keyword: string; currentRank: number | null; bestRank: number | null;
  lastChecked: string | null; rankings: Ranking[];
}
interface Audit {
  id: string; url: string; score: number; createdAt: string;
}
interface Project {
  id: string; name: string; url: string; createdAt: string;
  createdBy: { name: string }; audits: Audit[]; keywords: Keyword[];
}

interface AnalysisResult {
  url: string;
  meta: { title: string | null; titleLength: number; description: string | null; descriptionLength: number; canonical: string | null; robots: string | null; viewport: string | null; charset: string | null; lang: string | null; keywords: string | null; author: string | null; generator: string | null; themeColor: string | null; };
  og: { title: string | null; description: string | null; image: string | null; url: string | null; type: string | null; siteName: string | null; locale: string | null; };
  twitter: { card: string | null; title: string | null; description: string | null; image: string | null; site: string | null; };
  headings: { h1: string[]; h2: string[]; h3: string[]; h4: string[]; h5: string[]; h6: string[]; totalCount: number; hasProperHierarchy: boolean; };
  images: { total: number; withAlt: number; withoutAlt: number; withTitle: number; withLazyLoad: number; largeImages: number; list: { src: string; alt: string; width?: string; height?: string; loading?: string }[]; };
  links: { total: number; internal: number; external: number; nofollow: number; broken: { href: string; text: string }[]; hasEmptyAnchors: number; uniqueInternal: number; uniqueExternal: number; };
  content: { wordCount: number; charCount: number; sentenceCount: number; paragraphCount: number; avgWordsPerSentence: number; readingTimeMinutes: number; keywords: { word: string; count: number; density: number }[]; hasIframe: boolean; hasForms: boolean; hasVideo: boolean; hasAudio: boolean; textToHtmlRatio: number; };
  technical: { https: boolean; hasSchemaMarkup: boolean; schemaTypes: string[]; hasFavicon: boolean; hasAppleTouchIcon: boolean; hasManifest: boolean; hasSitemap: boolean; hasRobotsTxt: boolean; hasAmpVersion: boolean; hasHreflang: boolean; hreflangTags: { lang: string; href: string }[]; hasPrefetch: boolean; hasPreconnect: boolean; cssFiles: number; jsFiles: number; inlineStyles: number; inlineScripts: number; responseTimeMs: number; htmlSize: number; };
  security: { hasHttps: boolean; hasMixedContent: boolean; hasContentSecurityPolicy: boolean; hasXFrameOptions: boolean; hasXContentTypeOptions: boolean; hasStrictTransportSecurity: boolean; };
  social: { hasFacebookPixel: boolean; hasGoogleAnalytics: boolean; hasGoogleTagManager: boolean; hasTwitterPixel: boolean; hasTikTokPixel: boolean; hasLinkedInPixel: boolean; };
}

interface AuditCheck {
  id: string; category: string; name: string; status: "pass" | "warning" | "fail"; message: string; weight: number;
}

type TabType = "analyze" | "audit" | "keywords";

export default function SeoProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>("analyze");

  // Analyze state
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Audit state
  const [auditing, setAuditing] = useState(false);
  const [auditChecks, setAuditChecks] = useState<AuditCheck[]>([]);
  const [auditScore, setAuditScore] = useState<number | null>(null);
  const [auditAnalysis, setAuditAnalysis] = useState<AnalysisResult | null>(null);

  // Keywords state
  const [newKeyword, setNewKeyword] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [checkingKeyword, setCheckingKeyword] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/seo/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        if (data.project?.url) setAnalyzeUrl(data.project.url);
      } else {
        router.push("/seo");
      }
    } catch { router.push("/seo"); }
    finally { setLoading(false); }
  }, [projectId, router]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  // === Analyze ===
  const handleAnalyze = async () => {
    if (!analyzeUrl.trim()) { showToast("warning", "กรุณาระบุ URL"); return; }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analyzeUrl }),
      });
      const data = await res.json();
      if (res.ok) { setAnalysis(data.analysis); showToast("success", "วิเคราะห์เสร็จสิ้น"); }
      else showToast("error", data.error);
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setAnalyzing(false); }
  };

  // === Audit ===
  const handleAudit = async () => {
    setAuditing(true);
    setAuditChecks([]);
    setAuditScore(null);
    setAuditAnalysis(null);
    try {
      const res = await fetch("/api/seo/audit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, url: project?.url }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuditChecks(data.checks);
        setAuditScore(data.score);
        setAuditAnalysis(data.analysis);
        showToast("success", `ตรวจ SEO เสร็จ — คะแนน ${data.score}/100`);
        fetchProject();
      } else showToast("error", data.error);
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setAuditing(false); }
  };

  // === Keywords ===
  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) { showToast("warning", "กรุณาระบุ keyword"); return; }
    setAddingKeyword(true);
    try {
      const res = await fetch("/api/seo/keywords", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, keyword: newKeyword }),
      });
      if (res.ok) { showToast("success", "เพิ่ม keyword เรียบร้อย"); setNewKeyword(""); fetchProject(); }
      else { const d = await res.json(); showToast("error", d.error); }
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setAddingKeyword(false); }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      await fetch(`/api/seo/keywords/${id}`, { method: "DELETE" });
      showToast("success", "ลบ keyword เรียบร้อย");
      fetchProject();
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
  };

  const handleCheckRank = async (keywordId: string) => {
    setCheckingKeyword(keywordId);
    try {
      const res = await fetch("/api/seo/keywords/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywordId }),
      });
      const data = await res.json();
      if (res.ok) {
        const rank = data.result?.targetRank;
        showToast("success", rank ? `อันดับ: ${rank}` : "ไม่พบในผลการค้นหา 100 อันดับแรก");
        fetchProject();
      } else showToast("error", data.error);
    } catch { showToast("error", "เกิดข้อผิดพลาด"); }
    finally { setCheckingKeyword(null); }
  };

  const statusIcon = (s: string) => s === "pass" ? "check_circle" : s === "warning" ? "warning" : "cancel";
  const statusColor = (s: string) => s === "pass" ? "text-success" : s === "warning" ? "text-warning" : "text-danger";

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "analyze", label: "วิเคราะห์เว็บ", icon: "search" },
    { key: "audit", label: "SEO Audit", icon: "checklist" },
    { key: "keywords", label: "Keywords", icon: "key" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => router.push("/seo")} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-slate-500">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-sm text-slate-400">{project.url}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
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

      {/* Tab: Analyze */}
      {tab === "analyze" && (
        <div className="space-y-6">
          <Card>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="URL ที่ต้องการวิเคราะห์"
                  icon="link"
                  placeholder="https://example.com"
                  value={analyzeUrl}
                  onChange={(e) => setAnalyzeUrl(e.target.value)}
                />
              </div>
              <div className="pt-6">
                <Button icon="search" isLoading={analyzing} onClick={handleAnalyze}>วิเคราะห์</Button>
              </div>
            </div>
          </Card>

          {analysis && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Response Time</p>
                  <p className={`text-xl font-black ${analysis.technical.responseTimeMs < 1000 ? "text-green-600" : analysis.technical.responseTimeMs < 3000 ? "text-amber-600" : "text-red-600"}`}>{analysis.technical.responseTimeMs}ms</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">HTML Size</p>
                  <p className="text-xl font-black text-slate-900">{Math.round(analysis.technical.htmlSize / 1024)} KB</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Text/HTML Ratio</p>
                  <p className={`text-xl font-black ${analysis.content.textToHtmlRatio > 10 ? "text-green-600" : "text-amber-600"}`}>{analysis.content.textToHtmlRatio}%</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Reading Time</p>
                  <p className="text-xl font-black text-slate-900">~{analysis.content.readingTimeMinutes} min</p>
                </div>
              </div>

              {/* Meta Tags */}
              <Card title="Meta Tags">
                <div className="space-y-3">
                  <InfoRow label="Title" value={analysis.meta.title} sub={`${analysis.meta.titleLength} ตัวอักษร`} ok={analysis.meta.titleLength >= 30 && analysis.meta.titleLength <= 60} />
                  <InfoRow label="Description" value={analysis.meta.description} sub={`${analysis.meta.descriptionLength} ตัวอักษร`} ok={analysis.meta.descriptionLength >= 120 && analysis.meta.descriptionLength <= 160} />
                  <InfoRow label="Canonical" value={analysis.meta.canonical} ok={!!analysis.meta.canonical} />
                  <InfoRow label="Robots" value={analysis.meta.robots || "(ไม่ได้ระบุ — default: index, follow)"} />
                  <InfoRow label="Viewport" value={analysis.meta.viewport} ok={!!analysis.meta.viewport} />
                  <InfoRow label="Language" value={analysis.meta.lang} ok={!!analysis.meta.lang} />
                  <InfoRow label="Charset" value={analysis.meta.charset} ok={!!analysis.meta.charset} />
                  <InfoRow label="Author" value={analysis.meta.author} />
                  <InfoRow label="Keywords" value={analysis.meta.keywords} />
                  {analysis.meta.themeColor && <InfoRow label="Theme Color" value={analysis.meta.themeColor} />}
                  {analysis.meta.generator && <InfoRow label="Generator" value={analysis.meta.generator} />}
                </div>
              </Card>

              {/* Open Graph & Twitter Card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Open Graph">
                  <div className="space-y-3">
                    <InfoRow label="og:title" value={analysis.og.title} ok={!!analysis.og.title} />
                    <InfoRow label="og:description" value={analysis.og.description} ok={!!analysis.og.description} />
                    <InfoRow label="og:image" value={analysis.og.image} ok={!!analysis.og.image} />
                    <InfoRow label="og:url" value={analysis.og.url} />
                    <InfoRow label="og:type" value={analysis.og.type} />
                    <InfoRow label="og:site_name" value={analysis.og.siteName} />
                    <InfoRow label="og:locale" value={analysis.og.locale} />
                  </div>
                  {analysis.og.image && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs font-bold text-slate-500 mb-2">OG Image Preview:</p>
                      <img src={analysis.og.image} alt="OG" className="max-h-40 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </Card>
                <Card title="Twitter Card">
                  <div className="space-y-3">
                    <InfoRow label="twitter:card" value={analysis.twitter.card} ok={!!analysis.twitter.card} />
                    <InfoRow label="twitter:title" value={analysis.twitter.title} ok={!!analysis.twitter.title} />
                    <InfoRow label="twitter:description" value={analysis.twitter.description} />
                    <InfoRow label="twitter:image" value={analysis.twitter.image} ok={!!analysis.twitter.image} />
                    <InfoRow label="twitter:site" value={analysis.twitter.site} />
                  </div>
                </Card>
              </div>

              {/* Headings */}
              <Card title={`Headings Structure (${analysis.headings.totalCount} ตัว)`}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={analysis.headings.hasProperHierarchy ? "success" : "warning"}>
                    {analysis.headings.hasProperHierarchy ? "ลำดับถูกต้อง" : "ข้ามลำดับ"}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    H1:{analysis.headings.h1.length} H2:{analysis.headings.h2.length} H3:{analysis.headings.h3.length} H4:{analysis.headings.h4.length} H5:{analysis.headings.h5.length} H6:{analysis.headings.h6.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((tag) => {
                    const items = analysis.headings[tag];
                    if (items.length === 0) return null;
                    return (
                      <div key={tag}>
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">{tag.toUpperCase()} ({items.length})</p>
                        {items.slice(0, 10).map((h, i) => (
                          <p key={i} className={`text-sm text-slate-700 ${tag === "h1" ? "font-bold" : ""}`} style={{ paddingLeft: `${parseInt(tag[1]) * 12}px` }}>
                            {tag === "h1" ? "📌 " : "• "}{h}
                          </p>
                        ))}
                        {items.length > 10 && <p className="text-xs text-slate-400">...และอีก {items.length - 10} รายการ</p>}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Images & Links */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title={`Images (${analysis.images.total})`}>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-slate-600">รูปภาพทั้งหมด</span><span className="font-bold">{analysis.images.total}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">มี Alt Text</span><Badge variant="success">{analysis.images.withAlt}</Badge></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">ไม่มี Alt Text</span><Badge variant={analysis.images.withoutAlt > 0 ? "danger" : "success"}>{analysis.images.withoutAlt}</Badge></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">มี Title</span><Badge variant="neutral">{analysis.images.withTitle}</Badge></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">Lazy Loading</span><Badge variant={analysis.images.withLazyLoad > 0 ? "success" : "warning"}>{analysis.images.withLazyLoad}</Badge></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">รูปขนาดใหญ่ (&gt;1200px)</span><Badge variant={analysis.images.largeImages === 0 ? "success" : "warning"}>{analysis.images.largeImages}</Badge></div>
                  </div>
                </Card>
                <Card title={`Links (${analysis.links.total})`}>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-slate-600">Internal Links</span><span className="font-bold">{analysis.links.internal} <span className="text-xs text-slate-400">({analysis.links.uniqueInternal} unique)</span></span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">External Links</span><span className="font-bold">{analysis.links.external} <span className="text-xs text-slate-400">({analysis.links.uniqueExternal} domains)</span></span></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">Nofollow</span><Badge variant="neutral">{analysis.links.nofollow}</Badge></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">Empty Anchors</span><Badge variant={analysis.links.hasEmptyAnchors === 0 ? "success" : "warning"}>{analysis.links.hasEmptyAnchors}</Badge></div>
                    <div className="flex justify-between"><span className="text-sm text-slate-600">Broken Links</span><Badge variant={analysis.links.broken.length === 0 ? "success" : "danger"}>{analysis.links.broken.length}</Badge></div>
                  </div>
                  {analysis.links.broken.length > 0 && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-xs font-bold text-red-600 mb-1">Broken Links:</p>
                      {analysis.links.broken.slice(0, 5).map((bl, i) => (
                        <p key={i} className="text-xs text-red-500 truncate">{bl.href} {bl.text && `(${bl.text})`}</p>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Content Analysis */}
              <Card title={`Content Analysis (${analysis.content.wordCount.toLocaleString()} คำ)`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Characters</p><p className="text-lg font-black text-slate-900">{analysis.content.charCount.toLocaleString()}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Sentences</p><p className="text-lg font-black text-slate-900">{analysis.content.sentenceCount}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Paragraphs</p><p className="text-lg font-black text-slate-900">{analysis.content.paragraphCount}</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Avg Words/Sentence</p><p className={`text-lg font-black ${analysis.content.avgWordsPerSentence <= 25 ? "text-green-600" : "text-amber-600"}`}>{analysis.content.avgWordsPerSentence}</p></div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {analysis.content.hasVideo && <Badge variant="primary">มีวิดีโอ</Badge>}
                  {analysis.content.hasAudio && <Badge variant="primary">มีเสียง</Badge>}
                  {analysis.content.hasIframe && <Badge variant="neutral">มี iframe</Badge>}
                  {analysis.content.hasForms && <Badge variant="neutral">มีฟอร์ม</Badge>}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Top Keywords</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {analysis.content.keywords.slice(0, 20).map((kw) => (
                    <div key={kw.word} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-bold text-slate-700 truncate">{kw.word}</span>
                      <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{kw.count}x ({kw.density}%)</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Technical & Security & Social */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Technical">
                  <div className="space-y-2">
                    <CheckRow label="HTTPS" ok={analysis.technical.https} />
                    <CheckRow label="Favicon" ok={analysis.technical.hasFavicon} />
                    <CheckRow label="Apple Touch Icon" ok={analysis.technical.hasAppleTouchIcon} />
                    <CheckRow label="Web Manifest (PWA)" ok={analysis.technical.hasManifest} />
                    <CheckRow label="Sitemap.xml" ok={analysis.technical.hasSitemap} />
                    <CheckRow label="Robots.txt" ok={analysis.technical.hasRobotsTxt} />
                    <CheckRow label="Schema Markup" ok={analysis.technical.hasSchemaMarkup} />
                    <CheckRow label="Hreflang" ok={analysis.technical.hasHreflang} />
                    <CheckRow label="AMP Version" ok={analysis.technical.hasAmpVersion} />
                    <CheckRow label="Preconnect" ok={analysis.technical.hasPreconnect} />
                    <CheckRow label="DNS Prefetch" ok={analysis.technical.hasPrefetch} />
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <p className="text-xs text-slate-400">CSS: {analysis.technical.cssFiles} files | JS: {analysis.technical.jsFiles} files</p>
                      <p className="text-xs text-slate-400">Inline: {analysis.technical.inlineStyles} styles | {analysis.technical.inlineScripts} scripts</p>
                    </div>
                    {analysis.technical.schemaTypes.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-bold text-slate-400 mb-1">Schema Types:</p>
                        <div className="flex flex-wrap gap-1">{analysis.technical.schemaTypes.map((t, i) => <Badge key={i} variant="primary">{t}</Badge>)}</div>
                      </div>
                    )}
                  </div>
                </Card>
                <Card title="Security">
                  <div className="space-y-2">
                    <CheckRow label="HTTPS" ok={analysis.security.hasHttps} />
                    <CheckRow label="No Mixed Content" ok={!analysis.security.hasMixedContent} />
                    <CheckRow label="HSTS Header" ok={analysis.security.hasStrictTransportSecurity} />
                    <CheckRow label="X-Frame-Options" ok={analysis.security.hasXFrameOptions} />
                    <CheckRow label="X-Content-Type-Options" ok={analysis.security.hasXContentTypeOptions} />
                    <CheckRow label="Content Security Policy" ok={analysis.security.hasContentSecurityPolicy} />
                  </div>
                </Card>
                <Card title="Social & Tracking">
                  <div className="space-y-2">
                    <CheckRow label="Google Analytics" ok={analysis.social.hasGoogleAnalytics} />
                    <CheckRow label="Google Tag Manager" ok={analysis.social.hasGoogleTagManager} />
                    <CheckRow label="Facebook Pixel" ok={analysis.social.hasFacebookPixel} />
                    <CheckRow label="TikTok Pixel" ok={analysis.social.hasTikTokPixel} />
                    <CheckRow label="Twitter Pixel" ok={analysis.social.hasTwitterPixel} />
                    <CheckRow label="LinkedIn Pixel" ok={analysis.social.hasLinkedInPixel} />
                  </div>
                </Card>
              </div>

              {/* Hreflang */}
              {analysis.technical.hreflangTags.length > 0 && (
                <Card title="Hreflang Tags (International SEO)">
                  <div className="space-y-1">
                    {analysis.technical.hreflangTags.map((tag, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <Badge variant="primary">{tag.lang}</Badge>
                        <span className="text-sm text-slate-600 truncate">{tag.href}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Audit */}
      {tab === "audit" && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">ตรวจสอบ SEO ของ {project.url}</p>
                <p className="text-xs text-slate-400 mt-0.5">ตรวจ 20+ รายการ: Meta, OG, Headings, Images, Links, Content, Technical</p>
              </div>
              <Button icon="checklist" isLoading={auditing} onClick={handleAudit}>เริ่มตรวจ SEO</Button>
            </div>
          </Card>

          {auditScore !== null && (
            <div className="flex items-center gap-6 p-6 bg-white rounded-xl border border-slate-200">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${auditScore >= 80 ? "bg-success" : auditScore >= 50 ? "bg-warning" : "bg-danger"}`}>
                <span className="text-3xl font-black text-white">{auditScore}</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {auditScore >= 80 ? "ดีมาก! 🎉" : auditScore >= 50 ? "พอใช้ ⚠️" : "ต้องปรับปรุง ❌"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  ผ่าน {auditChecks.filter((c) => c.status === "pass").length} / {auditChecks.length} รายการ
                  {auditChecks.filter((c) => c.status === "warning").length > 0 && ` • เตือน ${auditChecks.filter((c) => c.status === "warning").length}`}
                  {auditChecks.filter((c) => c.status === "fail").length > 0 && ` • ไม่ผ่าน ${auditChecks.filter((c) => c.status === "fail").length}`}
                </p>
              </div>
            </div>
          )}

          {auditChecks.length > 0 && (
            <>
              {/* Group by category */}
              {Array.from(new Set(auditChecks.map((c) => c.category))).map((cat) => (
                <Card key={cat} title={cat}>
                  <div className="space-y-2">
                    {auditChecks.filter((c) => c.category === cat).map((check) => (
                      <div key={check.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <span className={`material-symbols-outlined text-lg mt-0.5 ${statusColor(check.status)}`}>
                          {statusIcon(check.status)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">{check.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{check.message}</p>
                        </div>
                        <Badge variant={check.status === "pass" ? "success" : check.status === "warning" ? "warning" : "danger"}>
                          {check.status === "pass" ? "ผ่าน" : check.status === "warning" ? "เตือน" : "ไม่ผ่าน"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </>
          )}

          {/* Audit History */}
          {project.audits.length > 0 && (
            <Card title="ประวัติการตรวจ">
              <div className="space-y-2">
                {project.audits.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{a.url}</p>
                      <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("th-TH")}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.score >= 80 ? "bg-success" : a.score >= 50 ? "bg-warning" : "bg-danger"}`}>
                      <span className="text-white text-sm font-black">{a.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Keywords */}
      {tab === "keywords" && (
        <div className="space-y-6">
          <Card>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="เพิ่ม Keyword ใหม่"
                  icon="key"
                  placeholder="เช่น hr system thailand"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                />
              </div>
              <div className="pt-6">
                <Button icon="add" size="sm" isLoading={addingKeyword} onClick={handleAddKeyword}>เพิ่ม</Button>
              </div>
            </div>
          </Card>

          {project.keywords.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center gap-3 py-12">
                <span className="material-symbols-outlined text-4xl text-slate-300">key</span>
                <p className="text-sm font-bold text-slate-400">ยังไม่มี keyword — เพิ่มเพื่อเริ่มติดตามอันดับ</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Keywords Table */}
              <Card title={`Keywords (${project.keywords.length})`}>
                <div className="space-y-2">
                  {project.keywords.map((kw) => (
                    <div key={kw.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{kw.keyword}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {kw.currentRank !== null ? (
                            <span className={`text-xs font-bold ${kw.currentRank <= 10 ? "text-success" : kw.currentRank <= 30 ? "text-warning" : "text-danger"}`}>
                              อันดับ #{kw.currentRank}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">ยังไม่ได้ตรวจ</span>
                          )}
                          {kw.bestRank !== null && (
                            <span className="text-xs text-slate-400">ดีสุด: #{kw.bestRank}</span>
                          )}
                          {kw.lastChecked && (
                            <span className="text-[10px] text-slate-300">
                              ตรวจล่าสุด: {new Date(kw.lastChecked).toLocaleDateString("th-TH")}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        icon="search"
                        isLoading={checkingKeyword === kw.id}
                        onClick={() => handleCheckRank(kw.id)}
                      >
                        ตรวจอันดับ
                      </Button>
                      <button
                        onClick={() => handleDeleteKeyword(kw.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Ranking Chart */}
              {project.keywords.some((kw) => kw.rankings.length > 1) && (
                <Card title="กราฟแนวโน้มอันดับ">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          type="category"
                          allowDuplicatedCategory={false}
                        />
                        <YAxis
                          reversed
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          domain={[1, "auto"]}
                          label={{ value: "อันดับ", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#94a3b8" } }}
                        />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        {project.keywords.filter((kw) => kw.rankings.length > 1).slice(0, 5).map((kw, i) => {
                          const colors = ["#003399", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
                          const data = [...kw.rankings].reverse().filter((r) => r.rank > 0).map((r) => ({
                            date: new Date(r.checkedAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short" }),
                            [kw.keyword]: r.rank,
                          }));
                          return (
                            <Line
                              key={kw.id}
                              data={data}
                              dataKey={kw.keyword}
                              name={kw.keyword}
                              stroke={colors[i % colors.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              connectNulls
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, sub, ok }: { label: string; value: string | null; sub?: string; ok?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
      {ok !== undefined && (
        <span className={`material-symbols-outlined text-lg mt-0.5 ${ok ? "text-success" : "text-warning"}`}>
          {ok ? "check_circle" : "warning"}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-sm text-slate-900 break-all">{value || <span className="text-slate-300 italic">ไม่มี</span>}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`material-symbols-outlined text-base ${ok ? "text-green-500" : "text-slate-300"}`}>
        {ok ? "check_circle" : "cancel"}
      </span>
      <span className={`text-sm ${ok ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
    </div>
  );
}
