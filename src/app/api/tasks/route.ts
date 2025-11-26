import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { classifyTask } from '@/lib/ai/agents/classifierAgent';

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const body = await readJson<any>(req);
  const boardId = (body?.boardId as string | undefined)?.trim();
  const columnId = (body?.columnId as string | undefined)?.trim();
  const title = (body?.title as string | undefined)?.trim();
  const descriptionMarkdown = (body?.descriptionMarkdown as string | undefined) ?? '';
  const priority = (body?.priority as 'LOW'|'MEDIUM'|'HIGH'|undefined) ?? undefined;
  const type = (body?.type as 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'|undefined) ?? undefined;
  const estimatedPomodoros = typeof body?.estimatedPomodoros === 'number' ? Math.max(0, Math.floor(body.estimatedPomodoros)) : undefined;
  const tags: string[] | undefined = Array.isArray(body?.tags)
    ? (body.tags as string[]).map((t) => String(t)).filter(Boolean)
    : (typeof body?.tags === 'string'
      ? String(body.tags).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined);
  if (!boardId || !columnId || !title) return NextResponse.json({ message: 'boardId, columnId, title required' }, { status: 400 });
  const owns = await prisma.board.findFirst({ where: { id: boardId, userId: (user as any).id }, select: { id: true } });
  if (!owns) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const col = await prisma.column.findFirst({ where: { id: columnId, boardId }, select: { id: true } });
  if (!col) return NextResponse.json({ message: 'Invalid column' }, { status: 400 });
  const task = await prisma.task.create({
    data: {
      boardId,
      columnId,
      title,
      descriptionMarkdown,
      ...(priority ? { priority } : {}),
      ...(type ? { type } : {}),
      ...(typeof estimatedPomodoros === 'number' ? { estimatedPomodoros } : {}),
      ...(tags ? { tags } : {}),
      status: 'TODO',
    },
  });
  // Auto-classify newly created task
  try {
    const result = await classifyTask({ title, description: descriptionMarkdown || null });
    const baseData: any = {
      topics: (result as any).topics,
      primaryTopic: (result as any).primaryTopic,
      aiState: 'CLASSIFIED',
      aiConfidence: result.confidence,
    };
    try {
      await prisma.task.update({ where: { id: task.id }, data: baseData });
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (!/Unknown argument `topics`|Unknown argument `primaryTopic`/i.test(msg)) throw e;
    }
  } catch (_e) { /* ignore */ }

  return NextResponse.json({ id: task.id });
}
