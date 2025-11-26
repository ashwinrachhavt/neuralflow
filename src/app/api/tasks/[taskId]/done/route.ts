import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401 } from '@/lib/api-helpers';
import { recordLearningOnTaskDone } from '@/lib/ai/agents/learningAgent';

type Ctx = { params: Promise<{ taskId: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true, boardId: true } });
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  // Move to the Done column if exists, else keep column
  let doneColumnId: string | null = null;
  try {
    const doneCol = await prisma.column.findFirst({ where: { boardId: task.boardId, name: { equals: 'Done', mode: 'insensitive' } as any }, select: { id: true } });
    if (doneCol) doneColumnId = doneCol.id;
  } catch { /* noop */ }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: 'DONE', ...(doneColumnId ? { column: { connect: { id: doneColumnId } } } : {}) },
    select: { id: true, status: true, columnId: true },
  });

  // Optional learning capture (feature-flagged)
  let learning: { created: boolean; id?: string } = { created: false };
  if (String(process.env.ENABLE_TASK_LEARNING).toLowerCase() === 'true') {
    try { learning = await recordLearningOnTaskDone(userId, taskId) as any; } catch { /* ignore */ }
  }

  return NextResponse.json({ id: updated.id, status: updated.status, columnId: updated.columnId, learning });
}
