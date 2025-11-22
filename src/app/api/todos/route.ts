import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { prisma } from '@/server/db/client';
import { getOrCreateDefaultBoard } from '@/server/db/boards';

// GET /api/todos?status=TODO&limit=100
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
      calendarEvents: {
        select: { location: true, startAt: true },
        orderBy: { startAt: 'asc' },
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

// POST /api/todos
// Body: { title: string; descriptionMarkdown?: string; boardId?: string; columnId?: string }
export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = await readJson<any>(req);
  const title = (body?.title as string | undefined)?.trim();
  const descriptionMarkdown = (body?.descriptionMarkdown as string | undefined) ?? '';
  const boardIdInput = (body?.boardId as string | undefined)?.trim();
  const columnIdInput = (body?.columnId as string | undefined)?.trim();
  if (!title) return NextResponse.json({ message: 'title required' }, { status: 400 });

  let boardId: string;
  let columnId: string | null = null;

  if (boardIdInput) {
    const owns = await prisma.board.findFirst({ where: { id: boardIdInput, userId: (user as any).id }, select: { id: true } });
    if (!owns) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    boardId = boardIdInput;
    if (columnIdInput) {
      const col = await prisma.column.findFirst({ where: { id: columnIdInput, boardId }, select: { id: true } });
      columnId = col?.id ?? null;
    }
    if (!columnId) {
      const todoCol = await prisma.column.findFirst({ where: { boardId, name: { equals: 'Todo', mode: 'insensitive' } as any }, select: { id: true }, orderBy: { position: 'asc' } });
      const firstCol = todoCol ?? (await prisma.column.findFirst({ where: { boardId }, select: { id: true }, orderBy: { position: 'asc' } }));
      if (!firstCol) return NextResponse.json({ message: 'No columns on board' }, { status: 400 });
      columnId = firstCol.id;
    }
  } else {
    const boardRes = await getOrCreateDefaultBoard((user as any).id);
    if (!boardRes.ok) return NextResponse.json({ message: 'Failed to resolve board' }, { status: 500 });
    const board = boardRes.value;
    boardId = board.id;
    const todoColumn = board.columns.find((c) => c.name.toLowerCase().includes('todo')) ?? board.columns[0];
    columnId = todoColumn.id;
  }

  const task = await prisma.task.create({
    data: {
      boardId,
      columnId: columnId!,
      title,
      descriptionMarkdown,
      status: 'TODO',
    },
    select: { id: true },
  });
  return NextResponse.json({ id: task.id });
}

