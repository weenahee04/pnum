import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "ADMIN";

    const records = await prisma.attendance.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 60,
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, leaveType, note } = body;
    const today = new Date().toISOString().split("T")[0];

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    if (existing) {
      return NextResponse.json({ error: "วันนี้บันทึกสถานะแล้ว" }, { status: 400 });
    }

    const record = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        date: today,
        status,
        leaveType: status === "LEAVE" ? leaveType : null,
        note,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
