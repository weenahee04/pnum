import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins, notifyRecruitment } from "@/lib/line-notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const applications = await prisma.jobApplication.findMany({
      include: { posting: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Applications GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postingId, name, email, phone, coverLetter } = await request.json();
    if (!postingId || !name || !email) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const application = await prisma.jobApplication.create({
      data: { postingId, name, email, phone: phone || "", coverLetter: coverLetter || null },
      include: { posting: { select: { title: true } } },
    });

    // LINE Notify admins
    notifyAdmins(notifyRecruitment(application.posting.title, name, "สมัครใหม่")).catch(() => {});

    return NextResponse.json(application);
  } catch (error) {
    console.error("Applications POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
