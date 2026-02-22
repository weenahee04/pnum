"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name);
          setDepartment(data.department);
          setPosition(data.position);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, position }),
      });
      if (res.ok) {
        showToast("success", "บันทึกข้อมูลเรียบร้อยแล้ว");
      } else {
        const data = await res.json();
        showToast("error", data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("warning", "กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }
    if (newPassword.length < 6) {
      showToast("warning", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        showToast("success", "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        const data = await res.json();
        showToast("error", data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      showToast("error", "เกิดข้อผิดพลาด");
    } finally {
      setChangingPassword(false);
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
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">โปรไฟล์</h1>
        <p className="mt-1 text-slate-500 font-medium">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card title="ข้อมูลส่วนตัว">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">person</span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{profile?.name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              <p className="text-xs font-bold text-primary uppercase mt-0.5">
                {profile?.role === "ADMIN" ? "ผู้ดูแลระบบ" : "พนักงาน"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="ชื่อ-นามสกุล" icon="person" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="แผนก" icon="business" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Input label="ตำแหน่ง" icon="work" value={position} onChange={(e) => setPosition(e.target.value)} />
            <Button icon="save" isLoading={saving} onClick={handleSaveProfile}>บันทึกข้อมูล</Button>
          </div>
        </Card>

        <Card title="เปลี่ยนรหัสผ่าน">
          <div className="space-y-4">
            <Input
              label="รหัสผ่านปัจจุบัน"
              icon="lock"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="รหัสผ่านใหม่"
              icon="lock_reset"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              helperText="อย่างน้อย 6 ตัวอักษร"
            />
            <Button variant="outline" icon="lock_reset" isLoading={changingPassword} onClick={handleChangePassword}>
              เปลี่ยนรหัสผ่าน
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
