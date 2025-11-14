import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

type Ctx = { params: { deckId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const deck = await prisma.flashcardDeck.findFirst({
    where: { id: params.deckId, userId: user.id },
    include: { cards: true },
  });
  if (!deck) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: deck.id,
    title: deck.title,
    createdAt: deck.createdAt.toISOString(),
    cards: deck.cards.map(c => ({ id: c.id, question: c.question, answer: c.answer })),
  });
}

