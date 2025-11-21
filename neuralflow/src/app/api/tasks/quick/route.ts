import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { getOrCreateDefaultBoard } from '@/server/db/boards';
import { prisma } from '@/server/db/client';

type Body = { title?: string; descriptionMarkdown?: string };

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = await readJson<Body>(req);
  const title = (body?.title || '').trim();
  const descriptionMarkdown = body?.descriptionMarkdown || '';
  if (!title) return NextResponse.json({ message: 'title required' }, { status: 400 });

  const boardRes = await getOrCreateDefaultBoard((user as any).id);
  if (!boardRes.ok) return NextResponse.json({ message: 'Failed to resolve board' }, { status: 500 });
  const board = boardRes.value;
  const todoColumn = board.columns.find(c => c.name.toLowerCase().includes('todo')) ?? board.columns[0];

  const task = await prisma.task.create({
    data: {
      boardId: board.id,
      columnId: todoColumn.id,
      title,
      descriptionMarkdown,
      status: 'TODO',
    },
    select: { id: true },
  });
  return NextResponse.json({ id: task.id });
}

