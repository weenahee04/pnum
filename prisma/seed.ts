import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const empPassword = await bcrypt.hash("employee123", 10);

  const users = [
    { name: "ผู้ดูแลระบบ", email: "admin@company.com", password: adminPassword, role: "ADMIN", department: "IT", position: "System Administrator" },
    { name: "สมชาย ใจดี", email: "somchai@company.com", password: empPassword, role: "EMPLOYEE", department: "Engineering", position: "Software Developer" },
    { name: "สมหญิง รักงาน", email: "somying@company.com", password: empPassword, role: "EMPLOYEE", department: "Marketing", position: "Marketing Manager" },
    { name: "ประสิทธิ์ มั่นคง", email: "prasit@company.com", password: empPassword, role: "EMPLOYEE", department: "Finance", position: "Accountant" },
  ];

  console.log("Seeding database...");
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        department: u.department,
        position: u.position,
      },
    });
  }

  console.log("Seed completed successfully!");
  users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
