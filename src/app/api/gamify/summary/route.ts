import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  await gamificationEngine.ensureCatalog();

  const userId = (user as any).id as string;
  const [profile, stones, progress, earned] = await Promise.all([
    prisma.userGamificationProfile.findUnique({ where: { userId } }),
    prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } }),
    prisma.userStoneProgress.findMany({ where: { userId } }),
    prisma.userStone.findMany({ where: { userId }, orderBy: { earnedAt: "desc" }, take: 6, include: { stone: true } }),
  ]);

  const level = 1 + Math.floor((profile?.xp ?? 0) / 100);
  const recent = earned.map((e) => ({ slug: e.stone.slug, name: e.stone.name, earnedAt: e.earnedAt.toISOString(), image: e.stone.imagePath }));
  const prog = stones.map((s) => {
    const p = progress.find((x: any) => x.stoneId === s.id);
    return { slug: s.slug, name: s.name, image: s.imagePath, currentShards: p?.currentShards ?? 0, targetShards: p?.targetShards ?? 10 };
  });

  return NextResponse.json({
    profile: {
      xp: profile?.xp ?? 0,
      level,
      currentDailyStreak: profile?.currentDailyStreak ?? 0,
      longestDailyStreak: profile?.longestDailyStreak ?? 0,
    },
    progress: prog,
    recent,
  });
}
