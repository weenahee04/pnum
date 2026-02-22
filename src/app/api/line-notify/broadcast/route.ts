import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineNotifyBulk, sendSystemLineNotify } from "@/lib/line-notify";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, target } = await request.json();
    if (!message) return NextResponse.json({ error: "กรุณาระบุข้อความ" }, { status: 400 });

    const fullMessage = `\n📢 ประกาศจากฝ่ายบุคคล\n${message}`;

    if (target === "system") {
      const ok = await sendSystemLineNotify(fullMessage);
      return NextResponse.json({ success: ok, sent: ok ? 1 : 0 });
    }

    // Send to all users with LINE enabled
    const users = await prisma.user.findMany({
      where: { lineNotifyEnabled: true, lineToken: { not: null } },
      select: { id: true },
    });

    const sent = await sendLineNotifyBulk(
      users.map((u: { id: string }) => u.id),
      fullMessage
    );

    return NextResponse.json({ success: true, sent, total: users.length });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
