import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineNotify, notifyEvaluation } from "@/lib/line-notify";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    const evaluations = await prisma.evaluation.findMany({
      where: isAdmin ? {} : {
        OR: [{ evaluatorId: session.user.id }, { evaluateeId: session.user.id }],
      },
      include: {
        evaluator: { select: { name: true } },
        evaluatee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Evaluation GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { evaluateeId, period, type, scores, strengths, improvements, comments } = await request.json();
    if (!evaluateeId || !period) return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

    const scoreValues = Object.values(scores || {}) as number[];
    const overallScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0;

    const evaluation = await prisma.evaluation.create({
      data: {
        evaluatorId: session.user.id,
        evaluateeId,
        period,
        type: type || "PEER",
        scores: JSON.stringify(scores || {}),
        strengths: strengths?.trim() || null,
        improvements: improvements?.trim() || null,
        comments: comments?.trim() || null,
        overallScore: Math.round(overallScore * 10) / 10,
      },
    });

    // LINE Notify the evaluatee
    sendLineNotify(evaluateeId, notifyEvaluation(session.user.name, period)).catch(() => {});

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Evaluation POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
