"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string };
  _count: { questions: number; responses: number };
}

export default function SurveysPage() {
  const { data: session } = useSession();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    async function fetchSurveys() {
      try {
        const res = await fetch("/api/surveys");
        if (res.ok) {
          const data = await res.json();
          setSurveys(data.surveys || []);
        }
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSurveys();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            แบบประเมิน
          </h1>
          <p className="mt-1 text-slate-500 font-medium">
            ประเมินผลพนักงานในทีม
          </p>
        </div>
        {isAdmin && (
          <Link href="/surveys/create">
            <Button icon="add">สร้างแบบประเมิน</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : surveys.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="material-symbols-outlined text-4xl text-slate-300">
            quiz
          </span>
          <span className="text-sm font-bold text-slate-400">
            ยังไม่มีแบบประเมิน
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {survey.title}
                  </h3>
                  {survey.description && (
                    <p className="text-sm text-slate-500 mt-1">
                      {survey.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant={survey.isActive ? "success" : "neutral"}
                  hasDot
                >
                  {survey.isActive ? "เปิดอยู่" : "ปิดแล้ว"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                <span>สร้างโดย: {survey.createdBy.name}</span>
                <span>{survey._count.questions} คำถาม</span>
                <span>{survey._count.responses} คำตอบ</span>
              </div>
              <div className="flex items-center gap-2">
                {survey.isActive && (
                  <Link href={`/surveys/${survey.id}`}>
                    <Button size="sm" variant="outline" icon="edit_note">
                      ทำแบบประเมิน
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Link href={`/surveys/${survey.id}/results`}>
                    <Button size="sm" variant="ghost" icon="bar_chart">
                      ดูผล
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
