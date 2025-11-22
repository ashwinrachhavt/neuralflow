import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { getUserOr401 } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ todoId: string }> };

export async function PATCH(_req: Request, ctx: Ctx) {
  const { todoId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await prisma.task.findFirst({ where: { id: todoId, board: { userId: (user as any).id } }, select: { id: true, boardId: true } });
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  // Move to the "Done" column for this board if available
  let doneColumnId: string | null = null;
  try {
    const doneCol = await prisma.column.findFirst({ where: { boardId: task.boardId, name: { equals: 'Done', mode: 'insensitive' } as any }, select: { id: true } });
    if (doneCol) doneColumnId = doneCol.id;
    else {
      // Fallback: highest position column
      const lastCol = await prisma.column.findFirst({ where: { boardId: task.boardId }, orderBy: { position: 'desc' }, select: { id: true } });
      doneColumnId = lastCol?.id ?? null;
    }
  } catch (e) {
    void e;
  }

  const updated = await prisma.task.update({
    where: { id: todoId },
    data: {
      status: 'DONE',
      ...(doneColumnId ? { column: { connect: { id: doneColumnId } } } : {}),
    },
  });
  return NextResponse.json({ id: updated.id, status: updated.status, columnId: updated.columnId });
}

