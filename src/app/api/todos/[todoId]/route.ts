import { NextRequest, NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { prisma } from '@/server/db/client';
import { deleteForUser, getByIdForUser, updatePartial } from '@/server/db/cards';

type RouteContext = { params: Promise<{ todoId: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { todoId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await prisma.task.findFirst({
    where: { id: todoId, board: { userId: (user as any).id } },
    select: {
      id: true,
      title: true,
      descriptionMarkdown: true,
      status: true,
      priority: true,
      estimatedPomodoros: true,
      tags: true,
      boardId: true,
      columnId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { todoId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<{ title?: string; descriptionMarkdown?: string }>(req);
  const title = (body?.title as string | undefined)?.trim();
  const descriptionMarkdown = typeof body?.descriptionMarkdown === 'string' ? body?.descriptionMarkdown : undefined;
  if (!title && typeof descriptionMarkdown !== 'string') {
    return NextResponse.json({ message: 'title or descriptionMarkdown is required' }, { status: 400 });
  }

  const task = await getByIdForUser(todoId, (user as any).id).catch(() => null);
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const updated = await updatePartial(todoId, { ...(title ? { title } : {}), ...(typeof descriptionMarkdown === 'string' ? { descriptionMarkdown } : {}) }, (user as any).id);
  return NextResponse.json({ id: updated.id, title: updated.title, descriptionMarkdown: updated.descriptionMarkdown });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { todoId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await getByIdForUser(todoId, (user as any).id).catch(() => null);
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  await deleteForUser(todoId, (user as any).id);
  return NextResponse.json({ ok: true });
}

