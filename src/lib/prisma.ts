import { PrismaClient } from "@prisma/client";

const globalStore = globalThis as Record<string, unknown>;

function createPrismaClient(): PrismaClient {
  const adapter = globalStore.__tursoAdapter;
  if (adapter) {
    return new PrismaClient({ adapter } as never);
  }
  return new PrismaClient();
}

export const prisma = (globalStore.__prisma as PrismaClient) ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalStore.__prisma = prisma;
