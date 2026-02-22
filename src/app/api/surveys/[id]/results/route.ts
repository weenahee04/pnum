import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AnswerRecord {
  id: string;
  questionId: string;
  rating: number | null;
  textAnswer: string | null;
  responseId: string;
}

interface ResponseRecord {
  id: string;
  surveyId: string;
  respondentId: string;
  targetUserId: string;
  target: { id: string; name: string };
  answers: AnswerRecord[];
}

interface QuestionRecord {
  id: string;
  question: string;
  type: string;
  order: number;
  surveyId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const survey = await prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: "asc" } },
        responses: {
          include: {
            target: { select: { id: true, name: true } },
            answers: true,
          },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: "ไม่พบแบบประเมิน" }, { status: 404 });
    }

    const typedQuestions = survey.questions as unknown as QuestionRecord[];
    const typedResponses = survey.responses as unknown as ResponseRecord[];

    // Group responses by target user
    const targetMap = new Map<string, { userName: string; responses: ResponseRecord[] }>();

    for (const response of typedResponses) {
      const key = response.targetUserId;
      if (!targetMap.has(key)) {
        targetMap.set(key, { userName: response.target.name, responses: [] });
      }
      targetMap.get(key)!.responses.push(response);
    }

    const results = Array.from(targetMap.entries()).map(([userId, data]) => {
      const questionResults = typedQuestions.map((q: QuestionRecord) => {
        const answersForQ: AnswerRecord[] = data.responses
          .flatMap((r: ResponseRecord) => r.answers)
          .filter((a: AnswerRecord) => a.questionId === q.id);

        let avgRating: number | null = null;
        const textAnswers: string[] = [];

        if (q.type === "RATING") {
          const ratings = answersForQ.filter((a: AnswerRecord) => a.rating !== null).map((a: AnswerRecord) => a.rating!);
          avgRating = ratings.length > 0 ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length : null;
        } else {
          answersForQ.forEach((a: AnswerRecord) => {
            if (a.textAnswer) textAnswers.push(a.textAnswer);
          });
        }

        return { id: q.id, question: q.question, type: q.type, avgRating, textAnswers };
      });

      const ratingQuestions = questionResults.filter((q: { type: string; avgRating: number | null }) => q.type === "RATING" && q.avgRating !== null);
      const overallAvg = ratingQuestions.length > 0
        ? ratingQuestions.reduce((s: number, q: { avgRating: number | null }) => s + q.avgRating!, 0) / ratingQuestions.length
        : 0;

      return { userId, userName: data.userName, questions: questionResults, overallAvg };
    });

    return NextResponse.json({
      title: survey.title,
      description: survey.description,
      results,
    });
  } catch (error) {
    console.error("Survey results error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
