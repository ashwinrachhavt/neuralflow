import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/server/db/client';

export async function GET(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limitParam = url.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(limitParam || 100), 1), 500);

  const where: any = { board: { userId: (user as any).id } };
  if (status && ['BACKLOG','TODO','IN_PROGRESS','DONE','ARCHIVED'].includes(status)) {
    where.status = status;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      boardId: true,
      columnId: true,
      title: true,
      descriptionMarkdown: true,
      priority: true,
      status: true,
      estimatedPomodoros: true,
      tags: true,
      aiPlanned: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ tasks });
}

