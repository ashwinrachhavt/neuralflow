import { NextResponse } from 'next/server';
import { prisma } from '@/server/db/client';
import { getUserOr401 } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const rows = await prisma.embedding.findMany({
    where: { userId },
    include: { task: { select: { id: true, title: true } }, note: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const nodes = [] as { id: string; title: string; type: 'task' | 'note'; vector: number[] }[];
  for (const r of rows) {
    const emb = r.embedding as any;
    const vec: number[] | null = Array.isArray(emb) && emb.every((x: any) => typeof x === 'number') ? emb : (Array.isArray(emb?.data) ? emb.data : null);
    if (!vec || vec.length === 0) continue;
    if (r.task) nodes.push({ id: `task_${r.task.id}_${r.id}`, title: r.task.title, type: 'task', vector: vec });
    else if (r.note) nodes.push({ id: `note_${r.note.id}_${r.id}`, title: r.note.title, type: 'note', vector: vec });
  }

  return NextResponse.json({ nodes });
}

