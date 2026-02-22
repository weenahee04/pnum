import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const year = new Date().getFullYear();
    let balances = await prisma.leaveBalance.findMany({
      where: { userId: session.user.id, year },
    });

    if (balances.length === 0) {
      const defaults = [
        { type: "SICK", total: 30 },
        { type: "PERSONAL", total: 5 },
        { type: "VACATION", total: 10 },
        { type: "MATERNITY", total: 90 },
      ];
      await Promise.all(
        defaults.map((d) =>
          prisma.leaveBalance.create({
            data: { userId: session.user.id, year, type: d.type, total: d.total, used: 0, remaining: d.total },
          })
        )
      );
      balances = await prisma.leaveBalance.findMany({ where: { userId: session.user.id, year } });
    }

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Leave balance error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
