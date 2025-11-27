import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const runs = await prisma.agentRun.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, createdAt: true, outputs: { select: { kind: true, payload: true }, where: { kind: 'reporter:weekly' } } },
  });

  const items = runs
    .map((r: any) => r.outputs.map((o: any) => ({ id: r.id, createdAt: r.createdAt, payload: o.payload as any })))
    .flat()
    .filter(Boolean)
    .map((r: any) => ({ id: r.id, createdAt: r.createdAt, summary: r.payload.summary, highlights: r.payload.highlights, sentiment: r.payload.sentiment }))
    .slice(0, 10);

  return NextResponse.json({ items });
}
