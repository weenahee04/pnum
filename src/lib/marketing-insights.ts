interface MetricData {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  conversionRate: number;
  costPerConversion: number;
  revenue: number;
  roas: number;
  spent: number;
  engagement: number;
  videoViews: number;
  leads: number;
}

interface CampaignData {
  id: string;
  name: string;
  platform: string;
  type: string;
  status: string;
  budget: number;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  metrics: MetricData[];
}

export interface InsightResult {
  type: "RECOMMENDATION" | "WARNING" | "OPPORTUNITY" | "PERFORMANCE";
  category: "BUDGET" | "AUDIENCE" | "CREATIVE" | "TIMING" | "PLATFORM" | "GENERAL";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  actionable: boolean;
}

export function generateInsights(campaign: CampaignData): InsightResult[] {
  const insights: InsightResult[] = [];
  const metrics = campaign.metrics;

  if (metrics.length === 0) {
    insights.push({
      type: "RECOMMENDATION",
      category: "GENERAL",
      title: "เริ่มเก็บข้อมูล",
      description: "ยังไม่มีข้อมูลเมตริก กรุณาเพิ่มข้อมูลรายวันเพื่อให้ระบบวิเคราะห์และแนะนำได้",
      priority: "HIGH",
      actionable: true,
    });
    return insights;
  }

  // Aggregate totals
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalSpent = metrics.reduce((s, m) => s + m.spent, 0);
  const totalEngagement = metrics.reduce((s, m) => s + m.engagement, 0);
  const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpent / totalClicks : 0;
  const avgConvRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const overallRoas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
  const budgetUsed = campaign.budget > 0 ? (totalSpent / campaign.budget) * 100 : 0;

  // === BUDGET INSIGHTS ===
  if (budgetUsed > 90) {
    insights.push({
      type: "WARNING",
      category: "BUDGET",
      title: "งบประมาณใกล้หมด",
      description: `ใช้งบไปแล้ว ${budgetUsed.toFixed(1)}% (${totalSpent.toLocaleString()} / ${campaign.budget.toLocaleString()} บาท) ควรพิจารณาเพิ่มงบหรือหยุดแคมเปญ`,
      priority: "HIGH",
      actionable: true,
    });
  } else if (budgetUsed < 30 && metrics.length > 7) {
    insights.push({
      type: "OPPORTUNITY",
      category: "BUDGET",
      title: "ใช้งบน้อยกว่าแผน",
      description: `ใช้งบเพียง ${budgetUsed.toFixed(1)}% — สามารถเพิ่ม Daily Budget เพื่อเข้าถึงกลุ่มเป้าหมายมากขึ้น`,
      priority: "MEDIUM",
      actionable: true,
    });
  }

  // === CTR INSIGHTS ===
  const platformBenchmarks: Record<string, number> = {
    FACEBOOK: 1.5, GOOGLE: 3.0, TIKTOK: 1.0, LINE: 0.8, INSTAGRAM: 1.2, YOUTUBE: 0.5,
  };
  const benchmark = platformBenchmarks[campaign.platform] || 1.0;

  if (avgCtr < benchmark * 0.5) {
    insights.push({
      type: "WARNING",
      category: "CREATIVE",
      title: "CTR ต่ำกว่ามาตรฐาน",
      description: `CTR เฉลี่ย ${avgCtr.toFixed(2)}% ต่ำกว่าค่าเฉลี่ยของ ${campaign.platform} (${benchmark}%) — ควรปรับ Ad Creative, ข้อความ หรือรูปภาพให้ดึงดูดมากขึ้น`,
      priority: "HIGH",
      actionable: true,
    });
  } else if (avgCtr > benchmark * 2) {
    insights.push({
      type: "PERFORMANCE",
      category: "CREATIVE",
      title: "CTR ดีเยี่ยม!",
      description: `CTR เฉลี่ย ${avgCtr.toFixed(2)}% สูงกว่าค่าเฉลี่ยของ ${campaign.platform} (${benchmark}%) ถึง ${(avgCtr / benchmark).toFixed(1)} เท่า — Creative ทำงานได้ดีมาก`,
      priority: "LOW",
      actionable: false,
    });
  }

  // === CPC INSIGHTS ===
  if (avgCpc > 15 && campaign.platform === "FACEBOOK") {
    insights.push({
      type: "RECOMMENDATION",
      category: "AUDIENCE",
      title: "CPC สูง — ปรับกลุ่มเป้าหมาย",
      description: `CPC เฉลี่ย ${avgCpc.toFixed(2)} บาท สูงกว่าปกติ — ลองขยายกลุ่มเป้าหมาย ใช้ Lookalike Audience หรือลด Interest Targeting ที่แคบเกินไป`,
      priority: "MEDIUM",
      actionable: true,
    });
  } else if (avgCpc > 30 && campaign.platform === "GOOGLE") {
    insights.push({
      type: "RECOMMENDATION",
      category: "AUDIENCE",
      title: "CPC สูง — ปรับ Keywords",
      description: `CPC เฉลี่ย ${avgCpc.toFixed(2)} บาท — ลองใช้ Long-tail Keywords, เพิ่ม Negative Keywords หรือปรับ Bid Strategy`,
      priority: "MEDIUM",
      actionable: true,
    });
  }

  // === CONVERSION INSIGHTS ===
  if (totalClicks > 100 && avgConvRate < 1) {
    insights.push({
      type: "WARNING",
      category: "GENERAL",
      title: "Conversion Rate ต่ำ",
      description: `Conversion Rate ${avgConvRate.toFixed(2)}% จาก ${totalClicks.toLocaleString()} คลิก — ตรวจสอบ Landing Page: ความเร็ว, CTA ชัดเจน, ฟอร์มไม่ซับซ้อน, Mobile-friendly`,
      priority: "HIGH",
      actionable: true,
    });
  } else if (avgConvRate > 5) {
    insights.push({
      type: "PERFORMANCE",
      category: "GENERAL",
      title: "Conversion Rate ยอดเยี่ยม!",
      description: `Conversion Rate ${avgConvRate.toFixed(2)}% สูงมาก — ควรเพิ่มงบเพื่อ Scale แคมเปญนี้`,
      priority: "MEDIUM",
      actionable: true,
    });
  }

  // === ROAS INSIGHTS ===
  if (totalSpent > 0 && totalRevenue > 0) {
    if (overallRoas < 1) {
      insights.push({
        type: "WARNING",
        category: "BUDGET",
        title: "ROAS ติดลบ — ขาดทุน",
        description: `ROAS ${overallRoas.toFixed(2)}x — ใช้เงิน ${totalSpent.toLocaleString()} บาท ได้รายได้ ${totalRevenue.toLocaleString()} บาท ขาดทุน ${(totalSpent - totalRevenue).toLocaleString()} บาท ควรปรับแคมเปญหรือหยุดชั่วคราว`,
        priority: "HIGH",
        actionable: true,
      });
    } else if (overallRoas >= 3) {
      insights.push({
        type: "PERFORMANCE",
        category: "BUDGET",
        title: "ROAS ดีมาก!",
        description: `ROAS ${overallRoas.toFixed(2)}x — ทุก 1 บาทที่ลงทุน ได้กลับ ${overallRoas.toFixed(2)} บาท กำไร ${(totalRevenue - totalSpent).toLocaleString()} บาท`,
        priority: "LOW",
        actionable: false,
      });
    }
  }

  // === TREND INSIGHTS ===
  if (metrics.length >= 7) {
    const recent = metrics.slice(0, 3);
    const older = metrics.slice(Math.max(0, metrics.length - 3));
    const recentAvgCtr = recent.reduce((s, m) => s + m.ctr, 0) / recent.length;
    const olderAvgCtr = older.reduce((s, m) => s + m.ctr, 0) / older.length;

    if (olderAvgCtr > 0 && recentAvgCtr < olderAvgCtr * 0.7) {
      insights.push({
        type: "WARNING",
        category: "CREATIVE",
        title: "CTR กำลังลดลง",
        description: `CTR ลดลงจาก ${olderAvgCtr.toFixed(2)}% เหลือ ${recentAvgCtr.toFixed(2)}% — อาจเกิด Ad Fatigue ควรเปลี่ยน Creative ใหม่ หรือปรับ Audience`,
        priority: "HIGH",
        actionable: true,
      });
    }

    const recentAvgCpc = recent.reduce((s, m) => s + m.cpc, 0) / recent.length;
    const olderAvgCpc = older.reduce((s, m) => s + m.cpc, 0) / older.length;

    if (olderAvgCpc > 0 && recentAvgCpc > olderAvgCpc * 1.5) {
      insights.push({
        type: "WARNING",
        category: "BUDGET",
        title: "CPC กำลังเพิ่มขึ้น",
        description: `CPC เพิ่มจาก ${olderAvgCpc.toFixed(2)} เป็น ${recentAvgCpc.toFixed(2)} บาท — การแข่งขันสูงขึ้น ลองปรับ Bid หรือเปลี่ยน Audience`,
        priority: "MEDIUM",
        actionable: true,
      });
    }
  }

  // === ENGAGEMENT INSIGHTS ===
  if (totalEngagement > 0 && totalImpressions > 0) {
    const engRate = (totalEngagement / totalImpressions) * 100;
    if (engRate > 5) {
      insights.push({
        type: "PERFORMANCE",
        category: "CREATIVE",
        title: "Engagement Rate สูง",
        description: `Engagement Rate ${engRate.toFixed(2)}% — เนื้อหาดึงดูดกลุ่มเป้าหมายได้ดี ควร Boost โพสต์ที่ Engage สูง`,
        priority: "MEDIUM",
        actionable: true,
      });
    }
  }

  // === LEADS INSIGHTS ===
  if (totalLeads > 0 && totalSpent > 0) {
    const cpl = totalSpent / totalLeads;
    if (cpl > 500) {
      insights.push({
        type: "RECOMMENDATION",
        category: "AUDIENCE",
        title: "Cost per Lead สูง",
        description: `CPL ${cpl.toFixed(0)} บาท/Lead — ลองใช้ Lead Form Ads, ปรับ Targeting ให้แม่นยำขึ้น หรือเสนอ Lead Magnet ที่ดึงดูดกว่า`,
        priority: "MEDIUM",
        actionable: true,
      });
    }
  }

  // === PLATFORM-SPECIFIC TIPS ===
  if (campaign.platform === "TIKTOK" && totalImpressions > 0) {
    const viewRate = metrics.reduce((s, m) => s + m.videoViews, 0) / totalImpressions * 100;
    if (viewRate < 20) {
      insights.push({
        type: "RECOMMENDATION",
        category: "CREATIVE",
        title: "Video View Rate ต่ำ",
        description: `View Rate ${viewRate.toFixed(1)}% — วิดีโอ TikTok ควรดึงดูดใน 3 วินาทีแรก ใช้ Hook ที่แรง ข้อความสั้น และเพลงที่กำลังเทรนด์`,
        priority: "HIGH",
        actionable: true,
      });
    }
  }

  if (campaign.platform === "FACEBOOK" && metrics.length >= 3) {
    insights.push({
      type: "RECOMMENDATION",
      category: "TIMING",
      title: "ทดสอบ A/B Testing",
      description: "ลอง A/B Test ระหว่าง Creative, Audience, Placement ต่างๆ เพื่อหาสูตรที่ดีที่สุด — ใช้ Facebook Experiments",
      priority: "MEDIUM",
      actionable: true,
    });
  }

  // === GENERAL RECOMMENDATIONS ===
  if (campaign.type === "SALES" && totalConversions === 0 && totalClicks > 50) {
    insights.push({
      type: "RECOMMENDATION",
      category: "GENERAL",
      title: "ยังไม่มี Conversion",
      description: `มี ${totalClicks} คลิกแต่ยังไม่มี Conversion — ตรวจสอบ: 1) Pixel/Tracking ติดตั้งถูกต้อง 2) Landing Page โหลดเร็ว 3) ราคาสินค้าเหมาะสม 4) CTA ชัดเจน`,
      priority: "HIGH",
      actionable: true,
    });
  }

  if (campaign.type === "RETARGETING" && avgCpc > 10) {
    insights.push({
      type: "RECOMMENDATION",
      category: "AUDIENCE",
      title: "Retargeting CPC สูง",
      description: "ลองแบ่ง Retargeting Audience เป็นกลุ่มย่อย: เข้าชม 7 วัน, 30 วัน, Add to Cart, Checkout — แต่ละกลุ่มใช้ข้อความต่างกัน",
      priority: "MEDIUM",
      actionable: true,
    });
  }

  return insights;
}

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "ยอดเยี่ยม", color: "text-green-600" };
  if (score >= 60) return { label: "ดี", color: "text-blue-600" };
  if (score >= 40) return { label: "พอใช้", color: "text-amber-600" };
  return { label: "ต้องปรับปรุง", color: "text-red-600" };
}

export function calculateCampaignScore(campaign: CampaignData): number {
  const metrics = campaign.metrics;
  if (metrics.length === 0) return 0;

  let score = 50; // base score

  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalSpent = metrics.reduce((s, m) => s + m.spent, 0);

  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgConvRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;

  // CTR score
  if (avgCtr > 3) score += 15;
  else if (avgCtr > 1.5) score += 10;
  else if (avgCtr > 0.5) score += 5;
  else score -= 10;

  // Conversion rate score
  if (avgConvRate > 5) score += 15;
  else if (avgConvRate > 2) score += 10;
  else if (avgConvRate > 0.5) score += 5;
  else if (totalClicks > 100) score -= 5;

  // ROAS score
  if (roas > 5) score += 20;
  else if (roas > 3) score += 15;
  else if (roas > 1) score += 5;
  else if (totalSpent > 0 && totalRevenue > 0) score -= 10;

  return Math.max(0, Math.min(100, score));
}
