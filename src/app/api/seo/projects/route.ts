import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projects = await prisma.seoProject.findMany({
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { audits: true, keywords: true } },
        audits: { orderBy: { createdAt: "desc" }, take: 1, select: { score: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("SEO Projects GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, url } = await request.json();
    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและ URL" }, { status: 400 });
    }

    // Validate URL
    try { new URL(url); } catch {
      return NextResponse.json({ error: "URL ไม่ถูกต้อง" }, { status: 400 });
    }

    const project = await prisma.seoProject.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        createdById: session.user.id,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("SEO Projects POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
