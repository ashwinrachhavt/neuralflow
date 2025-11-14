import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';

export async function GET() {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const notes = await prisma.note.findMany({
    where: { task: { board: { userId: user.id } } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
    take: 200,
  });
  return NextResponse.json(notes.map(n => ({ id: n.id, title: n.title, updatedAt: n.updatedAt.toISOString() })));
}

