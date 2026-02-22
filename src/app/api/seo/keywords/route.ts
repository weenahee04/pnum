import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "กรุณาระบุ projectId" }, { status: 400 });

    const keywords = await prisma.seoKeyword.findMany({
      where: { projectId },
      include: {
        rankings: { orderBy: { checkedAt: "desc" }, take: 30 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("SEO Keywords GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, keyword } = await request.json();
    if (!projectId || !keyword?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุ projectId และ keyword" }, { status: 400 });
    }

    const existing = await prisma.seoKeyword.findUnique({
      where: { projectId_keyword: { projectId, keyword: keyword.trim() } },
    });
    if (existing) return NextResponse.json({ error: "Keyword นี้มีอยู่แล้ว" }, { status: 400 });

    const kw = await prisma.seoKeyword.create({
      data: { projectId, keyword: keyword.trim() },
    });

    return NextResponse.json(kw);
  } catch (error) {
    console.error("SEO Keywords POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
