import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkKeywordRank } from "@/lib/serpapi";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { keywordId } = await request.json();
    if (!keywordId) return NextResponse.json({ error: "กรุณาระบุ keywordId" }, { status: 400 });

    const kw = await prisma.seoKeyword.findUnique({
      where: { id: keywordId },
      include: { project: { select: { url: true } } },
    });
    if (!kw) return NextResponse.json({ error: "ไม่พบ keyword" }, { status: 404 });

    const result = await checkKeywordRank(kw.keyword, kw.project.url);

    // Save ranking
    if (result.targetRank !== null) {
      await prisma.seoRanking.create({
        data: {
          keywordId: kw.id,
          rank: result.targetRank,
          url: result.targetUrl,
        },
      });

      // Update keyword current/best rank
      await prisma.seoKeyword.update({
        where: { id: kw.id },
        data: {
          currentRank: result.targetRank,
          bestRank: kw.bestRank === null ? result.targetRank : Math.min(kw.bestRank, result.targetRank),
          lastChecked: new Date(),
        },
      });
    } else {
      // Not found in results — save as rank 0 (not ranked)
      await prisma.seoRanking.create({
        data: { keywordId: kw.id, rank: 0, url: null },
      });
      await prisma.seoKeyword.update({
        where: { id: kw.id },
        data: { currentRank: null, lastChecked: new Date() },
      });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("SEO Keyword Check error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: `ตรวจอันดับไม่สำเร็จ: ${message}` }, { status: 500 });
  }
}
