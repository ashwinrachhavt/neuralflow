import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

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
    orderBy: { updatedAt: "desc" },
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
      calendarEvents: {
        select: {
          location: true,
          startAt: true,
        },
        orderBy: { startAt: "asc" },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    tasks: tasks.map((task) => ({
      id: task.id,
      boardId: task.boardId,
      columnId: task.columnId,
      title: task.title,
      descriptionMarkdown: task.descriptionMarkdown,
      priority: task.priority,
      status: task.status,
      estimatedPomodoros: task.estimatedPomodoros,
      tags: task.tags,
      aiPlanned: task.aiPlanned,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      location: task.calendarEvents[0]?.location ?? null,
    })),
  });
}
