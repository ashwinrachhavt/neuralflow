import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401 } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ boardId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { boardId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  // Ensure board ownership
  const board = await prisma.board.findFirst({ where: { id: boardId, userId: (user as any).id }, select: { id: true } });
  if (!board) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  // Ensure Hidden column exists (last position)
  const last = await prisma.column.findFirst({ where: { boardId }, orderBy: { position: 'desc' }, select: { position: true } });
  const hiddenExisting = await prisma.column.findFirst({ where: { boardId, name: { equals: 'Hidden', mode: 'insensitive' } as any }, select: { id: true } });
  const hidden = hiddenExisting ?? (await prisma.column.create({ data: { boardId, name: 'Hidden', position: (last?.position ?? 0) + 1 } }));

  // Move all DONE tasks to Hidden column; keep status as DONE for history tracking
  const res = await prisma.task.updateMany({ where: { boardId, status: 'DONE' }, data: { columnId: hidden.id } });

  return NextResponse.json({ moved: res.count, columnId: hidden.id });
}

