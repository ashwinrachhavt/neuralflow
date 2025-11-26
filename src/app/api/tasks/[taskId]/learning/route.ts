import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserOr401, readJson } from '@/lib/api-helpers';

type Ctx = { params: Promise<{ taskId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  if (!(prisma as any).taskLearning) {
    return NextResponse.json({ learnings: [] });
  }
  const logs = await (prisma as any).taskLearning.findMany({
    where: { taskId, userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, summary: true, details: true, tags: true, confidence: true, createdAt: true },
  });
  return NextResponse.json({ learnings: logs });
}

export async function POST(req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const body = await readJson<{ summary: string; details?: any; tags?: string[]; confidence?: number }>(req);
  if (!body || !body.summary?.trim()) return NextResponse.json({ message: 'Invalid' }, { status: 400 });

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true } });
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  if (!(prisma as any).taskLearning) {
    return NextResponse.json({ message: 'Learning model unavailable' }, { status: 501 });
  }
  const created = await (prisma as any).taskLearning.create({
    data: { taskId, userId, summary: body.summary.trim(), details: body.details ?? undefined, tags: body.tags ?? [], confidence: body.confidence ?? null },
    select: { id: true },
  });
  return NextResponse.json({ id: created.id });
}
