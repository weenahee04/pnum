import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      include: {
        createdBy: { select: { name: true } },
        metrics: { orderBy: { date: "desc" }, take: 30 },
        _count: { select: { metrics: true, insights: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Marketing GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, platform, type, objective, targetAudience, budget, startDate, endDate, landingUrl, notes } = body;

    if (!name?.trim() || !platform) {
      return NextResponse.json({ error: "กรุณาระบุชื่อแคมเปญและแพลตฟอร์ม" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        platform,
        type: type || "AWARENESS",
        objective: objective || null,
        targetAudience: targetAudience || null,
        budget: budget || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        landingUrl: landingUrl || null,
        notes: notes || null,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Marketing POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
