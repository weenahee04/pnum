"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Question {
  question: string;
  type: "RATING" | "TEXT";
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", type: "RATING" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", type: "RATING" }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("warning", "กรุณากรอกชื่อแบบประเมิน");
      return;
    }
    const validQuestions = questions.filter((q) => q.question.trim());
    if (validQuestions.length === 0) {
      showToast("warning", "กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          questions: validQuestions,
        }),
      });
      if (res.ok) {
        showToast("success", "สร้างแบบประเมินเรียบร้อยแล้ว");
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

  return (
    <div>
      <nav className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className="cursor-pointer hover:text-primary" onClick={() => router.push("/surveys")}>
          แบบประเมิน
        </span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-slate-600">สร้างแบบประเมิน</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">สร้างแบบประเมิน</h1>
        <p className="mt-1 text-slate-500 font-medium">สร้างแบบประเมินสำหรับประเมินพนักงาน</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <div className="space-y-4">
            <Input
              label="ชื่อแบบประเมิน"
              icon="quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แบบประเมินผลงานประจำไตรมาส"
              required
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">รายละเอียด</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
                placeholder="อธิบายเกี่ยวกับแบบประเมินนี้... (ไม่บังคับ)"
              />
            </div>
          </div>
        </Card>

        <Card title="คำถาม" action={<Button type="button" size="sm" variant="outline" icon="add" onClick={addQuestion}>เพิ่มคำถาม</Button>}>
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-black text-slate-400 mt-2.5 w-6">{index + 1}.</span>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(index, "question", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    placeholder="พิมพ์คำถาม..."
                  />
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(index, "type", e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  >
                    <option value="RATING">คะแนน (1-5)</option>
                    <option value="TEXT">ข้อความ</option>
                  </select>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3 mt-6">
          <Button type="submit" icon="save" isLoading={submitting}>สร้างแบบประเมิน</Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/surveys")}>ยกเลิก</Button>
        </div>
      </form>
    </div>
  );
}
