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
    const all = searchParams.get("all") === "true";
    const isAdmin = session.user.role === "ADMIN";

    const kpis = await prisma.kPI.findMany({
      where: isAdmin && all ? {} : { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        progress: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ kpis });
  } catch (error) {
    console.error("KPI GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, description, target, weight, period } = body;

    if (!userId || !title || target === undefined || weight === undefined) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const kpi = await prisma.kPI.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        target: parseFloat(target),
        weight: parseFloat(weight),
        period: period || "2026-Q1",
      },
    });

    return NextResponse.json(kpi);
  } catch (error) {
    console.error("KPI POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
