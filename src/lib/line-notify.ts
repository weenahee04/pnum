import { prisma } from "@/lib/prisma";

const LINE_NOTIFY_API = "https://notify-api.line.me/api/notify";

/**
 * Send LINE Notify message to a specific user (using their personal token)
 */
export async function sendLineNotify(userId: string, message: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lineToken: true, lineNotifyEnabled: true, name: true },
    });

    if (!user?.lineToken || !user.lineNotifyEnabled) return false;

    const res = await fetch(LINE_NOTIFY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${user.lineToken}`,
      },
      body: new URLSearchParams({ message }),
    });

    if (!res.ok) {
      console.error(`LINE Notify failed for ${user.name}:`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("LINE Notify error:", error);
    return false;
  }
}

/**
 * Send LINE Notify to multiple users
 */
export async function sendLineNotifyBulk(userIds: string[], message: string): Promise<number> {
  let sent = 0;
  for (const userId of userIds) {
    const ok = await sendLineNotify(userId, message);
    if (ok) sent++;
  }
  return sent;
}

/**
 * Send LINE Notify to all admins
 */
export async function notifyAdmins(message: string): Promise<number> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", lineNotifyEnabled: true, lineToken: { not: null } },
    select: { id: true },
  });
  return sendLineNotifyBulk(admins.map((a: { id: string }) => a.id), message);
}

/**
 * Send LINE Notify using the system-wide token (from env)
 */
export async function sendSystemLineNotify(message: string): Promise<boolean> {
  const token = process.env.LINE_NOTIFY_TOKEN;
  if (!token) return false;

  try {
    const res = await fetch(LINE_NOTIFY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({ message }),
    });
    return res.ok;
  } catch (error) {
    console.error("System LINE Notify error:", error);
    return false;
  }
}

// ─── Notification Templates ───

export function notifyCheckIn(userName: string, time: string, type: "IN" | "OUT") {
  const action = type === "IN" ? "เข้างาน" : "ออกงาน";
  return `\n🕐 ลงเวลา${action}\n👤 ${userName}\n⏰ ${time}`;
}

export function notifyLeaveRequest(userName: string, leaveType: string, startDate: string, endDate: string) {
  return `\n📋 คำขอลาใหม่\n👤 ${userName}\n📌 ประเภท: ${leaveType}\n📅 ${startDate} → ${endDate}\nกรุณาอนุมัติในระบบ`;
}

export function notifyLeaveApproval(status: string, leaveType: string, startDate: string, endDate: string, approverName: string) {
  const icon = status === "APPROVED" ? "✅" : "❌";
  const label = status === "APPROVED" ? "อนุมัติ" : "ไม่อนุมัติ";
  return `\n${icon} ผลการพิจารณาใบลา\n📌 ${leaveType}: ${startDate} → ${endDate}\n📝 สถานะ: ${label}\n👤 โดย: ${approverName}`;
}

export function notifyPayroll(month: string, year: string, netSalary: number) {
  return `\n💰 สลิปเงินเดือน\n📅 ${month}/${year}\n💵 เงินสุทธิ: ${netSalary.toLocaleString()} บาท\nดูรายละเอียดในระบบ`;
}

export function notifyEvaluation(evaluatorName: string, period: string) {
  return `\n📊 การประเมินผลใหม่\n👤 ผู้ประเมิน: ${evaluatorName}\n📅 รอบ: ${period}\nดูรายละเอียดในระบบ`;
}

export function notifyRecruitment(jobTitle: string, applicantName: string, stage: string) {
  return `\n📄 อัปเดตการสมัครงาน\n💼 ตำแหน่ง: ${jobTitle}\n👤 ผู้สมัคร: ${applicantName}\n📌 สถานะ: ${stage}`;
}

export function notifyTraining(courseName: string, userName: string) {
  return `\n📚 ลงทะเบียนอบรม\n📖 หลักสูตร: ${courseName}\n👤 ${userName}`;
}
