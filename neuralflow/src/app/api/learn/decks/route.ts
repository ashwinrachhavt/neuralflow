import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const decks = await prisma.flashcardDeck.findMany({
    where: { userId: user.id },
    include: { _count: { select: { cards: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(
    decks.map(d => ({ id: d.id, title: d.title, cards: d._count.cards, createdAt: d.createdAt.toISOString() }))
  );
}

