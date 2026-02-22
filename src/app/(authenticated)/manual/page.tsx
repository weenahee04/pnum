"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState("login");
  const [searchQuery, setSearchQuery] = useState("");

  const sections: Section[] = [
    {
      id: "login",
      title: "การเข้าสู่ระบบ",
      icon: "login",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">วิธีเข้าสู่ระบบ</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>เปิดเว็บไซต์ระบบ HR System</li>
            <li>กรอก <strong>อีเมล</strong> และ <strong>รหัสผ่าน</strong></li>
            <li>กดปุ่ม <strong>&quot;เข้าสู่ระบบ&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">บัญชีทดสอบ</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-4 py-2 text-left font-bold">บทบาท</th>
                  <th className="border border-slate-200 px-4 py-2 text-left font-bold">อีเมล</th>
                  <th className="border border-slate-200 px-4 py-2 text-left font-bold">รหัสผ่าน</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 px-4 py-2">ผู้ดูแลระบบ (Admin)</td>
                  <td className="border border-slate-200 px-4 py-2 font-mono text-primary">admin@company.com</td>
                  <td className="border border-slate-200 px-4 py-2 font-mono">admin123</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-4 py-2">พนักงาน (Employee)</td>
                  <td className="border border-slate-200 px-4 py-2 font-mono text-primary">somchai@company.com</td>
                  <td className="border border-slate-200 px-4 py-2 font-mono">employee123</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สิทธิ์การเข้าถึง</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-bold text-blue-800 mb-1">Admin (ผู้ดูแลระบบ)</p>
              <p className="text-sm text-blue-600">เข้าถึงได้ทุกเมนู รวมถึงจัดการพนักงานและ KPI</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-bold text-green-800 mb-1">Employee (พนักงาน)</p>
              <p className="text-sm text-green-600">เข้าถึงเมนูทั่วไป ดูข้อมูลของตัวเองเท่านั้น</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dashboard",
      title: "แดชบอร์ด",
      icon: "dashboard",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">ภาพรวมแดชบอร์ด</h3>
          <p className="text-slate-600">หน้าแดชบอร์ดแสดงภาพรวมของระบบทั้งหมด</p>
          <div className="space-y-3">
            <InfoCard icon="groups" title="สรุปจำนวนพนักงาน" desc="แสดงจำนวนพนักงานทั้งหมดในระบบ" />
            <InfoCard icon="event_available" title="สถิติการเข้างาน" desc="แสดงสถิติการเข้างานวันนี้" />
            <InfoCard icon="pending_actions" title="สถิติใบลา" desc="แสดงใบลาที่รออนุมัติ" />
            <InfoCard icon="bar_chart" title="กราฟ" desc="แสดงข้อมูลการเข้างานรายสัปดาห์" />
            <InfoCard icon="image" title="แบนเนอร์" desc="ประชาสัมพันธ์ (Admin จัดการได้)" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">การจัดการแบนเนอร์ (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กดปุ่ม <strong>&quot;จัดการแบนเนอร์&quot;</strong> บนแดชบอร์ด</li>
            <li>เพิ่มแบนเนอร์ใหม่: กรอก ชื่อ, URL รูปภาพ, ลิงก์ปลายทาง</li>
            <li>เปิด/ปิดแบนเนอร์ หรือลบแบนเนอร์ที่ไม่ต้องการ</li>
          </ol>
        </div>
      ),
    },
    {
      id: "checkin",
      title: "ลงเวลาอัจฉริยะ",
      icon: "fingerprint",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">วิธีลงเวลาเข้างาน</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;ลงเวลาอัจฉริยะ&quot;</strong></li>
            <li>เลือก <strong>วิธีการลงเวลา</strong></li>
            <li>เพิ่ม <strong>หมายเหตุ</strong> (ถ้ามี)</li>
            <li>กดปุ่ม <strong>&quot;ลงเวลาเข้างาน&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">วิธีการลงเวลา</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "touch_app", label: "ลงเวลาเอง", desc: "Manual" },
              { icon: "location_on", label: "GPS", desc: "ตำแหน่ง GPS" },
              { icon: "qr_code_scanner", label: "QR Code", desc: "สแกน QR" },
              { icon: "face", label: "Face ID", desc: "จดจำใบหน้า" },
            ].map((m) => (
              <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="material-symbols-outlined text-2xl text-primary">{m.icon}</span>
                <p className="font-bold text-sm mt-1">{m.label}</p>
                <p className="text-xs text-slate-500">{m.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สถานะการลงเวลา</h3>
          <div className="space-y-2">
            <StatusBadge color="green" label="ตรงเวลา" desc="เข้างานก่อนหรือตรงเวลา" />
            <StatusBadge color="yellow" label="มาสาย" desc="เข้างานหลังเวลาที่กำหนด" />
            <StatusBadge color="red" label="กลับก่อน" desc="ออกงานก่อนเวลาที่กำหนด" />
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">วิธีลงเวลาออกงาน</h3>
          <p className="text-slate-600">เมื่อลงเวลาเข้างานแล้ว ปุ่มจะเปลี่ยนเป็น <strong>&quot;ลงเวลาออกงาน&quot;</strong> กดปุ่มเพื่อบันทึกเวลาออก</p>
        </div>
      ),
    },
    {
      id: "leave",
      title: "จัดการใบลา",
      icon: "event_busy",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">ประเภทการลา</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "ลาป่วย", icon: "local_hospital", color: "bg-red-50 text-red-700" },
              { label: "ลากิจ", icon: "work", color: "bg-blue-50 text-blue-700" },
              { label: "ลาพักร้อน", icon: "beach_access", color: "bg-amber-50 text-amber-700" },
              { label: "ลาคลอด", icon: "child_care", color: "bg-pink-50 text-pink-700" },
              { label: "อื่นๆ", icon: "more_horiz", color: "bg-slate-50 text-slate-700" },
            ].map((t) => (
              <div key={t.label} className={`${t.color} rounded-xl p-3 flex items-center gap-2`}>
                <span className="material-symbols-outlined">{t.icon}</span>
                <span className="font-bold text-sm">{t.label}</span>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">วิธียื่นใบลา (พนักงาน)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;จัดการใบลา&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;ยื่นใบลา&quot;</strong></li>
            <li>กรอก: ประเภทการลา, วันที่เริ่ม-สิ้นสุด, เหตุผล</li>
            <li>กดปุ่ม <strong>&quot;ส่งคำขอ&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">วิธีอนุมัติใบลา (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ดูรายการใบลาที่มีสถานะ <strong>&quot;รออนุมัติ&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;อนุมัติ&quot;</strong> หรือ <strong>&quot;ไม่อนุมัติ&quot;</strong></li>
            <li>ระบบจะแจ้งเตือนพนักงานผ่าน LINE (ถ้าเปิดใช้งาน)</li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สถานะใบลา</h3>
          <div className="space-y-2">
            <StatusBadge color="yellow" label="รออนุมัติ" desc="ใบลาอยู่ระหว่างรอการพิจารณา" />
            <StatusBadge color="green" label="อนุมัติ" desc="ใบลาได้รับการอนุมัติแล้ว" />
            <StatusBadge color="red" label="ไม่อนุมัติ" desc="ใบลาถูกปฏิเสธ" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="font-bold text-blue-800 mb-1">ยอดวันลาคงเหลือ</p>
            <p className="text-sm text-blue-600">ระบบแสดงยอดวันลาคงเหลือแยกตามประเภท: จำนวนวันลาทั้งหมด, ใช้ไปแล้ว, คงเหลือ</p>
          </div>
        </div>
      ),
    },
    {
      id: "attendance",
      title: "ขาด/ลา/มาสาย",
      icon: "event_available",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">ดูสรุปประวัติการเข้างาน</h3>
          <div className="space-y-3">
            <InfoCard icon="list" title="รายการเข้างาน" desc="ดูประวัติเข้างานทั้งหมดพร้อมวันที่และเวลา" />
            <InfoCard icon="flag" title="สถานะ" desc="ตรงเวลา / มาสาย / ขาด" />
            <InfoCard icon="filter_alt" title="ตัวกรอง" desc="กรองตามช่วงวันที่" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <p className="font-bold text-amber-800 mb-1">สำหรับ Admin</p>
            <p className="text-sm text-amber-600">ดูข้อมูลของพนักงานทุกคน กรองตามพนักงานหรือแผนก</p>
          </div>
        </div>
      ),
    },
    {
      id: "reports",
      title: "รายงานประจำวัน",
      icon: "description",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">วิธีสร้างรายงาน</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;รายงานประจำวัน&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;สร้างรายงาน&quot;</strong></li>
            <li>กรอกเนื้อหา: สิ่งที่ทำวันนี้, ปัญหาที่พบ, แผนงานวันถัดไป</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="font-bold text-green-800 mb-1">พนักงาน</p>
              <p className="text-sm text-green-600">ดูรายงานของตัวเองเท่านั้น</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="font-bold text-blue-800 mb-1">Admin</p>
              <p className="text-sm text-blue-600">ดูรายงานของพนักงานทุกคน กรองตามวันที่หรือพนักงาน</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "payroll",
      title: "คำนวณเงินเดือน",
      icon: "payments",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">รายละเอียดเงินเดือน</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-4 py-2 text-left font-bold">รายการ</th>
                  <th className="border border-slate-200 px-4 py-2 text-left font-bold">คำอธิบาย</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["เงินเดือนพื้นฐาน", "ฐานเงินเดือนตามตำแหน่ง"],
                  ["ค่าล่วงเวลา (OT)", "คำนวณจากชั่วโมง OT"],
                  ["โบนัส", "เงินโบนัสพิเศษ"],
                  ["เบี้ยเลี้ยง", "ค่าเบี้ยเลี้ยงต่างๆ"],
                  ["หักเงิน", "รายการหักเงินอื่นๆ"],
                  ["ประกันสังคม", "หักประกันสังคม"],
                  ["ภาษี", "หักภาษี ณ ที่จ่าย"],
                  ["เงินเดือนสุทธิ", "ยอดรับจริง"],
                ].map(([item, desc]) => (
                  <tr key={item}>
                    <td className={`border border-slate-200 px-4 py-2 ${item === "เงินเดือนสุทธิ" ? "font-bold text-primary" : ""}`}>{item}</td>
                    <td className={`border border-slate-200 px-4 py-2 ${item === "เงินเดือนสุทธิ" ? "font-bold text-primary" : ""}`}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">ขั้นตอนสำหรับ Admin</h3>
          <div className="flex flex-col md:flex-row gap-3">
            {[
              { step: "1", label: "สร้าง", desc: "สร้างเงินเดือน เลือกเดือน", color: "bg-blue-50 border-blue-200 text-blue-800" },
              { step: "2", label: "ยืนยัน", desc: "ตรวจสอบแล้วกดยืนยัน", color: "bg-amber-50 border-amber-200 text-amber-800" },
              { step: "3", label: "จ่าย", desc: "กดจ่ายเงินเดือน", color: "bg-green-50 border-green-200 text-green-800" },
            ].map((s) => (
              <div key={s.step} className={`flex-1 ${s.color} border rounded-xl p-4 text-center`}>
                <div className="text-2xl font-black">{s.step}</div>
                <p className="font-bold">{s.label}</p>
                <p className="text-xs mt-1">{s.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สถานะเงินเดือน</h3>
          <div className="space-y-2">
            <StatusBadge color="gray" label="ร่าง" desc="ยังไม่ยืนยัน แก้ไขได้" />
            <StatusBadge color="yellow" label="ยืนยันแล้ว" desc="ตรวจสอบแล้ว รอจ่าย" />
            <StatusBadge color="green" label="จ่ายแล้ว" desc="จ่ายเงินเดือนเรียบร้อย" />
          </div>
        </div>
      ),
    },
    {
      id: "recruitment",
      title: "สรรหาบุคลากร",
      icon: "person_search",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">สร้างประกาศรับสมัคร (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;สรรหาบุคลากร&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;สร้างประกาศ&quot;</strong></li>
            <li>กรอก: ตำแหน่งงาน, แผนก, เงินเดือน, สถานที่, ประเภท, รายละเอียด</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สมัครงาน (พนักงาน)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ดูรายการตำแหน่งที่เปิดรับ</li>
            <li>กดปุ่ม <strong>&quot;สมัคร&quot;</strong></li>
            <li>กรอกข้อมูลผู้สมัคร (ชื่อ, อีเมล, เบอร์โทร)</li>
            <li>กดปุ่ม <strong>&quot;ส่งใบสมัคร&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">ขั้นตอนการสรรหา</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "สมัคร", color: "bg-slate-100 text-slate-700" },
              { label: "คัดกรอง", color: "bg-blue-100 text-blue-700" },
              { label: "สัมภาษณ์", color: "bg-amber-100 text-amber-700" },
              { label: "เสนอ", color: "bg-green-100 text-green-700" },
              { label: "รับเข้าทำงาน", color: "bg-emerald-100 text-emerald-700" },
              { label: "ปฏิเสธ", color: "bg-red-100 text-red-700" },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-1">
                <span className={`${s.color} px-3 py-1 rounded-full text-sm font-bold`}>{s.label}</span>
                {i < 4 && <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "training",
      title: "ฝึกอบรม",
      icon: "school",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">หมวดหมู่หลักสูตร</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "ทั่วไป", icon: "menu_book", color: "bg-slate-50" },
              { label: "เทคนิค", icon: "code", color: "bg-blue-50" },
              { label: "Soft Skill", icon: "psychology", color: "bg-purple-50" },
              { label: "กฎระเบียบ", icon: "gavel", color: "bg-amber-50" },
            ].map((c) => (
              <div key={c.label} className={`${c.color} rounded-xl p-3 text-center`}>
                <span className="material-symbols-outlined text-2xl text-primary">{c.icon}</span>
                <p className="font-bold text-sm mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สร้างหลักสูตร (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กดปุ่ม <strong>&quot;สร้างหลักสูตร&quot;</strong></li>
            <li>กรอก: ชื่อหลักสูตร, วิทยากร, หมวดหมู่, ระยะเวลา, จำนวนที่นั่ง, วันที่</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">ลงทะเบียน (พนักงาน)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ดูรายการหลักสูตรที่เปิดรับ</li>
            <li>กดปุ่ม <strong>&quot;ลงทะเบียน&quot;</strong></li>
            <li>ระบบจะบันทึกและแจ้งเตือน Admin</li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">สถานะหลักสูตร</h3>
          <div className="space-y-2">
            <StatusBadge color="blue" label="เร็วๆ นี้" desc="ยังไม่เริ่ม" />
            <StatusBadge color="yellow" label="กำลังดำเนินการ" desc="อยู่ระหว่างอบรม" />
            <StatusBadge color="green" label="เสร็จสิ้น" desc="อบรมเสร็จแล้ว" />
            <StatusBadge color="red" label="ยกเลิก" desc="ยกเลิกหลักสูตร" />
          </div>
        </div>
      ),
    },
    {
      id: "evaluation",
      title: "ประเมิน 360°",
      icon: "rate_review",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">ประเภทการประเมิน</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "ประเมินตนเอง", icon: "person" },
              { label: "เพื่อนร่วมงาน", icon: "group" },
              { label: "หัวหน้า", icon: "supervisor_account" },
              { label: "ลูกน้อง", icon: "people" },
            ].map((t) => (
              <div key={t.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="material-symbols-outlined text-2xl text-primary">{t.icon}</span>
                <p className="font-bold text-sm mt-1">{t.label}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">หมวดการประเมิน (คะแนน 1-5)</h3>
          <div className="space-y-2">
            {[
              { label: "คุณภาพงาน", desc: "ผลงานมีคุณภาพดีเพียงใด" },
              { label: "การทำงานเป็นทีม", desc: "ร่วมมือกับผู้อื่นได้ดีเพียงใด" },
              { label: "การสื่อสาร", desc: "สื่อสารได้ชัดเจนเพียงใด" },
              { label: "ภาวะผู้นำ", desc: "มีความเป็นผู้นำเพียงใด" },
              { label: "ความคิดริเริ่ม", desc: "มีความคิดสร้างสรรค์เพียงใด" },
            ].map((c, i) => (
              <div key={c.label} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{i + 1}</span>
                <div>
                  <p className="font-bold text-sm">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">วิธีประเมิน</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กดปุ่ม <strong>&quot;ประเมินใหม่&quot;</strong></li>
            <li>เลือก <strong>ผู้ถูกประเมิน</strong> และ <strong>ประเภท</strong></li>
            <li>ให้คะแนนแต่ละหมวด (1-5)</li>
            <li>กรอก จุดแข็ง, จุดที่ควรปรับปรุง, ความคิดเห็น</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>
        </div>
      ),
    },
    {
      id: "surveys",
      title: "แบบประเมิน",
      icon: "quiz",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">สร้างแบบประเมิน (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กดปุ่ม <strong>&quot;สร้างแบบประเมิน&quot;</strong></li>
            <li>กรอก ชื่อแบบประเมิน และ คำอธิบาย</li>
            <li>เพิ่มคำถาม — แต่ละข้อเลือกประเภท:</li>
          </ol>
          <div className="grid grid-cols-3 gap-3 ml-6">
            {[
              { label: "Rating", desc: "ให้คะแนน 1-5", icon: "star" },
              { label: "Text", desc: "ตอบข้อความ", icon: "edit_note" },
              { label: "Choice", desc: "เลือกตัวเลือก", icon: "radio_button_checked" },
            ].map((t) => (
              <div key={t.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <span className="material-symbols-outlined text-xl text-primary">{t.icon}</span>
                <p className="font-bold text-sm">{t.label}</p>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">ตอบแบบประเมิน (พนักงาน)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ดูรายการแบบประเมินที่เปิดอยู่</li>
            <li>กดปุ่ม <strong>&quot;ตอบแบบประเมิน&quot;</strong></li>
            <li>ตอบคำถามทุกข้อ → กด <strong>&quot;ส่งคำตอบ&quot;</strong></li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
            <p className="font-bold text-blue-800 mb-1">ดูผลลัพธ์ (Admin)</p>
            <p className="text-sm text-blue-600">กดปุ่ม &quot;ดูผลลัพธ์&quot; เพื่อดูสรุปคำตอบ จำนวนผู้ตอบ และสถิติ</p>
          </div>
        </div>
      ),
    },
    {
      id: "kpi",
      title: "KPI",
      icon: "trending_up",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">สร้าง KPI (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;จัดการ KPI&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;สร้าง KPI&quot;</strong></li>
            <li>กรอก: ชื่อ KPI, คำอธิบาย, เป้าหมาย, น้ำหนัก (%), ช่วงเวลา, พนักงาน</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">อัพเดทความคืบหน้า (พนักงาน)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;KPI&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;อัพเดท&quot;</strong> ที่ KPI นั้น</li>
            <li>กรอก ค่าปัจจุบัน และ หมายเหตุ</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">การแสดงผล</h3>
          <div className="space-y-3">
            <InfoCard icon="donut_large" title="แถบความคืบหน้า" desc="Progress Bar เทียบกับเป้าหมาย" />
            <InfoCard icon="history" title="ประวัติการอัพเดท" desc="ดูประวัติทั้งหมดของ KPI" />
            <InfoCard icon="visibility" title="Admin" desc="ดู KPI ของพนักงานทุกคนได้" />
          </div>
        </div>
      ),
    },
    {
      id: "line-notify",
      title: "แจ้งเตือน LINE",
      icon: "notifications",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">การตั้งค่า</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;แจ้งเตือน LINE&quot;</strong></li>
            <li>กรอก <strong>LINE Notify Token</strong></li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
            <li>กดปุ่ม <strong>&quot;ทดสอบ&quot;</strong> เพื่อทดสอบ</li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">การแจ้งเตือนอัตโนมัติ</h3>
          <div className="space-y-2">
            {[
              { icon: "fingerprint", label: "ลงเวลาเข้า/ออกงานสำเร็จ" },
              { icon: "event_busy", label: "ใบลาได้รับการอนุมัติ/ปฏิเสธ" },
              { icon: "payments", label: "เงินเดือนถูกจ่าย" },
              { icon: "rate_review", label: "ได้รับการประเมินใหม่" },
              { icon: "person_search", label: "มีใบสมัครงานใหม่ (แจ้ง Admin)" },
              { icon: "school", label: "มีผู้ลงทะเบียนอบรมใหม่" },
            ].map((n) => (
              <div key={n.label} className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
                <span className="material-symbols-outlined text-green-600">{n.icon}</span>
                <p className="text-sm font-medium text-green-800">{n.label}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-6">Broadcast (Admin)</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กรอกข้อความที่ต้องการส่ง</li>
            <li>เลือก <strong>ส่งถึงทุกคน</strong> หรือ <strong>ส่งถึงระบบ</strong></li>
            <li>กดปุ่ม <strong>&quot;ส่ง&quot;</strong></li>
          </ol>
        </div>
      ),
    },
    {
      id: "seo",
      title: "SEO Analyzer",
      icon: "search_insights",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">สร้างโปรเจค SEO</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กดปุ่ม <strong>&quot;สร้างโปรเจค&quot;</strong></li>
            <li>กรอก ชื่อโปรเจค และ URL เว็บไซต์</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">ฟีเจอร์</h3>
          <div className="space-y-3">
            <InfoCard icon="analytics" title="วิเคราะห์เว็บไซต์" desc="ตรวจสอบ Title, Meta Description, Headings, Images, Links" />
            <InfoCard icon="key" title="ติดตาม Keywords" desc="เพิ่ม Keywords และตรวจสอบอันดับบน Google" />
            <InfoCard icon="fact_check" title="SEO Audit" desc="ตรวจสอบ SEO พร้อมคะแนนและคำแนะนำ" />
          </div>
        </div>
      ),
    },
    {
      id: "profile",
      title: "โปรไฟล์",
      icon: "person",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">แก้ไขข้อมูลส่วนตัว</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ไปที่เมนู <strong>&quot;โปรไฟล์&quot;</strong></li>
            <li>แก้ไข: ชื่อ-นามสกุล, แผนก, ตำแหน่ง</li>
            <li>กดปุ่ม <strong>&quot;บันทึก&quot;</strong></li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">เปลี่ยนรหัสผ่าน</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>กรอก <strong>รหัสผ่านเดิม</strong></li>
            <li>กรอก <strong>รหัสผ่านใหม่</strong> (อย่างน้อย 6 ตัวอักษร)</li>
            <li>กรอก <strong>ยืนยันรหัสผ่านใหม่</strong></li>
            <li>กดปุ่ม <strong>&quot;เปลี่ยนรหัสผ่าน&quot;</strong></li>
          </ol>
        </div>
      ),
    },
    {
      id: "admin",
      title: "ผู้ดูแลระบบ",
      icon: "admin_panel_settings",
      content: (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-bold text-red-800 mb-1">เมนูเฉพาะ Admin เท่านั้น</p>
            <p className="text-sm text-red-600">เมนูนี้จะแสดงเฉพาะผู้ใช้ที่มีบทบาท Admin</p>
          </div>

          <h3 className="text-lg font-bold text-slate-800 mt-4">จัดการพนักงาน</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>ดูรายชื่อพนักงานทั้งหมด</li>
            <li><strong>เพิ่มพนักงานใหม่</strong>: กรอก ชื่อ, อีเมล, รหัสผ่าน, บทบาท, แผนก, ตำแหน่ง, เงินเดือน</li>
            <li><strong>แก้ไขข้อมูล</strong>: กดปุ่มแก้ไขที่พนักงานนั้น</li>
            <li><strong>ลบพนักงาน</strong>: กดปุ่มลบ (ระวัง! ลบแล้วกู้คืนไม่ได้)</li>
          </ol>

          <h3 className="text-lg font-bold text-slate-800 mt-6">จัดการ KPI</h3>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>ดู KPI ทั้งหมดของทุกพนักงาน</li>
            <li>สร้าง KPI ใหม่ให้พนักงาน</li>
            <li>ดูความคืบหน้าของแต่ละ KPI</li>
          </ul>
        </div>
      ),
    },
    {
      id: "faq",
      title: "คำถามที่พบบ่อย",
      icon: "help",
      content: (
        <div className="space-y-4">
          {[
            { q: "ลืมรหัสผ่านทำอย่างไร?", a: "ติดต่อผู้ดูแลระบบ (Admin) เพื่อรีเซ็ตรหัสผ่าน" },
            { q: "ลงเวลาผิดแก้ไขได้ไหม?", a: "ติดต่อ Admin เพื่อแก้ไขข้อมูลการลงเวลา" },
            { q: "ดูสลิปเงินเดือนย้อนหลังได้ไหม?", a: "ได้ เลือกเดือนที่ต้องการดูในหน้า \"คำนวณเงินเดือน\"" },
            { q: "LINE แจ้งเตือนไม่ทำงาน?", a: "ตรวจสอบว่า LINE Notify Token ถูกต้อง และกดปุ่ม \"ทดสอบ\" เพื่อตรวจสอบ" },
            { q: "ระบบรองรับกี่ภาษา?", a: "ปัจจุบันรองรับภาษาไทยเท่านั้น" },
          ].map((faq) => (
            <div key={faq.q} className="bg-slate-50 rounded-xl p-4">
              <p className="font-bold text-slate-800 mb-1">Q: {faq.q}</p>
              <p className="text-sm text-slate-600">A: {faq.a}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const filteredSections = searchQuery
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sections;

  const activeContent = sections.find((s) => s.id === activeSection);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">คู่มือการใช้งาน</h1>
        <p className="text-slate-500 mt-1">คู่มือการใช้งานระบบ HR System ทั้งหมด</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <Card>
            <div className="p-4">
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="ค้นหาหัวข้อ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 text-left ${
                      activeSection === section.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-slate-500 hover:bg-primary-50 hover:text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{section.icon}</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Card>
            <div className="p-6">
              {activeContent && (
                <>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-xl">{activeContent.icon}</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{activeContent.title}</h2>
                  </div>
                  {activeContent.content}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
      <span className="material-symbols-outlined text-primary mt-0.5">{icon}</span>
      <div>
        <p className="font-bold text-sm text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function StatusBadge({ color, label, desc }: { color: string; label: string; desc: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-100 text-green-700 border-green-200",
    yellow: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    gray: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <div className="flex items-center gap-3">
      <span className={`${colors[color]} border px-3 py-1 rounded-full text-xs font-bold min-w-[80px] text-center`}>{label}</span>
      <span className="text-sm text-slate-600">{desc}</span>
    </div>
  );
}
