import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
};

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma;
