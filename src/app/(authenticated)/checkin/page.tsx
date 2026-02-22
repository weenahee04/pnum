"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface CheckInRecord {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  method: string;
  status: string;
  note: string | null;
  user?: { name: string };
}

const methodLabels: Record<string, string> = {
  MANUAL: "ลงเวลาเอง",
  GPS: "GPS",
  QR: "QR Code",
  FACE: "Face Recognition",
};

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  ON_TIME: { label: "ตรงเวลา", variant: "success" },
  LATE: { label: "มาสาย", variant: "warning" },
  EARLY_LEAVE: { label: "กลับก่อน", variant: "danger" },
};

export default function CheckInPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [method, setMethod] = useState("MANUAL");
  const [note, setNote] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch("/api/checkin");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTodayRecord(data.todayRecord || null);
      }
    } catch (err) {
      console.error("Failed to fetch check-in records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { action: "checkin", method, note: note.trim() || null };
      if (method === "GPS" && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        ).catch(() => null);
        if (pos) {
          body.latitude = pos.coords.latitude;
          body.longitude = pos.coords.longitude;
        }
      }
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast("success", "เช็คอินเรียบร้อยแล้ว");
        setNote("");
        fetchRecords();
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

  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      if (res.ok) {
        showToast("success", "เช็คเอาท์เรียบร้อยแล้ว");
        fetchRecords();
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

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ระบบลงเวลาอัจฉริยะ</h1>
        <p className="mt-1 text-slate-500 font-medium">บันทึกเวลาเข้า-ออกงานด้วย GPS, QR Code หรือ Face Recognition</p>
      </div>

      {/* Clock & Check-in Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <Card>
            <div className="text-center py-4">
              <div className="text-5xl font-black text-primary tabular-nums mb-1">
                {formatTime(currentTime)}
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {currentTime.toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>

              {todayRecord?.checkInTime && (
                <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">เข้างาน</p>
                    <p className="font-bold text-success">{todayRecord.checkInTime}</p>
                  </div>
                  {todayRecord.checkOutTime && (
                    <div className="text-center">
                      <p className="text-xs text-slate-400">ออกงาน</p>
                      <p className="font-bold text-danger">{todayRecord.checkOutTime}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 space-y-3">
                {!todayRecord?.checkInTime ? (
                  <>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    >
                      <option value="MANUAL">ลงเวลาเอง</option>
                      <option value="GPS">GPS Location</option>
                      <option value="QR">QR Code</option>
                      <option value="FACE">Face Recognition</option>
                    </select>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="หมายเหตุ (ไม่บังคับ)"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                    <Button className="w-full" icon="login" isLoading={submitting} onClick={handleCheckIn}>
                      เช็คอิน
                    </Button>
                  </>
                ) : !todayRecord?.checkOutTime ? (
                  <Button className="w-full" variant="outline" icon="logout" isLoading={submitting} onClick={handleCheckOut}>
                    เช็คเอาท์
                  </Button>
                ) : (
                  <div className="p-3 rounded-lg bg-success-50 text-success text-sm font-bold">
                    <span className="material-symbols-outlined text-lg align-middle mr-1">check_circle</span>
                    ลงเวลาครบแล้ววันนี้
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2">
          <Card title={isAdmin ? "สถานะพนักงานวันนี้" : "ประวัติการลงเวลา"}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {isAdmin && <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 text-left">ชื่อ</th>}
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 text-left">วันที่</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 text-left">เข้างาน</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 text-left">ออกงาน</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 text-left">วิธี</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase text-slate-500 border-b border-slate-100 text-left">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-4 py-12 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const st = statusLabels[r.status] || { label: r.status, variant: "neutral" as const };
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          {isAdmin && <td className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-100">{r.user?.name}</td>}
                          <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100">{r.date}</td>
                          <td className="px-4 py-3 text-sm font-bold text-success border-b border-slate-100">{r.checkInTime || "-"}</td>
                          <td className="px-4 py-3 text-sm font-bold text-danger border-b border-slate-100">{r.checkOutTime || "-"}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 border-b border-slate-100">{methodLabels[r.method] || r.method}</td>
                          <td className="px-4 py-3 border-b border-slate-100">
                            <Badge variant={st.variant}>{st.label}</Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
