import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

let prismaInstance = globalForPrisma.prisma;

if (!prismaInstance) {
  prismaInstance = prismaClientSingleton();
} else if (process.env.NODE_ENV !== "production") {
  // Hot reload fix: check if new models are missing from the cached instance
  if (!("reporterProfile" in prismaInstance)) {
    console.warn("Detected stale Prisma client (missing reporterProfile). Recreating...");
    try {
      prismaInstance.$disconnect();
    } catch (_e) { /* ignore */ }
    prismaInstance = prismaClientSingleton();
  }
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
