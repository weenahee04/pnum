import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendLineNotify } from "@/lib/line-notify";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ok = await sendLineNotify(
      session.user.id,
      `\n🔔 ทดสอบการแจ้งเตือน LINE\n✅ เชื่อมต่อสำเร็จ!\n👤 ${session.user.name}\n🏢 ระบบ HR Management`
    );

    if (ok) return NextResponse.json({ success: true, message: "ส่งข้อความทดสอบสำเร็จ" });
    return NextResponse.json({ error: "ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบ Token" }, { status: 400 });
  } catch (error) {
    console.error("LINE test error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
