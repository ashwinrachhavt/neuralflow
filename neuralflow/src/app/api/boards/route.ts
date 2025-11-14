import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const boards = await prisma.board.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' }, select: { id: true, title: true } });
  return NextResponse.json(boards);
}

export async function POST(req: Request) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const title = (body?.title as string | undefined)?.trim();
  if (!title) return NextResponse.json({ message: 'title is required' }, { status: 400 });
  const board = await prisma.board.create({
    data: {
      userId: user.id,
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

