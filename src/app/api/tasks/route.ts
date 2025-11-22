import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { prisma } from '@/server/db/client';

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = await readJson<any>(req);
  const boardId = (body?.boardId as string | undefined)?.trim();
  const columnId = (body?.columnId as string | undefined)?.trim();
  const title = (body?.title as string | undefined)?.trim();
  const descriptionMarkdown = (body?.descriptionMarkdown as string | undefined) ?? '';
  if (!boardId || !columnId || !title) return NextResponse.json({ message: 'boardId, columnId, title required' }, { status: 400 });
  const owns = await prisma.board.findFirst({ where: { id: boardId, userId: (user as any).id }, select: { id: true } });
  if (!owns) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const col = await prisma.column.findFirst({ where: { id: columnId, boardId }, select: { id: true } });
  if (!col) return NextResponse.json({ message: 'Invalid column' }, { status: 400 });
  const task = await prisma.task.create({ data: { boardId, columnId, title, descriptionMarkdown } });
  return NextResponse.json({ id: task.id });
}
