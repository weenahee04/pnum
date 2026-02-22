import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineNotify, notifyAdmins, notifyTraining } from "@/lib/line-notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { userId: session.user.id },
      include: { course: { select: { title: true, instructor: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Enrollments GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { courseId } = await request.json();
    if (!courseId) return NextResponse.json({ error: "กรุณาระบุหลักสูตร" }, { status: 400 });

    const existing = await prisma.trainingEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "ลงทะเบียนแล้ว" }, { status: 400 });

    const enrollment = await prisma.trainingEnrollment.create({
      data: { courseId, userId: session.user.id },
      include: { course: { select: { title: true } } },
    });

    // LINE Notify user + admins
    const msg = notifyTraining(enrollment.course.title, session.user.name);
    sendLineNotify(session.user.id, msg).catch(() => {});
    notifyAdmins(msg).catch(() => {});

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Enrollments POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
