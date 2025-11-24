import { NextRequest, NextResponse } from "next/server";

import { getUserOr401, readJson } from "@/lib/api-helpers";
import { deleteForUser, getByIdForUser, updatePartial } from "@/server/db/cards";

type RouteContext = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { taskId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<{ title?: string; descriptionMarkdown?: string; priority?: 'LOW'|'MEDIUM'|'HIGH'|null; type?: 'DEEP_WORK'|'SHALLOW_WORK'|'LEARNING'|'SHIP'|'MAINTENANCE'|null; tags?: string[] | null; estimatedPomodoros?: number | null }>(req);
  const title = (body?.title as string | undefined)?.trim();
  const descriptionMarkdown = typeof body?.descriptionMarkdown === 'string' ? body?.descriptionMarkdown : undefined;
  const priority = body?.priority as any;
  const type = body?.type as any;
  const tags = Array.isArray(body?.tags) ? (body!.tags as string[]).map(String) : (body?.tags === null ? null : undefined);
  const estimatedPomodoros = typeof body?.estimatedPomodoros === 'number' ? Math.max(0, Math.floor(body.estimatedPomodoros!)) : (body?.estimatedPomodoros === null ? null : undefined);
  if (!title && typeof descriptionMarkdown !== 'string' && priority === undefined && type === undefined && tags === undefined && estimatedPomodoros === undefined) {
    return NextResponse.json({ message: "No fields to update" }, { status: 400 });
  }

  const task = await getByIdForUser(taskId, (user as any).id).catch(() => null);
  if (!task) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await updatePartial(
    taskId,
    {
      ...(title ? { title } : {}),
      ...(typeof descriptionMarkdown === 'string' ? { descriptionMarkdown } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(estimatedPomodoros !== undefined ? { estimatedPomodoros } : {}),
    },
    (user as any).id,
  );

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { taskId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const task = await getByIdForUser(taskId, (user as any).id).catch(() => null);
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await deleteForUser(taskId, (user as any).id);
  return NextResponse.json({ ok: true });
}
