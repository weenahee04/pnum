import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    // LINE OAuth Provider
    {
      id: "line",
      name: "LINE",
      type: "oauth",
      authorization: {
        url: "https://access.line.me/oauth2/v2.1/authorize",
        params: { scope: "profile openid email", response_type: "code" },
      },
      token: "https://api.line.me/oauth2/v2.1/token",
      userinfo: "https://api.line.me/v2/profile",
      clientId: process.env.LINE_CLIENT_ID,
      clientSecret: process.env.LINE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.userId,
          name: profile.displayName,
          email: null,
          image: profile.pictureUrl,
          role: "EMPLOYEE",
        };
      },
    },
    // Email/Password Provider (สำหรับ Admin)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("ไม่พบบัญชีผู้ใช้");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("รหัสผ่านไม่ถูกต้อง");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Credentials login — ผ่านเลย
      if (account?.provider === "credentials") return true;

      // LINE login
      if (account?.provider === "line") {
        const lineUserId = user.id; // LINE userId from profile

        // เช็คว่า LINE userId นี้ผูกกับ User ในระบบแล้วหรือยัง
        const existingUser = await prisma.user.findUnique({
          where: { lineUserId },
        });

        if (existingUser) {
          // อัพเดท LINE profile
          await prisma.user.update({
            where: { lineUserId },
            data: {
              lineDisplayName: user.name || undefined,
              lineAvatar: user.image || undefined,
            },
          });
        }
        // ถ้ายังไม่ผูก ก็อนุญาตให้ sign in ได้ แต่จะต้อง verify ก่อน
        return true;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.needsVerification = false;
        token.provider = "credentials";
      }

      if (account?.provider === "line" && user) {
        const lineUserId = user.id;
        token.lineUserId = lineUserId;
        token.lineDisplayName = user.name || undefined;
        token.lineAvatar = user.image || undefined;
        token.provider = "line";

        // เช็คว่าผูกกับ User ในระบบแล้วหรือยัง
        const existingUser = await prisma.user.findUnique({
          where: { lineUserId },
        });

        if (existingUser) {
          token.id = existingUser.id;
          token.name = existingUser.name;
          token.email = existingUser.email;
          token.role = existingUser.role;
          token.needsVerification = false;
        } else {
          token.id = "";
          token.role = "EMPLOYEE";
          token.needsVerification = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as Record<string, unknown>;
        u.id = token.id;
        u.role = token.role;
        u.needsVerification = token.needsVerification || false;
        u.lineUserId = token.lineUserId;
        u.provider = token.provider || "credentials";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
