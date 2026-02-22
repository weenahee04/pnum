import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLineNotify, notifyLeaveApproval } from "@/lib/line-notify";

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

    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) return NextResponse.json({ error: "ไม่พบคำขอลา" }, { status: 404 });
    if (leave.status !== "PENDING") return NextResponse.json({ error: "คำขอนี้ดำเนินการแล้ว" }, { status: 400 });

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    // LINE Notify the requester
    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
    sendLineNotify(
      leave.userId,
      notifyLeaveApproval(newStatus, leave.type, leave.startDate, leave.endDate, session.user.name)
    ).catch(() => {});

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Leave approve error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
