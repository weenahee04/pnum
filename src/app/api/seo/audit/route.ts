import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAndAnalyze, runAudit } from "@/lib/seo-analyzer";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, url } = await request.json();
    if (!projectId || !url?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุ projectId และ URL" }, { status: 400 });
    }

    const project = await prisma.seoProject.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "ไม่พบโปรเจค" }, { status: 404 });

    const analysis = await fetchAndAnalyze(url.trim());
    const { checks, score } = runAudit(analysis);

    const audit = await prisma.seoAudit.create({
      data: {
        projectId,
        url: url.trim(),
        score,
        results: JSON.stringify({ analysis, checks }),
      },
    });

    return NextResponse.json({ audit, checks, score, analysis });
  } catch (error) {
    console.error("SEO Audit error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: `ตรวจสอบไม่สำเร็จ: ${message}` }, { status: 500 });
  }
}
