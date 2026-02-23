import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineUserId } = session.user as { lineUserId?: string };
    if (!lineUserId) {
      return NextResponse.json({ error: "ไม่พบข้อมูล LINE" }, { status: 400 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "กรุณากรอกชื่อ-นามสกุล" }, { status: 400 });
    }

    const inputName = name.trim();

    // ค้นหาพนักงานที่ชื่อตรงกัน (trim whitespace, case-insensitive)
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, lineUserId: true },
    });

    const matchedUser = allUsers.find((u) => {
      const dbName = u.name.trim().replace(/\s+/g, " ");
      const input = inputName.replace(/\s+/g, " ");
      return dbName === input;
    });

    if (!matchedUser) {
      return NextResponse.json(
        { error: "ไม่พบชื่อนี้ในระบบ กรุณากรอกชื่อ-นามสกุลให้ตรงกับที่ลงทะเบียนไว้" },
        { status: 404 }
      );
    }

    // เช็คว่าพนักงานคนนี้ผูก LINE อื่นไปแล้วหรือยัง
    if (matchedUser.lineUserId && matchedUser.lineUserId !== lineUserId) {
      return NextResponse.json(
        { error: "บัญชีนี้ถูกผูกกับ LINE อื่นแล้ว กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 409 }
      );
    }

    // ผูก LINE userId กับพนักงาน
    const updatedUser = await prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        lineUserId,
        lineDisplayName: (session.user as Record<string, unknown>).name as string || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Verify employee error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
