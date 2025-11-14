import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const quizzes = await prisma.quiz.findMany({
    where: { userId: user.id },
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(
    quizzes.map(q => ({ id: q.id, title: q.title, questions: q._count.questions, createdAt: q.createdAt.toISOString() }))
  );
}

