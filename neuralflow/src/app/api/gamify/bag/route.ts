import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const stones = await prisma.stoneDefinition.findMany({ orderBy: { name: 'asc' } });
  const owned = await prisma.userStone.findMany({ where: { userId }, include: { stone: true } });
  const progress = await prisma.userStoneProgress.findMany({ where: { userId } });
  const ownedMap = new Map<string, number>();
  for (const o of owned) ownedMap.set(o.stoneId, (ownedMap.get(o.stoneId) ?? 0) + 1);
  const rows = stones.map(s => {
    const count = ownedMap.get(s.id) ?? 0;
    const prog = progress.find(p => p.stoneId === s.id);
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      image: s.imagePath,
      rarity: s.rarity,
      owned: count,
      shards: { current: prog?.currentShards ?? 0, target: prog?.targetShards ?? 10 },
    };
  });
  return NextResponse.json({ items: rows });
}

