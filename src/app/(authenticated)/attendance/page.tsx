"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  leaveType: string | null;
  note: string | null;
  user?: { name: string };
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" }> = {
  PRESENT: { label: "มาทำงาน", variant: "success" },
  LATE: { label: "มาสาย", variant: "warning" },
  ABSENT: { label: "ขาด", variant: "danger" },
  LEAVE: { label: "ลา", variant: "info" },
};

const leaveTypeMap: Record<string, string> = {
  SICK: "ลาป่วย",
  PERSONAL: "ลากิจ",
  VACATION: "ลาพักร้อน",
};

export default function AttendancePage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  const [selectedStatus, setSelectedStatus] = useState("PRESENT");
  const [leaveType, setLeaveType] = useState("SICK");
  const [note, setNote] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";
  const today = new Date().toISOString().split("T")[0];

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/attendance");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        const todayRec = (data.records || []).find(
          (r: AttendanceRecord) => r.date === today
        );
        setTodayRecord(todayRec || null);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          leaveType: selectedStatus === "LEAVE" ? leaveType : null,
          note: note || null,
        }),
      });
      if (res.ok) {
        showToast("success", "บันทึกสถานะเรียบร้อยแล้ว");
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          ขาด / ลา / มาสาย
        </h1>
        <p className="mt-1 text-slate-500 font-medium">
          บันทึกและดูสถานะการเข้างานประจำวัน
        </p>
      </div>

      {!todayRecord && (
        <Card title="บันทึกสถานะวันนี้" className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                สถานะ
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusMap).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStatus(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedStatus === key
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {selectedStatus === "LEAVE" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  ประเภทการลา
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                >
                  {Object.entries(leaveTypeMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
                placeholder="เพิ่มหมายเหตุ..."
              />
            </div>

            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              icon="check_circle"
            >
              บันทึกสถานะ
            </Button>
          </div>
        </Card>
      )}

      {todayRecord && (
        <div className="mb-6 p-4 rounded-xl bg-success-50 border border-success-100">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-success text-xl">
              task_alt
            </span>
            <div>
              <p className="text-sm font-bold text-success-700">
                บันทึกสถานะวันนี้แล้ว
              </p>
              <p className="text-xs text-success-600 mt-0.5">
                สถานะ: {statusMap[todayRecord.status]?.label}
                {todayRecord.leaveType &&
                  ` (${leaveTypeMap[todayRecord.leaveType]})`}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card title={isAdmin ? "ประวัติทั้งหมด" : "ประวัติของฉัน"} noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">
                    พนักงาน
                  </th>
                )}
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">
                  วันที่
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">
                  ประเภทลา
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 text-left">
                  หมายเหตุ
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-slate-300">
                        event_available
                      </span>
                      <span className="text-sm font-bold text-slate-400">
                        ยังไม่มีข้อมูล
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50">
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm text-slate-700 border-b border-slate-100">
                        {record.user?.name || "-"}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-slate-700 border-b border-slate-100">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 border-b border-slate-100">
                      <Badge
                        variant={statusMap[record.status]?.variant || "neutral"}
                        hasDot
                      >
                        {statusMap[record.status]?.label || record.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 border-b border-slate-100">
                      {record.leaveType
                        ? leaveTypeMap[record.leaveType] || record.leaveType
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 border-b border-slate-100">
                      {record.note || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
