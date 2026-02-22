# คู่มือ Deploy ระบบ HR ไป Vercel + Turso

## สิ่งที่ต้องเตรียม
- บัญชี GitHub (สำหรับ push code + login Turso/Vercel)
- Node.js 18+ ติดตั้งแล้ว (ตรวจสอบ: `node -v`)

---

## ขั้นตอนที่ 1: สมัคร Turso (Database)

### 1.1 ติดตั้ง Turso CLI
เปิด PowerShell แล้วรัน:
```powershell
irm https://get.tur.so/install.ps1 | iex
```
> ถ้าไม่ได้ผล ให้ไปดาวน์โหลดจาก https://docs.turso.tech/cli/installation

### 1.2 Login Turso
```powershell
turso auth login
```
จะเปิด browser ให้ login ด้วย GitHub

### 1.3 สร้าง Database
```powershell
turso db create hr-system
```

### 1.4 ดึง URL ของ Database
```powershell
turso db show hr-system --url
```
**จดค่าไว้** เช่น `libsql://hr-system-username.turso.io`

### 1.5 สร้าง Auth Token
```powershell
turso db tokens create hr-system
```
**จดค่า token ไว้** (ยาวมาก เริ่มด้วย `eyJ...`)

---

## ขั้นตอนที่ 2: Push Schema ไป Turso

### 2.1 ตั้ง Environment Variable ชั่วคราว
แทนที่ `YOUR_URL` และ `YOUR_TOKEN` ด้วยค่าจากขั้นตอน 1:
```powershell
$env:DATABASE_URL="YOUR_URL?authToken=YOUR_TOKEN"
```
ตัวอย่าง:
```powershell
$env:DATABASE_URL="libsql://hr-system-username.turso.io?authToken=eyJhbGci..."
```

### 2.2 Push Schema
```powershell
cd C:\Users\PC\Downloads\pnum
npx prisma db push
```
ควรเห็น: `Your database is now in sync with your Prisma schema.`

### 2.3 Seed ข้อมูลเริ่มต้น (สร้าง admin user)
```powershell
npx tsx prisma/seed.ts
```

---

## ขั้นตอนที่ 3: Push Code ไป GitHub

### 3.1 สร้าง Repository ใหม่บน GitHub
1. ไปที่ https://github.com/new
2. ตั้งชื่อ repo เช่น `hr-system`
3. เลือก **Private**
4. กด **Create repository**

### 3.2 Push Code
```powershell
cd C:\Users\PC\Downloads\pnum
git init
git add .
git commit -m "Initial commit - HR Management System"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/hr-system.git
git push -u origin main
```
> แทนที่ `YOUR_USERNAME` ด้วย GitHub username ของคุณ

---

## ขั้นตอนที่ 4: Deploy ไป Vercel

### วิธี A: ผ่านเว็บ (แนะนำ — ง่ายสุด)

1. ไปที่ https://vercel.com → กด **Sign Up** ด้วย GitHub
2. กด **Add New → Project**
3. เลือก repo `hr-system` ที่เพิ่ง push
4. ในหน้า Configure Project:
   - **Framework Preset**: Next.js (ควรเลือกให้อัตโนมัติ)
   - **Build Command**: `prisma generate && next build`
   - **Root Directory**: ปล่อยว่าง
5. กด **Environment Variables** แล้วเพิ่มทีละตัว:

| Key | Value |
|-----|-------|
| `TURSO_DATABASE_URL` | `libsql://hr-system-username.turso.io` (จากขั้นตอน 1.4) |
| `TURSO_AUTH_TOKEN` | token จากขั้นตอน 1.5 |
| `DATABASE_URL` | `file:./dev.db` (Prisma ต้องการตอน generate) |
| `NEXTAUTH_SECRET` | สร้างค่าสุ่ม (ดูขั้นตอน 4.1) |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (ใส่ทีหลังได้) |

6. กด **Deploy**
7. รอ 2-3 นาที → ได้ URL เช่น `https://hr-system-xxx.vercel.app`
8. กลับไปแก้ `NEXTAUTH_URL` ใน Settings → Environment Variables ให้ตรงกับ URL จริง
9. กด **Redeploy** อีกครั้ง

### 4.1 สร้าง NEXTAUTH_SECRET
รันใน PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy ค่าที่ได้ไปใส่ใน Vercel

### วิธี B: ผ่าน CLI

```powershell
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (ครั้งแรก)
cd C:\Users\PC\Downloads\pnum
vercel

# ตอบคำถาม:
# Set up and deploy? → Y
# Which scope? → เลือก account ของคุณ
# Link to existing project? → N
# Project name? → hr-system
# Directory? → ./
# Override settings? → N

# ตั้ง Environment Variables
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add DATABASE_URL

# Deploy production
vercel --prod
```

---

## ขั้นตอนที่ 5: ทดสอบ

1. เปิด URL ที่ได้จาก Vercel เช่น `https://hr-system-xxx.vercel.app`
2. Login ด้วย:
   - **Email**: `admin@company.com`
   - **Password**: `admin123`
3. ทดสอบฟีเจอร์ต่างๆ: Dashboard, SEO Analyzer, ลงเวลา, ฯลฯ

---

## ขั้นตอนที่ 6: ตั้งค่าเพิ่มเติม (Optional)

### Custom Domain
1. Vercel Dashboard → Settings → Domains
2. เพิ่ม domain ของคุณ เช่น `hr.yourdomain.com`
3. ตั้ง DNS record ตามที่ Vercel แนะนำ
4. อัพเดท `NEXTAUTH_URL` ให้ตรงกับ domain ใหม่

### SerpAPI (สำหรับ SEO Keyword Tracking)
1. สมัครที่ https://serpapi.com (ฟรี 100 searches/เดือน)
2. Copy API Key
3. เพิ่มใน Vercel: Settings → Environment Variables → `SERPAPI_KEY`

### LINE Notify
1. สร้าง token ที่ https://notify-bot.line.me/
2. เพิ่มใน Vercel: `LINE_NOTIFY_TOKEN`

---

## แก้ปัญหาที่พบบ่อย

| ปัญหา | วิธีแก้ |
|--------|---------|
| Build failed: prisma generate | เพิ่ม Build Command: `prisma generate && next build` |
| 500 Internal Server Error | ตรวจ Environment Variables ใน Vercel ว่าครบหรือไม่ |
| Login ไม่ได้ | ตรวจ `NEXTAUTH_SECRET` และ `NEXTAUTH_URL` |
| Database error | ตรวจ `TURSO_DATABASE_URL` และ `TURSO_AUTH_TOKEN` |
| หน้าเว็บขาว | ดู Vercel Logs: Dashboard → Deployments → กดดู logs |

---

## สรุปค่าใช้จ่าย (Free Tier)

| Service | ฟรี | เกินฟรี |
|---------|-----|---------|
| **Vercel** | 100GB bandwidth/เดือน | $20/เดือน |
| **Turso** | 9GB storage, 500M reads | $29/เดือน |
| **SerpAPI** | 100 searches/เดือน | $50/เดือน |
| **GitHub** | Unlimited private repos | ฟรี |
