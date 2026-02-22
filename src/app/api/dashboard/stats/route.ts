import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      totalEmployees, attendanceToday, reportsToday, activeSurveys,
      checkInsToday, pendingLeaves, totalPayrolls, totalEvaluations,
      openJobs, totalApplications, activeCourses, totalEnrollments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.attendance.findMany({ where: { date: today } }),
      prisma.dailyReport.count({ where: { date: today } }),
      prisma.survey.count({ where: { isActive: true } }),
      prisma.checkIn.count({ where: { date: today } }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.payroll.count(),
      prisma.evaluation.count(),
      prisma.jobPosting.count({ where: { status: "OPEN" } }),
      prisma.jobApplication.count(),
      prisma.trainingCourse.count({ where: { status: { in: ["UPCOMING", "IN_PROGRESS"] } } }),
      prisma.trainingEnrollment.count(),
    ]);

    const presentToday = attendanceToday.filter((a: { status: string }) => a.status === "PRESENT").length;
    const lateToday = attendanceToday.filter((a: { status: string }) => a.status === "LATE").length;
    const absentToday = attendanceToday.filter((a: { status: string }) => a.status === "ABSENT").length;
    const leaveToday = attendanceToday.filter((a: { status: string }) => a.status === "LEAVE").length;

    // Weekly check-in data for chart
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayCheckins = await prisma.checkIn.count({ where: { date: dateStr } });
      const dayLabel = d.toLocaleDateString("th-TH", { weekday: "short" });
      weekData.push({ day: dayLabel, count: dayCheckins });
    }

    return NextResponse.json({
      totalEmployees, presentToday, lateToday, absentToday, leaveToday,
      reportsToday, activeSurveys,
      checkInsToday, pendingLeaves, totalPayrolls, totalEvaluations,
      openJobs, totalApplications, activeCourses, totalEnrollments,
      weekData,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
