import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

type Ctx = { params: { quizId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const quiz = await prisma.quiz.findFirst({
    where: { id: params.quizId, userId: user.id },
    include: { questions: true },
  });
  if (!quiz) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  return NextResponse.json({
    id: quiz.id,
    title: quiz.title,
    createdAt: quiz.createdAt.toISOString(),
    questions: quiz.questions.map(q => ({ id: q.id, promptMarkdown: q.promptMarkdown, correctAnswer: q.correctAnswer })),
  });
}

