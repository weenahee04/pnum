import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAndAnalyze } from "@/lib/seo-analyzer";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url } = await request.json();
    if (!url?.trim()) return NextResponse.json({ error: "กรุณาระบุ URL" }, { status: 400 });

    try { new URL(url); } catch {
      return NextResponse.json({ error: "URL ไม่ถูกต้อง" }, { status: 400 });
    }

    const analysis = await fetchAndAnalyze(url.trim());
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("SEO Analyze error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: `วิเคราะห์ไม่สำเร็จ: ${message}` }, { status: 500 });
  }
}
