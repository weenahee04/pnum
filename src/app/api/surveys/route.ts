import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveys = await prisma.survey.findMany({
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { questions: true, responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ surveys });
  } catch (error) {
    console.error("Surveys GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, questions } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกชื่อแบบประเมิน" }, { status: 400 });
    }

    const survey = await prisma.survey.create({
      data: {
        title: title.trim(),
        description: description || null,
        createdById: session.user.id,
        questions: {
          create: (questions || []).map((q: { question: string; type: string }, index: number) => ({
            question: q.question.trim(),
            type: q.type,
            order: index,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json(survey);
  } catch (error) {
    console.error("Surveys POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
