import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const postings = await prisma.jobPosting.findMany({
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ postings });
  } catch (error) {
    console.error("Recruitment GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, department, description, requirements, salary, location, type } = await request.json();
    if (!title || !department || !description || !requirements) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const posting = await prisma.jobPosting.create({
      data: { title, department, description, requirements, salary: salary || null, location: location || "", type: type || "FULL_TIME" },
    });
    return NextResponse.json(posting);
  } catch (error) {
    console.error("Recruitment POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
