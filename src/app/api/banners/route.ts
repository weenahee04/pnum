import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - fetch active banners (public for authenticated users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date().toISOString().split("T")[0];

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: today }, endDate: null },
          { startDate: null, endDate: { gte: today } },
          { startDate: { lte: today }, endDate: { gte: today } },
        ],
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Banners GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST - create a new banner (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, imageUrl, linkUrl, order, startDate, endDate } = await request.json();
    if (!title || !imageUrl) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและรูปภาพ" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl,
        linkUrl: linkUrl || null,
        order: order ?? 0,
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Banners POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
