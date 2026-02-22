import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyLeaveRequest } from "@/lib/line-notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    const requests = await prisma.leaveRequest.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      include: { user: { select: { name: true } }, approvedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Leave GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, startDate, endDate, reason } = await request.json();
    if (!type || !startDate || !endDate || !reason?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const record = await prisma.leaveRequest.create({
      data: { userId: session.user.id, type, startDate, endDate, days, reason: reason.trim() },
    });

    // LINE Notify admins
    notifyAdmins(notifyLeaveRequest(session.user.name, type, startDate, endDate)).catch(() => {});

    return NextResponse.json(record);
  } catch (error) {
    console.error("Leave POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
