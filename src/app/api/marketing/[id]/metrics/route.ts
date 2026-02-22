import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { date, impressions, reach, clicks, conversions, revenue, spent, engagement, videoViews, leads } = body;

    if (!date) return NextResponse.json({ error: "กรุณาระบุวันที่" }, { status: 400 });

    const imp = impressions || 0;
    const clk = clicks || 0;
    const conv = conversions || 0;
    const sp = spent || 0;
    const rev = revenue || 0;

    const ctr = imp > 0 ? Math.round((clk / imp) * 10000) / 100 : 0;
    const cpc = clk > 0 ? Math.round((sp / clk) * 100) / 100 : 0;
    const cpm = imp > 0 ? Math.round((sp / imp) * 1000 * 100) / 100 : 0;
    const conversionRate = clk > 0 ? Math.round((conv / clk) * 10000) / 100 : 0;
    const costPerConversion = conv > 0 ? Math.round((sp / conv) * 100) / 100 : 0;
    const roas = sp > 0 ? Math.round((rev / sp) * 100) / 100 : 0;

    const metric = await prisma.campaignMetric.upsert({
      where: { campaignId_date: { campaignId: id, date } },
      update: {
        impressions: imp, reach: reach || 0, clicks: clk, ctr, cpc, cpm,
        conversions: conv, conversionRate, costPerConversion,
        revenue: rev, roas, spent: sp,
        engagement: engagement || 0, videoViews: videoViews || 0, leads: leads || 0,
      },
      create: {
        campaignId: id, date,
        impressions: imp, reach: reach || 0, clicks: clk, ctr, cpc, cpm,
        conversions: conv, conversionRate, costPerConversion,
        revenue: rev, roas, spent: sp,
        engagement: engagement || 0, videoViews: videoViews || 0, leads: leads || 0,
      },
    });

    // Update campaign total spent
    const totalSpent = await prisma.campaignMetric.aggregate({
      where: { campaignId: id },
      _sum: { spent: true },
    });
    await prisma.campaign.update({
      where: { id },
      data: { spent: totalSpent._sum.spent || 0, updatedAt: new Date() },
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error("Metrics POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
