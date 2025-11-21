import { prisma } from './client';

export async function getRelatedItemsForTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } } });
  if (!task) return [] as { type: 'note' | 'task' | 'quiz'; id: string; title: string }[];

  const notes = await prisma.note.findMany({
    where: { task: { boardId: task.boardId } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: { id: true, title: true },
  });
  const tasks = await prisma.task.findMany({
    where: { boardId: task.boardId, NOT: { id: taskId } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: { id: true, title: true },
  });
  const quizzes = await prisma.quiz.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    select: { id: true, title: true },
  });

  return [
    ...notes.map((n) => ({ type: 'note' as const, id: n.id, title: n.title })),
    ...tasks.map((t) => ({ type: 'task' as const, id: t.id, title: t.title })),
    ...quizzes.map((q) => ({ type: 'quiz' as const, id: q.id, title: q.title })),
  ];
}

