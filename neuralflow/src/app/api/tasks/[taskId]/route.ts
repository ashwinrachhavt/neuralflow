import { NextRequest, NextResponse } from "next/server";

import { getUserOr401, readJson } from "@/lib/api-helpers";
import { updateTitle, deleteForUser, getByIdForUser } from "@/server/db/cards";

type RouteContext = { params: Promise<{ taskId: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { taskId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = await readJson<{ title?: string }>(req);
  const title = (body?.title as string | undefined)?.trim();
  if (!title) {
    return NextResponse.json({ message: "title is required" }, { status: 400 });
  }

  const task = await getByIdForUser(taskId, (user as any).id).catch(() => null);
  if (!task) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await updateTitle(taskId, title, (user as any).id);

  return NextResponse.json({ id: updated.id, title: updated.title });
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
