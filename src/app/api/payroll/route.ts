import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    const records = await prisma.payroll.findMany({
      where: isAdmin ? {} : { userId: session.user.id },
      include: { user: { select: { name: true, department: true } } },
      orderBy: { month: "desc" },
      take: 100,
    });
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Payroll GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
