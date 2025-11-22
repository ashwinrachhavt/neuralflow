import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { prisma } from '@/server/db/client';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const boards = await prisma.board.findMany({ where: { userId: (user as any).id }, orderBy: { createdAt: 'asc' }, select: { id: true, title: true } });
  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = await readJson<{ title?: string }>(req);
  const title = (body?.title as string | undefined)?.trim();
  if (!title) return NextResponse.json({ message: 'title is required' }, { status: 400 });
  const board = await prisma.board.create({
    data: {
      userId: (user as any).id,
      title,
      columns: {
        create: [
          { name: 'Backlog', position: 0 },
          { name: 'Todo', position: 1 },
          { name: 'In Progress', position: 2 },
          { name: 'Done', position: 3 },
        ],
      },
    },
  });
  return NextResponse.json({ id: board.id });
}
