export async function register() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const { createClient } = await import("@libsql/client");
    const { PrismaLibSql } = await import("@prisma/adapter-libsql");
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    (globalThis as Record<string, unknown>).__tursoAdapter = new PrismaLibSql(
      libsql as never
    );
  }
}
