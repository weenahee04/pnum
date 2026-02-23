"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function VerifyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // ถ้า login ด้วย credentials หรือ verify แล้ว → ไป dashboard
    if (status === "authenticated" && session?.user && !session.user.needsVerification) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่อ-นามสกุล");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // อัพเดท session เพื่อ refresh token
        await update();
        // รอสักครู่แล้ว redirect
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#06C755] mx-auto mb-4 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ยืนยันตัวตน
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium">
            กรอกชื่อ-นามสกุลให้ตรงกับที่ลงทะเบียนในระบบ
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6 sm:p-8">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">ยืนยันตัวตนสำเร็จ!</h2>
                <p className="text-sm text-slate-500 mt-1">กำลังพาไปหน้าหลัก...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                  <div>
                    <p className="text-xs sm:text-sm text-blue-700 font-medium">
                      กรอกชื่อ-นามสกุลเต็มให้ตรงกับที่บริษัทลงทะเบียนไว้
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      เช่น น.ส.สุพิชฌาย์ ชื่นระรวย, นาย กฤตณัติ ทองเต็มถุง
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-100 text-danger-700 text-sm font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <Input
                  label="ชื่อ-นามสกุล"
                  icon="person"
                  placeholder="เช่น น.ส.สุพิชฌาย์ ชื่นระรวย"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  icon="verified"
                  isLoading={loading}
                >
                  ยืนยันตัวตน
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
