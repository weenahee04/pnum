"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface Report {
  id: string;
  date: string;
  content: string;
  problems: string | null;
  tomorrowPlan: string | null;
  createdAt: string;
  user: { name: string; department: string; position: string };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const params = new URLSearchParams();
        if (filterDate) params.set("date", filterDate);
        if (filterUser) params.set("userName", filterUser);
        const res = await fetch(`/api/reports?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [filterDate, filterUser]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            รายงานประจำวัน
          </h1>
          <p className="mt-1 text-slate-500 font-medium">
            ดูรายงานของทุกคนในทีม
          </p>
        </div>
        <Link href="/reports/create">
          <Button icon="add">เขียนรายงาน</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
        />
        <input
          type="text"
          placeholder="ค้นหาชื่อพนักงาน..."
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
        />
        {(filterDate || filterUser) && (
          <Button
            variant="ghost"
            size="sm"
            icon="close"
            onClick={() => {
              setFilterDate("");
              setFilterUser("");
            }}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="material-symbols-outlined text-4xl text-slate-300">
            description
          </span>
          <span className="text-sm font-bold text-slate-400">
            ไม่มีรายงาน
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">
                    person
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">
                      {report.user.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {report.user.department} · {report.user.position}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    📅 {report.date}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                        งานที่ทำวันนี้
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {report.content}
                      </p>
                    </div>
                    {report.problems && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                          ปัญหาที่เจอ
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {report.problems}
                        </p>
                      </div>
                    )}
                    {report.tomorrowPlan && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">
                          แผนพรุ่งนี้
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {report.tomorrowPlan}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
