import { NextResponse } from "next/server";

import { getOrCreateDbUser } from "@/lib/get-or-create-user";
import { updateTitle, deleteForUser, getByIdForUser } from "@/server/db/cards";

type RouteContext = { params: { taskId: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const title = (body?.title as string | undefined)?.trim();
  if (!title) {
    return NextResponse.json({ message: "title is required" }, { status: 400 });
  }

  const task = await getByIdForUser(params.taskId, user.id).catch(() => null);
  if (!task) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await updateTitle(params.taskId, title, user.id);

  return NextResponse.json({ id: updated.id, title: updated.title });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const task = await getByIdForUser(params.taskId, user.id).catch(() => null);
  if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 });

  await deleteForUser(params.taskId, user.id);
  return NextResponse.json({ ok: true });
}
