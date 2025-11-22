import { prisma as basePrisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

export type DBClient = PrismaClient | Prisma.TransactionClient;

export const prisma = basePrisma;

