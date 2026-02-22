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
    const audit = await prisma.seoAudit.findUnique({ where: { id } });
    if (!audit) return NextResponse.json({ error: "ไม่พบผลตรวจ" }, { status: 404 });

    const parsed = JSON.parse(audit.results);
    return NextResponse.json({ audit, checks: parsed.checks, analysis: parsed.analysis });
  } catch (error) {
    console.error("SEO Audit GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
