import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInsights } from "@/lib/marketing-insights";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { metrics: { orderBy: { date: "desc" } } },
    });

    if (!campaign) return NextResponse.json({ error: "ไม่พบแคมเปญ" }, { status: 404 });

    const insightResults = generateInsights(campaign);

    // Delete old insights for this campaign and save new ones
    await prisma.marketingInsight.deleteMany({ where: { campaignId: id } });

    const saved = await Promise.all(
      insightResults.map((insight) =>
        prisma.marketingInsight.create({
          data: {
            campaignId: id,
            type: insight.type,
            category: insight.category,
            title: insight.title,
            description: insight.description,
            priority: insight.priority,
            actionable: insight.actionable,
          },
        })
      )
    );

    return NextResponse.json({ insights: saved, count: saved.length });
  } catch (error) {
    console.error("Insights POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
