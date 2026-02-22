import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineNotify, notifyPayroll } from "@/lib/line-notify";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();

    if (action === "confirm") {
      const updated = await prisma.payroll.update({ where: { id }, data: { status: "CONFIRMED" } });
      return NextResponse.json(updated);
    }
    if (action === "pay") {
      const updated = await prisma.payroll.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
        include: { user: { select: { id: true } } },
      });

      // LINE Notify employee
      sendLineNotify(
        updated.user.id,
        notifyPayroll(updated.month.split("-")[1] || updated.month, updated.month.split("-")[0] || "", updated.netSalary)
      ).catch(() => {});

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Payroll PUT error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
