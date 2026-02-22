import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "@libsql/core",
    "@libsql/hrana-client",
    "libsql",
  ],
};

export default nextConfig;
