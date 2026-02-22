import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const userName = searchParams.get("userName");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 50;

    const where: Record<string, unknown> = {};
    if (date) where.date = date;
    if (userName) {
      where.user = { name: { contains: userName } };
    }

    const reports = await prisma.dailyReport.findMany({
      where,
      include: {
        user: { select: { name: true, department: true, position: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Reports GET error:", error);
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
    const { content, problems, tomorrowPlan } = body;
    const today = new Date().toISOString().split("T")[0];

    if (!content?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกเนื้อหารายงาน" }, { status: 400 });
    }

    const report = await prisma.dailyReport.create({
      data: {
        userId: session.user.id,
        date: today,
        content: content.trim(),
        problems: problems?.trim() || null,
        tomorrowPlan: tomorrowPlan?.trim() || null,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Reports POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
