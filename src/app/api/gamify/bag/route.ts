import { NextResponse } from "next/server";
import { getUserOr401 } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { gamificationEngine } from "@/lib/gamification/engine";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  await gamificationEngine.ensureCatalog();
  const [stones, owned, progress] = await Promise.all([
    prisma.stoneDefinition.findMany({ orderBy: { name: "asc" } }),
    prisma.userStone.findMany({ where: { userId: (user as any).id } }),
    prisma.userStoneProgress.findMany({ where: { userId: (user as any).id } }),
  ]);
  const items = stones.map((s) => {
    const p = progress.find((x) => x.stoneId === s.id);
    const count = owned.filter((o) => o.stoneId === s.id).length;
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      image: s.imagePath,
      rarity: s.rarity,
      owned: count,
      shards: { current: p?.currentShards ?? 0, target: p?.targetShards ?? 10 },
    };
  });
  return NextResponse.json({ items });
}

