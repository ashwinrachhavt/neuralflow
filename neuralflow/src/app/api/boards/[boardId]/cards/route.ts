import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

type Ctx = { params: { boardId: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const board = await prisma.board.findFirst({ where: { id: params.boardId, userId: user.id }, select: { id: true } });
  if (!board) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  const tasks = await prisma.task.findMany({ where: { boardId: board.id }, orderBy: { createdAt: 'asc' }, select: { id: true, title: true, descriptionMarkdown: true, columnId: true } });
  return NextResponse.json(tasks);
}

