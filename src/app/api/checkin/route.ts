import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineNotify, notifyCheckIn } from "@/lib/line-notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    const today = new Date().toISOString().split("T")[0];

    const records = await prisma.checkIn.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      include: { user: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 60,
    });

    const todayRecord = await prisma.checkIn.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    return NextResponse.json({ records, todayRecord });
  } catch (error) {
    console.error("CheckIn GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action, method, latitude, longitude, note } = body;
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    if (action === "checkin") {
      const existing = await prisma.checkIn.findUnique({
        where: { userId_date: { userId: session.user.id, date: today } },
      });
      if (existing) return NextResponse.json({ error: "วันนี้เช็คอินแล้ว" }, { status: 400 });

      const hour = new Date().getHours();
      const minute = new Date().getMinutes();
      const isLate = hour > 9 || (hour === 9 && minute > 0);

      const record = await prisma.checkIn.create({
        data: {
          userId: session.user.id,
          date: today,
          checkInTime: now,
          method: method || "MANUAL",
          latitude: latitude || null,
          longitude: longitude || null,
          status: isLate ? "LATE" : "ON_TIME",
          note: note || null,
        },
      });

      // LINE Notify
      sendLineNotify(session.user.id, notifyCheckIn(session.user.name, now, "IN")).catch(() => {});

      return NextResponse.json(record);
    }

    if (action === "checkout") {
      const existing = await prisma.checkIn.findUnique({
        where: { userId_date: { userId: session.user.id, date: today } },
      });
      if (!existing) return NextResponse.json({ error: "ยังไม่ได้เช็คอิน" }, { status: 400 });
      if (existing.checkOutTime) return NextResponse.json({ error: "เช็คเอาท์แล้ว" }, { status: 400 });

      const hour = new Date().getHours();
      const isEarly = hour < 17;

      const record = await prisma.checkIn.update({
        where: { id: existing.id },
        data: {
          checkOutTime: now,
          status: isEarly ? "EARLY_LEAVE" : existing.status,
        },
      });

      // LINE Notify
      sendLineNotify(session.user.id, notifyCheckIn(session.user.name, now, "OUT")).catch(() => {});

      return NextResponse.json(record);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("CheckIn POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
