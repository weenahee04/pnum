import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as Record<string, unknown>;

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.__prisma) {
    return globalForPrisma.__prisma as PrismaClient;
  }

  let client: PrismaClient;

  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Use dynamic import via Function constructor to completely hide from bundler
    const load = new Function("mod", "return require(mod)");
    const { createClient } = load("@libsql/client");
    const { PrismaLibSql } = load("@prisma/adapter-libsql");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    client = new PrismaClient({ adapter } as never);
  } else {
    client = new PrismaClient();
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
