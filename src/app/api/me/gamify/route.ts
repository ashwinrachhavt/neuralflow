import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const [profile, stones, stoneProgresses, achievements] = await Promise.all([
    prisma.userGamificationProfile.findUnique({
      where: { userId },
      select: {
        userId: true,
        xp: true,
        level: true,
        longestDailyStreak: true,
        currentDailyStreak: true,
        lastActivityDate: true,
        totalTasksCompleted: true,
        totalDeepWorkBlocks: true,
        totalPomodoros: true,
        updatedAt: true,
      },
    }),
    prisma.userStone.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        stoneId: true,
        earnedAt: true,
        source: true,
        relatedTaskIds: true,
        note: true,
        stone: { select: { slug: true, name: true, rarity: true, imagePath: true } },
      },
    }),
    prisma.userStoneProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        stoneId: true,
        currentShards: true,
        targetShards: true,
        updatedAt: true,
        stone: { select: { slug: true, name: true, rarity: true } },
      },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        earnedAt: true,
        metadata: true,
        achievement: { select: { slug: true, name: true, description: true, icon: true } },
      },
    }),
  ]);

  return NextResponse.json({ profile, stones, stoneProgresses, achievements });
}

