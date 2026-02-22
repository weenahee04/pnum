import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as Record<string, unknown>;

let _adapter: unknown = undefined;

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  const { createClient } = await import("@libsql/client");
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");
  const libsql = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  _adapter = new PrismaLibSql(libsql as never);
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.__prisma) {
    return globalForPrisma.__prisma as PrismaClient;
  }
  const client = _adapter
    ? new PrismaClient({ adapter: _adapter } as never)
    : new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
