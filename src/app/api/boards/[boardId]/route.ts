import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { listByBoard } from '@/server/db/cards';

type Ctx = { params: Promise<{ boardId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { boardId } = await params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const board = await prisma.board.findFirst({
    where: { id: boardId, userId: (user as any).id },
    include: { columns: { orderBy: { position: 'asc' } } },
  });
  if (!board) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const raw = await listByBoard(board.id);
  const tasks = raw.map((t: any) => ({
    id: t.id,
    title: t.title,
    descriptionMarkdown: t.descriptionMarkdown,
    columnId: t.columnId,
    // extra metadata for richer UI
    dueDate: t.dueDate,
    priority: t.priority,
    type: t.type,
    estimatedPomodoros: t.estimatedPomodoros,
    status: t.status,
    tags: t.tags,
    aiPlanned: t.aiPlanned,
    // AI fields for suggestions
    aiSuggestedColumnId: (t as any).aiSuggestedColumnId ?? null,
    aiSuggestedPriority: (t as any).aiSuggestedPriority ?? null,
    aiSuggestedEstimateMin: (t as any).aiSuggestedEstimateMin ?? null,
    aiNextAction: (t as any).aiNextAction ?? null,
    aiState: (t as any).aiState ?? null,
    aiConfidence: (t as any).aiConfidence ?? null,
    topics: (t as any).topics ?? null,
    primaryTopic: (t as any).primaryTopic ?? null,
  }));

  const columnOrder = board.columns.map((c: any) => c.id);
  const columnsMap = Object.fromEntries(
    board.columns.map((c: any) => [c.id, { id: c.id, name: c.name, position: c.position, taskIds: [] as string[] }])
  );
  for (const t of tasks) {
    const col = columnsMap[t.columnId];
    if (col) col.taskIds.push(t.id);
  }
  const tasksMap = Object.fromEntries(tasks.map((t: any) => [t.id, t]));
  return NextResponse.json({ board: { id: board.id, title: board.title, columnOrder, columns: columnsMap, tasks: tasksMap } });
}
