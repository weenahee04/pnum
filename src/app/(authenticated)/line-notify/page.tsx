"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function LineNotifyPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";

  const [hasToken, setHasToken] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/line-notify");
      if (res.ok) {
        const data = await res.json();
        setHasToken(data.hasToken);
        setEnabled(data.enabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/line-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineToken: token || undefined, enabled }),
      });
      if (res.ok) {
        showToast("success", "บันทึกการตั้งค่าเรียบร้อย");
        setToken("");
        fetchSettings();
      } else {
        const d = await res.json();
        showToast("error", d.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/line-notify/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) showToast("success", data.message || "ส่งทดสอบสำเร็จ");
      else showToast("error", data.error || "ไม่สามารถส่งได้");
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setTesting(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) { showToast("warning", "กรุณาพิมพ์ข้อความ"); return; }
    setBroadcasting(true);
    try {
      const res = await fetch("/api/line-notify/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `ส่งสำเร็จ ${data.sent}/${data.total} คน`);
        setBroadcastMsg("");
      } else {
        showToast("error", data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">แจ้งเตือนผ่าน LINE</h1>
        <p className="mt-1 text-slate-500 font-medium">เชื่อมต่อ LINE Notify เพื่อรับการแจ้งเตือนจากระบบ HR โดยตรง</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Settings */}
        <Card title="ตั้งค่าส่วนตัว">
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-slate-900">สถานะการเชื่อมต่อ</p>
                <p className="text-xs text-slate-400 mt-0.5">LINE Notify Token</p>
              </div>
              {hasToken ? (
                <Badge variant="success" hasDot>เชื่อมต่อแล้ว</Badge>
              ) : (
                <Badge variant="neutral">ยังไม่เชื่อมต่อ</Badge>
              )}
            </div>

            <div>
              <Input
                label="LINE Notify Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={hasToken ? "••••••••••••••••" : "วาง Token ที่นี่"}
              />
              <p className="text-xs text-slate-400 mt-1.5">
                รับ Token ได้ที่{" "}
                <a href="https://notify-bot.line.me/my/" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  notify-bot.line.me/my
                </a>
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-slate-900">เปิดรับการแจ้งเตือน</p>
                <p className="text-xs text-slate-400 mt-0.5">เช็คอิน, ใบลา, เงินเดือน, ประเมินผล</p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "left-6.5 translate-x-0" : "left-0.5"}`}
                  style={{ left: enabled ? "26px" : "2px" }} />
              </button>
            </div>

            <div className="flex gap-3">
              <Button icon="save" isLoading={saving} onClick={handleSave}>บันทึก</Button>
              {hasToken && enabled && (
                <Button variant="outline" icon="send" isLoading={testing} onClick={handleTest}>ทดสอบส่ง</Button>
              )}
            </div>
          </div>
        </Card>

        {/* How it works */}
        <Card title="การแจ้งเตือนที่จะได้รับ">
          <div className="space-y-4">
            {[
              { icon: "fingerprint", color: "text-success", title: "เช็คอิน/เช็คเอาท์", desc: "แจ้งเตือนเมื่อลงเวลาเข้า-ออกงาน" },
              { icon: "event_busy", color: "text-warning", title: "ใบลา", desc: "แจ้งเตือนเมื่อยื่นใบลา / อนุมัติ / ปฏิเสธ" },
              { icon: "payments", color: "text-primary", title: "เงินเดือน", desc: "แจ้งเตือนเมื่อมีสลิปเงินเดือนใหม่" },
              { icon: "rate_review", color: "text-rose-500", title: "ประเมินผล 360°", desc: "แจ้งเตือนเมื่อมีการประเมินผลใหม่" },
              { icon: "work", color: "text-info", title: "สรรหาบุคลากร", desc: "แจ้งเตือนเมื่อมีผู้สมัครใหม่ / อัปเดตสถานะ" },
              { icon: "school", color: "text-purple-600", title: "ฝึกอบรม", desc: "แจ้งเตือนเมื่อลงทะเบียนหลักสูตร" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                <span className={`material-symbols-outlined ${item.color} text-xl mt-0.5`}>{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Admin Broadcast */}
        {isAdmin && (
          <Card title="📢 ส่งประกาศถึงพนักงานทุกคน" className="lg:col-span-2">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">ข้อความประกาศ</label>
                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={3}
                  placeholder="พิมพ์ข้อความที่ต้องการส่งถึงพนักงานทุกคนที่เชื่อมต่อ LINE..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button icon="campaign" isLoading={broadcasting} onClick={handleBroadcast}>ส่งประกาศ</Button>
                <span className="text-xs text-slate-400">จะส่งถึงพนักงานที่เปิดรับแจ้งเตือนเท่านั้น</span>
              </div>
            </div>
          </Card>
        )}

        {/* Setup Guide */}
        <Card title="วิธีตั้งค่า LINE Notify" className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: 1, icon: "open_in_new", title: "เข้าเว็บ LINE Notify", desc: "ไปที่ notify-bot.line.me/my แล้วล็อกอินด้วย LINE" },
              { step: 2, icon: "token", title: "สร้าง Token", desc: "กด 'Generate token' ตั้งชื่อ เลือกกลุ่มหรือ 1-on-1" },
              { step: 3, icon: "content_paste", title: "วาง Token", desc: "คัดลอก Token มาวางในช่องด้านบน แล้วกดบันทึก" },
              { step: 4, icon: "notifications_active", title: "เปิดรับแจ้งเตือน", desc: "เปิดสวิตช์รับแจ้งเตือน แล้วกดทดสอบ" },
            ].map((s) => (
              <div key={s.step} className="text-center p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-black">{s.step}</div>
                <span className="material-symbols-outlined text-primary text-2xl mb-2">{s.icon}</span>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
