import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL_ACCELERATE || process.env.DATABASE_URL;
  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

let prismaInstance: PrismaClientSingleton | undefined = globalForPrisma.prisma;

if (!prismaInstance) {
  prismaInstance = prismaClientSingleton();
} else if (process.env.NODE_ENV !== "production") {
  // Hot reload fix: check if new models are missing from the cached instance
  if (!("reporterProfile" in (prismaInstance as any))) {
    console.warn("Detected stale Prisma client (missing reporterProfile). Recreating...");
    try {
      (prismaInstance as PrismaClientSingleton).$disconnect?.();
    } catch (_e) { /* ignore */ }
    prismaInstance = prismaClientSingleton();
  }
}

export const prisma = prismaInstance as PrismaClientSingleton;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
