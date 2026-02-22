"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

export default function CreateReportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [problems, setProblems] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast("warning", "กรุณากรอกงานที่ทำวันนี้");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          problems: problems.trim() || null,
          tomorrowPlan: tomorrowPlan.trim() || null,
        }),
      });
      if (res.ok) {
        showToast("success", "บันทึกรายงานเรียบร้อยแล้ว");
        router.push("/reports");
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

  return (
    <div>
      <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <span
          className="cursor-pointer hover:text-primary"
          onClick={() => router.push("/reports")}
        >
          รายงานประจำวัน
        </span>
        <span className="material-symbols-outlined text-[14px]">
          chevron_right
        </span>
        <span className="text-slate-600">เขียนรายงาน</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          เขียนรายงานประจำวัน
        </h1>
        <p className="mt-1 text-slate-500 font-medium">
          บันทึกสิ่งที่ทำวันนี้ ปัญหาที่เจอ และแผนพรุ่งนี้
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              งานที่ทำวันนี้ <span className="text-danger">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
              placeholder="วันนี้ทำอะไรบ้าง..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ปัญหาที่เจอ
            </label>
            <textarea
              value={problems}
              onChange={(e) => setProblems(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
              placeholder="มีปัญหาอะไรบ้าง... (ไม่บังคับ)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              แผนพรุ่งนี้
            </label>
            <textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
              placeholder="พรุ่งนี้จะทำอะไร... (ไม่บังคับ)"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" icon="save" isLoading={submitting}>
              บันทึกรายงาน
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/reports")}
            >
              ยกเลิก
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
