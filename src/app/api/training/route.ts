import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const courses = await prisma.trainingCourse.findMany({
      include: { _count: { select: { enrollments: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Training GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, instructor, category, duration, maxSeats, startDate, endDate } = await request.json();
    if (!title || !instructor) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

    const course = await prisma.trainingCourse.create({
      data: {
        title, description: description || null, instructor, category: category || "GENERAL",
        duration: duration || "", maxSeats: maxSeats || 30,
        startDate: startDate || null, endDate: endDate || null,
      },
    });
    return NextResponse.json(course);
  } catch (error) {
    console.error("Training POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
