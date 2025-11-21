import { NextRequest, NextResponse } from "next/server";

import { getUserOr401 } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ noteId: string }> };

type NotePayload = {
  contentJson?: unknown;
  contentMarkdown?: string;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { noteId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = (await req.json()) as NotePayload;
  const serializedJson =
    typeof body.contentJson === "string" ? body.contentJson : JSON.stringify(body.contentJson ?? {});
  const markdown = typeof body.contentMarkdown === "string" ? body.contentMarkdown : "";

  const note = await prisma.note.findFirst({
    where: { id: noteId, task: { board: { userId: (user as any).id } } },
    select: { id: true },
  });

  if (!note) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  await prisma.note.update({
    where: { id: note.id },
    data: { contentJson: serializedJson, contentMarkdown: markdown },
  });

  return NextResponse.json({ id: note.id });
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { noteId } = await context.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const note = await prisma.note.findFirst({
    where: { id: noteId, task: { board: { userId: (user as any).id } } },
    select: { id: true, title: true, contentJson: true, contentMarkdown: true, updatedAt: true },
  });

  if (!note) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}
