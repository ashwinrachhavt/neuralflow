import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/server/db/client';
import { listByBoard } from '@/server/db/cards';

type Ctx = { params: { boardId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const board = await prisma.board.findFirst({
    where: { id: params.boardId, userId: (user as any).id },
    include: { columns: { orderBy: { position: 'asc' } } },
  });
  if (!board) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const raw = await listByBoard(board.id);
  const tasks = raw.map(t => ({
    id: t.id,
    title: t.title,
    descriptionMarkdown: t.descriptionMarkdown,
    columnId: t.columnId,
    // extra metadata for richer UI
    priority: t.priority,
    estimatedPomodoros: t.estimatedPomodoros,
    status: t.status,
    tags: t.tags,
    aiPlanned: t.aiPlanned,
  }));

  const columnOrder = board.columns.map(c => c.id);
  const columnsMap = Object.fromEntries(board.columns.map(c => [c.id, { id: c.id, name: c.name, position: c.position, taskIds: [] as string[] }]));
  for (const t of tasks) {
    const col = columnsMap[t.columnId];
    if (col) col.taskIds.push(t.id);
  }
  const tasksMap = Object.fromEntries(tasks.map(t => [t.id, t]));
  return NextResponse.json({ board: { id: board.id, title: board.title, columnOrder, columns: columnsMap, tasks: tasksMap } });
}
