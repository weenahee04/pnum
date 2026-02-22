import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - get current user's LINE settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lineToken: true, lineNotifyEnabled: true },
    });

    return NextResponse.json({
      hasToken: !!user?.lineToken,
      enabled: user?.lineNotifyEnabled ?? false,
    });
  } catch (error) {
    console.error("LINE settings GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST - save LINE token and settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { lineToken, enabled } = await request.json();

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lineToken: lineToken || null,
        lineNotifyEnabled: enabled ?? false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LINE settings POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
