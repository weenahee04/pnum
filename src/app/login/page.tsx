"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-3xl">
              corporate_fare
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            HR System
          </h1>
          <p className="mt-1 text-slate-500 font-medium">
            ระบบจัดการทรัพยากรบุคคล
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">
            เข้าสู่ระบบ
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="อีเมล"
              icon="mail"
              type="email"
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="รหัสผ่าน"
              icon="lock"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              size="lg"
              icon="login"
              isLoading={loading}
            >
              เข้าสู่ระบบ
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 text-center mb-3">
              บัญชีทดสอบ
            </p>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="font-semibold">Admin:</span>
                <span>admin@company.com / admin123</span>
              </div>
              <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                <span className="font-semibold">พนักงาน:</span>
                <span>somchai@company.com / employee123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
