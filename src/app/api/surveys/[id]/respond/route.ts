import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { targetUserId, answers } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "กรุณาเลือกพนักงานที่ต้องการประเมิน" }, { status: 400 });
    }

    const existing = await prisma.surveyResponse.findUnique({
      where: {
        surveyId_respondentId_targetUserId: {
          surveyId: id,
          respondentId: session.user.id,
          targetUserId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "คุณได้ประเมินพนักงานคนนี้แล้ว" }, { status: 400 });
    }

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: id,
        respondentId: session.user.id,
        targetUserId,
        answers: {
          create: Object.entries(answers || {}).map(([questionId, answer]) => {
            const ans = answer as { rating?: number; textAnswer?: string };
            return {
              questionId,
              rating: ans.rating || null,
              textAnswer: ans.textAnswer || null,
            };
          }),
        },
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Survey respond error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
