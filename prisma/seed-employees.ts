import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const employees = [
  {
    name: "น.ส.สุพิชฌาย์ ชื่นระรวย",
    email: "supitcha@company.com",
    position: "พนักงานธุรการ ประสานงาน",
    startDate: new Date("2021-10-16"),
  },
  {
    name: "น.ส.อมรรัตน์ ใจหาญ",
    email: "amornrat@company.com",
    position: "หัวหน้าพนักงานผู้แทนขาย",
    startDate: new Date("2021-12-01"),
  },
  {
    name: "น.ส.พัชราพรรณ หอมเอื้อม",
    email: "patcharapan@company.com",
    position: "หัวหน้าพนักงานประสานงานต่างประเทศ",
    startDate: new Date("2023-11-01"),
  },
  {
    name: "น.ส.ลัดดา ศรีกล่ำ",
    email: "ladda@company.com",
    position: "พนักงานธุรการ ประสานงาน",
    startDate: new Date("2024-03-04"),
  },
  {
    name: "น.ส. วรรณวลัย ไหมทองคำ",
    email: "wannawalai@company.com",
    position: "พนักงานการตลาดออนไลน์",
    startDate: new Date("2025-08-15"),
  },
  {
    name: "นาย กฤตณัติ ทองเต็มถุง",
    email: "kritnanat@company.com",
    position: "พนักงานกราฟฟิค",
    startDate: new Date("2025-09-01"),
  },
  {
    name: "นาย กฤษฎา รัตนอาชาไนย",
    email: "kritsada@company.com",
    position: "พนักงานขายอวุโส",
    startDate: new Date("2025-10-01"),
  },
  {
    name: "น.ส. รวงข้าว คำกอง",
    email: "ruangkhao@company.com",
    position: "พนักงานขาย",
    startDate: new Date("2025-11-01"),
  },
  {
    name: "น.ส. สกุลรัตน์ ชูเกียรติกำจร",
    email: "sakulrat@company.com",
    position: "พนักงานขาย",
    startDate: new Date("2025-11-17"),
  },
  {
    name: "น.ส. จุฑาทิพย์ ทิ้งโคตร",
    email: "juthatip@company.com",
    position: "พนักงานการตลาดคอนเท้นต์",
    startDate: new Date("2026-02-02"),
  },
];

async function main() {
  const defaultPassword = await bcrypt.hash("employee123", 10);

  for (const emp of employees) {
    const existing = await prisma.user.findUnique({ where: { email: emp.email } });
    if (existing) {
      // Update existing user with startDate and position
      await prisma.user.update({
        where: { email: emp.email },
        data: {
          name: emp.name,
          position: emp.position,
          startDate: emp.startDate,
        },
      });
      console.log(`✅ อัพเดท: ${emp.name}`);
    } else {
      await prisma.user.create({
        data: {
          name: emp.name,
          email: emp.email,
          password: defaultPassword,
          role: "EMPLOYEE",
          department: "",
          position: emp.position,
          startDate: emp.startDate,
        },
      });
      console.log(`✅ สร้าง: ${emp.name}`);
    }
  }

  console.log("\n🎉 เพิ่มพนักงานทั้งหมดเรียบร้อย!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
