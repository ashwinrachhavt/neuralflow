import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  await gamificationEngine.ensureCatalog();

  const userId = (user as any).id as string;
  const [profile, stones, progress, owned] = await Promise.all([
    prisma.userGamificationProfile.findUnique({ where: { userId } }),
    prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } }),
    prisma.userStoneProgress.findMany({ where: { userId } }),
    prisma.userStone.findMany({ where: { userId }, orderBy: { earnedAt: "desc" }, include: { stone: true } }),
  ]);

  const level = 1 + Math.floor((profile?.xp ?? 0) / 100);
  const earned = owned.map((e: any) => ({ slug: e.stone.slug, name: e.stone.name, rarity: e.stone.rarity, image: e.stone.imagePath, earnedAt: e.earnedAt.toISOString(), lore: e.note }));
  const catalog = stones.map((s: any) => {
    const p = progress.find((x: any) => x.stoneId === s.id);
    const earnedCount = owned.filter((o: any) => o.stoneId === s.id).length;
    return { slug: s.slug, name: s.name, rarity: s.rarity, theme: s.description, image: s.imagePath, shards: { current: p?.currentShards ?? 0, target: p?.targetShards ?? 10 }, earnedCount };
  });

  return NextResponse.json({
    profile: {
      xp: profile?.xp ?? 0,
      level,
      currentDailyStreak: profile?.currentDailyStreak ?? 0,
      longestDailyStreak: profile?.longestDailyStreak ?? 0,
      totals: { gems: owned.length },
    },
    catalog,
    earned,
  });
}
