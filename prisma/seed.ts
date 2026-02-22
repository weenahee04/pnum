import { execSync } from "child_process";
import { randomBytes } from "node:crypto";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const empPassword = await bcrypt.hash("employee123", 10);

  const users = [
    { name: "ผู้ดูแลระบบ", email: "admin@company.com", password: adminPassword, role: "ADMIN", department: "IT", position: "System Administrator" },
    { name: "สมชาย ใจดี", email: "somchai@company.com", password: empPassword, role: "EMPLOYEE", department: "Engineering", position: "Software Developer" },
    { name: "สมหญิง รักงาน", email: "somying@company.com", password: empPassword, role: "EMPLOYEE", department: "Marketing", position: "Marketing Manager" },
    { name: "ประสิทธิ์ มั่นคง", email: "prasit@company.com", password: empPassword, role: "EMPLOYEE", department: "Finance", position: "Accountant" },
  ];

  const statements = users.map((u) => {
    const id = randomBytes(12).toString("hex").slice(0, 25);
    const now = new Date().toISOString();
    return `INSERT OR IGNORE INTO "User" ("id", "name", "email", "password", "role", "department", "position", "createdAt") VALUES ('${id}', '${u.name}', '${u.email}', '${u.password}', '${u.role}', '${u.department}', '${u.position}', '${now}');`;
  });

  const sql = statements.join("\n");
  const tmpFile = join(__dirname, "seed.sql");
  writeFileSync(tmpFile, sql, "utf-8");

  try {
    console.log("Seeding database...");
    execSync(`npx prisma db execute --file prisma/seed.sql`, {
      cwd: join(__dirname, ".."),
      stdio: "inherit",
    });
    console.log("Seed completed successfully!");
    console.log("Users created:");
    users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
  } finally {
    unlinkSync(tmpFile);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
