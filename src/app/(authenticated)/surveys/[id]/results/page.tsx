"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

interface QuestionResult {
  id: string;
  question: string;
  type: string;
  avgRating: number | null;
  textAnswers: string[];
}

interface UserResult {
  userId: string;
  userName: string;
  questions: QuestionResult[];
  overallAvg: number;
}

interface SurveyResult {
  title: string;
  description: string | null;
  results: UserResult[];
}

export default function SurveyResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<SurveyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/surveys/${params.id}/results`);
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <span className="material-symbols-outlined text-4xl text-slate-300">error</span>
        <span className="text-sm font-bold text-slate-400">ไม่พบข้อมูล</span>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`material-symbols-outlined text-lg ${
              star <= Math.round(rating) ? "text-warning" : "text-slate-200"
            }`}
          >
            star
          </span>
        ))}
        <span className="text-sm font-bold text-slate-700 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div>
      <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push("/surveys")}>แบบประเมิน</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-600">ผลประเมิน</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{data.title}</h1>
        <p className="mt-1 text-slate-500 font-medium">ผลการประเมินรายบุคคล</p>
      </div>

      {data.results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <span className="material-symbols-outlined text-4xl text-slate-300">bar_chart</span>
          <span className="text-sm font-bold text-slate-400">ยังไม่มีผลประเมิน</span>
        </div>
      ) : (
        <div className="space-y-6">
          {data.results.map((userResult) => (
            <Card key={userResult.userId}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{userResult.userName}</p>
                    <p className="text-xs text-slate-400">คะแนนเฉลี่ยรวม</p>
                  </div>
                </div>
                <div className="text-right">
                  {renderStars(userResult.overallAvg)}
                </div>
              </div>

              <div className="space-y-3">
                {userResult.questions.map((q) => (
                  <div key={q.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 mb-2">{q.question}</p>
                    {q.type === "RATING" && q.avgRating !== null ? (
                      renderStars(q.avgRating)
                    ) : q.textAnswers.length > 0 ? (
                      <div className="space-y-1">
                        {q.textAnswers.map((answer, i) => (
                          <p key={i} className="text-sm text-slate-600 pl-3 border-l-2 border-primary-100">
                            {answer}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">ยังไม่มีคำตอบ</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
