import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ boardId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { boardId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const board = await prisma.board.findFirst({ where: { id: boardId, userId: (user as any).id }, select: { id: true } });
  if (!board) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  const tasks = await prisma.task.findMany({ where: { boardId: board.id }, orderBy: { createdAt: 'asc' }, select: { id: true, title: true, descriptionMarkdown: true, columnId: true } });
  return NextResponse.json(tasks);
}
