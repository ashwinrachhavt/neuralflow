import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const rows = await prisma.userStone.findMany({
    where: { userId: (user as any).id },
    orderBy: { earnedAt: 'desc' },
    take: 10,
    include: { stone: true },
  });
  const items = rows.map(r => ({ id: r.id, slug: r.stone?.slug, name: r.stone?.name, image: r.stone?.imagePath, rarity: r.stone?.rarity, earnedAt: r.earnedAt }));
  return NextResponse.json({ items });
}

