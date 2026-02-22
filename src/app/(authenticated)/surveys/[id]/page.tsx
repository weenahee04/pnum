"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface Question {
  id: string;
  question: string;
  type: string;
  order: number;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface User {
  id: string;
  name: string;
  department: string;
}

export default function TakeSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState("");
  const [answers, setAnswers] = useState<Record<string, { rating?: number; textAnswer?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [surveyRes, usersRes] = await Promise.all([
          fetch(`/api/surveys/${params.id}`),
          fetch("/api/users"),
        ]);
        if (surveyRes.ok) setSurvey(await surveyRes.json());
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers((data.users || []).filter((u: User) => u.id !== session?.user?.id));
        }
      } catch (err) {
        console.error("Failed to fetch survey:", err);
      } finally {
        setLoading(false);
      }
    }
    if (session?.user?.id) fetchData();
  }, [params.id, session?.user?.id]);

  const updateAnswer = (questionId: string, field: string, value: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      showToast("warning", "กรุณาเลือกพนักงานที่ต้องการประเมิน");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${params.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, answers }),
      });
      if (res.ok) {
        showToast("success", "ส่งแบบประเมินเรียบร้อยแล้ว");
        router.push("/surveys");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <span className="material-symbols-outlined text-4xl text-slate-300">error</span>
        <span className="text-sm font-bold text-slate-400">ไม่พบแบบประเมิน</span>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push("/surveys")}>แบบประเมิน</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-600">ทำแบบประเมิน</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{survey.title}</h1>
        {survey.description && <p className="mt-1 text-slate-500 font-medium">{survey.description}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เลือกพนักงานที่ต้องการประเมิน <span className="text-danger">*</span>
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
              required
            >
              <option value="">-- เลือกพนักงาน --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </select>
          </div>
        </Card>

        <div className="space-y-4">
          {survey.questions
            .sort((a, b) => a.order - b.order)
            .map((q, index) => (
              <Card key={q.id}>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-3">
                    <span className="text-primary mr-2">{index + 1}.</span>
                    {q.question}
                  </p>
                  {q.type === "RATING" ? (
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => updateAnswer(q.id, "rating", rating)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                            answers[q.id]?.rating === rating
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 ml-2">
                        (1 = น้อยที่สุด, 5 = มากที่สุด)
                      </span>
                    </div>
                  ) : (
                    <textarea
                      value={answers[q.id]?.textAnswer || ""}
                      onChange={(e) => updateAnswer(q.id, "textAnswer", e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
                      placeholder="พิมพ์คำตอบ..."
                    />
                  )}
                </div>
              </Card>
            ))}
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" icon="send" isLoading={submitting}>ส่งแบบประเมิน</Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/surveys")}>ยกเลิก</Button>
        </div>
      </form>
    </div>
  );
}
