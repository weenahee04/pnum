import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      needsVerification: boolean;
      lineUserId?: string;
      provider: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    needsVerification?: boolean;
    lineUserId?: string;
    lineDisplayName?: string;
    lineAvatar?: string;
    provider?: string;
  }
}
