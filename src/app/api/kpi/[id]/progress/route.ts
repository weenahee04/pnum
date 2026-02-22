import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { currentValue, note } = body;

    if (currentValue === undefined || currentValue === null) {
      return NextResponse.json({ error: "กรุณากรอกค่าปัจจุบัน" }, { status: 400 });
    }

    const kpi = await prisma.kPI.findUnique({ where: { id } });
    if (!kpi) {
      return NextResponse.json({ error: "ไม่พบ KPI" }, { status: 404 });
    }

    if (kpi.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await prisma.kPIProgress.create({
      data: {
        kpiId: id,
        currentValue: parseFloat(currentValue),
        note: note || null,
      },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("KPI progress error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
