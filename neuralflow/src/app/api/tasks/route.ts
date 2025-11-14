import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

export async function POST(req: Request) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const boardId = (body?.boardId as string | undefined)?.trim();
  const columnId = (body?.columnId as string | undefined)?.trim();
  const title = (body?.title as string | undefined)?.trim();
  const descriptionMarkdown = (body?.descriptionMarkdown as string | undefined) ?? '';
  if (!boardId || !columnId || !title) return NextResponse.json({ message: 'boardId, columnId, title required' }, { status: 400 });
  const owns = await prisma.board.findFirst({ where: { id: boardId, userId: user.id }, select: { id: true } });
  if (!owns) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const col = await prisma.column.findFirst({ where: { id: columnId, boardId }, select: { id: true } });
  if (!col) return NextResponse.json({ message: 'Invalid column' }, { status: 400 });
  const task = await prisma.task.create({ data: { boardId, columnId, title, descriptionMarkdown } });
  return NextResponse.json({ id: task.id });
}

