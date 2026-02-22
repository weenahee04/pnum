import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const project = await prisma.seoProject.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        audits: { orderBy: { createdAt: "desc" }, take: 10 },
        keywords: {
          include: {
            rankings: { orderBy: { checkedAt: "desc" }, take: 30 },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) return NextResponse.json({ error: "ไม่พบโปรเจค" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    console.error("SEO Project GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.seoProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SEO Project DELETE error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
