import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const [decks, quizzes] = await Promise.all([
    prisma.flashcardDeck.findMany({
      where: { userId: user.id },
      include: { cards: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.quiz.findMany({
      where: { userId: user.id },
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return NextResponse.json({
    decks: decks.map(d => ({ id: d.id, title: d.title, cards: d.cards.length, createdAt: d.createdAt.toISOString() })),
    quizzes: quizzes.map(q => ({ id: q.id, title: q.title, questions: q.questions.length, createdAt: q.createdAt.toISOString() })),
  });
}

