import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const TURSO_URL = "libsql://hr-system-weenahee04.aws-ap-northeast-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE3NDgwNzIsImlkIjoiM2Q1ZDIyYjQtZTlkNC00ZTY5LWI0YmQtMDQ3N2VhNTAyNjk5IiwicmlkIjoiMjJmYzAzZjEtOTYxYi00ZTNmLTk4ZTUtNmZmMTNkY2UzOGU1In0.mgKaaCDCaQT3cawdVNOZFRIxnG8q3Sv4h8EUtYYrlYRyQ0jkNAZKe0XwznX1TipOf-FiFdNyM4jweFSc2KkgDw";

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const schemaStatements = [
  // User table (final version with all fields)
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "department" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salary" REAL NOT NULL DEFAULT 0,
    "lineToken" TEXT,
    "lineNotifyEnabled" BOOLEAN NOT NULL DEFAULT false
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

  // Attendance
  `CREATE TABLE IF NOT EXISTS "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "leaveType" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_userId_date_key" ON "Attendance"("userId", "date")`,

  // DailyReport
  `CREATE TABLE IF NOT EXISTS "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "problems" TEXT,
    "tomorrowPlan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // Survey
  `CREATE TABLE IF NOT EXISTS "Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Survey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,

  // SurveyQuestion
  `CREATE TABLE IF NOT EXISTS "SurveyQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SurveyQuestion_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // SurveyResponse
  `CREATE TABLE IF NOT EXISTS "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SurveyResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SurveyResponse_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SurveyResponse_surveyId_respondentId_targetUserId_key" ON "SurveyResponse"("surveyId", "respondentId", "targetUserId")`,

  // SurveyAnswer
  `CREATE TABLE IF NOT EXISTS "SurveyAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rating" INTEGER,
    "textAnswer" TEXT,
    CONSTRAINT "SurveyAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "SurveyResponse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SurveyAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // KPI
  `CREATE TABLE IF NOT EXISTS "KPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KPI_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // KPIProgress
  `CREATE TABLE IF NOT EXISTS "KPIProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiId" TEXT NOT NULL,
    "currentValue" REAL NOT NULL,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KPIProgress_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // CheckIn
  `CREATE TABLE IF NOT EXISTS "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "method" TEXT NOT NULL DEFAULT 'MANUAL',
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'ON_TIME',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CheckIn_userId_date_key" ON "CheckIn"("userId", "date")`,

  // LeaveRequest
  `CREATE TABLE IF NOT EXISTS "LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "days" REAL NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,

  // LeaveBalance
  `CREATE TABLE IF NOT EXISTS "LeaveBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "total" REAL NOT NULL DEFAULT 0,
    "used" REAL NOT NULL DEFAULT 0,
    "remaining" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "LeaveBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LeaveBalance_userId_year_type_key" ON "LeaveBalance"("userId", "year", "type")`,

  // Payroll
  `CREATE TABLE IF NOT EXISTS "Payroll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "baseSalary" REAL NOT NULL DEFAULT 0,
    "otHours" REAL NOT NULL DEFAULT 0,
    "otRate" REAL NOT NULL DEFAULT 0,
    "otAmount" REAL NOT NULL DEFAULT 0,
    "bonus" REAL NOT NULL DEFAULT 0,
    "allowance" REAL NOT NULL DEFAULT 0,
    "deduction" REAL NOT NULL DEFAULT 0,
    "socialSecurity" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "netSalary" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Payroll_userId_month_key" ON "Payroll"("userId", "month")`,

  // Evaluation
  `CREATE TABLE IF NOT EXISTS "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluatorId" TEXT NOT NULL,
    "evaluateeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PEER',
    "scores" TEXT NOT NULL DEFAULT '{}',
    "strengths" TEXT,
    "improvements" TEXT,
    "comments" TEXT,
    "overallScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_evaluateeId_fkey" FOREIGN KEY ("evaluateeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Evaluation_evaluatorId_evaluateeId_period_type_key" ON "Evaluation"("evaluatorId", "evaluateeId", "period", "type")`,

  // JobPosting
  `CREATE TABLE IF NOT EXISTS "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "salary" TEXT,
    "location" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // JobApplication
  `CREATE TABLE IF NOT EXISTS "JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "rating" INTEGER,
    "notes" TEXT,
    "reviewerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobApplication_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobApplication_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,

  // TrainingCourse
  `CREATE TABLE IF NOT EXISTS "TrainingCourse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructor" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "duration" TEXT NOT NULL DEFAULT '',
    "maxSeats" INTEGER NOT NULL DEFAULT 30,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // TrainingEnrollment
  `CREATE TABLE IF NOT EXISTS "TrainingEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "score" REAL,
    "feedback" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TrainingEnrollment_courseId_userId_key" ON "TrainingEnrollment"("courseId", "userId")`,

  // Banner
  `CREATE TABLE IF NOT EXISTS "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TEXT,
    "endDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // SeoProject
  `CREATE TABLE IF NOT EXISTS "SeoProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // SeoAudit
  `CREATE TABLE IF NOT EXISTS "SeoAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "results" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoAudit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // SeoKeyword
  `CREATE TABLE IF NOT EXISTS "SeoKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "currentRank" INTEGER,
    "bestRank" INTEGER,
    "lastChecked" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoKeyword_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SeoProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "SeoKeyword_projectId_keyword_key" ON "SeoKeyword"("projectId", "keyword")`,

  // SeoRanking
  `CREATE TABLE IF NOT EXISTS "SeoRanking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keywordId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "url" TEXT,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoRanking_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "SeoKeyword" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
];

async function main() {
  console.log("🔄 Pushing schema to Turso...");
  
  for (let i = 0; i < schemaStatements.length; i++) {
    try {
      await client.execute(schemaStatements[i]);
      process.stdout.write(".");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`\n❌ Error on statement ${i + 1}: ${msg}`);
      console.error(`   SQL: ${schemaStatements[i].substring(0, 80)}...`);
    }
  }
  console.log("\n✅ Schema pushed successfully!");

  // Seed admin user
  console.log("\n🔄 Seeding users...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const empPassword = await bcrypt.hash("employee123", 10);

  const users = [
    { name: "ผู้ดูแลระบบ", email: "admin@company.com", password: adminPassword, role: "ADMIN", department: "IT", position: "System Administrator" },
    { name: "สมชาย ใจดี", email: "somchai@company.com", password: empPassword, role: "EMPLOYEE", department: "Engineering", position: "Software Developer" },
    { name: "สมหญิง รักงาน", email: "somying@company.com", password: empPassword, role: "EMPLOYEE", department: "Marketing", position: "Marketing Manager" },
    { name: "ประสิทธิ์ มั่นคง", email: "prasit@company.com", password: empPassword, role: "EMPLOYEE", department: "Finance", position: "Accountant" },
  ];

  for (const u of users) {
    const id = randomBytes(12).toString("hex").slice(0, 25);
    const now = new Date().toISOString();
    try {
      await client.execute({
        sql: `INSERT OR IGNORE INTO "User" ("id", "name", "email", "password", "role", "department", "position", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, u.name, u.email, u.password, u.role, u.department, u.position, now],
      });
      console.log(`  ✅ ${u.email} (${u.role})`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`  ❌ ${u.email}: ${msg}`);
    }
  }

  console.log("\n🎉 Done! Database is ready.");
  client.close();
}

main().catch(console.error);
