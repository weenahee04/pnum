import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month } = await request.json();
    if (!month) return NextResponse.json({ error: "กรุณาระบุเดือน" }, { status: 400 });

    const users = await prisma.user.findMany({ where: { role: "EMPLOYEE" } });
    const results = [];

    for (const user of users) {
      const existing = await prisma.payroll.findUnique({
        where: { userId_month: { userId: user.id, month } },
      });
      if (existing) continue;

      const baseSalary = user.salary || 25000;
      const otHours = Math.floor(Math.random() * 20);
      const otRate = Math.round(baseSalary / 30 / 8 * 1.5);
      const otAmount = otHours * otRate;
      const bonus = 0;
      const allowance = 0;
      const grossSalary = baseSalary + otAmount + bonus + allowance;
      const socialSecurity = Math.min(grossSalary * 0.05, 750);
      const taxableIncome = grossSalary - socialSecurity;
      const annualIncome = taxableIncome * 12;
      let tax = 0;
      if (annualIncome > 150000) {
        if (annualIncome <= 300000) tax = (annualIncome - 150000) * 0.05;
        else if (annualIncome <= 500000) tax = 7500 + (annualIncome - 300000) * 0.10;
        else if (annualIncome <= 750000) tax = 27500 + (annualIncome - 500000) * 0.15;
        else if (annualIncome <= 1000000) tax = 65000 + (annualIncome - 750000) * 0.20;
        else tax = 115000 + (annualIncome - 1000000) * 0.25;
      }
      tax = Math.round(tax / 12);
      const deduction = 0;
      const netSalary = grossSalary - socialSecurity - tax - deduction;

      const record = await prisma.payroll.create({
        data: {
          userId: user.id, month, baseSalary, otHours, otRate, otAmount,
          bonus, allowance, deduction, socialSecurity, tax, netSalary,
        },
      });
      results.push(record);
    }

    return NextResponse.json({ created: results.length });
  } catch (error) {
    console.error("Payroll generate error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
