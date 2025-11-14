import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";
import { novelJsonToMarkdown } from "@/lib/novel-to-markdown";
import { updateNoteEmbeddings } from "@/lib/embeddings";

type RouteContext = { params: { noteId: string } };

export async function PATCH(req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const contentJson = body?.contentJson as unknown;
  const title = (body?.title as string | undefined)?.trim();

  if (!contentJson || typeof contentJson !== "object") {
    return NextResponse.json({ message: "contentJson is required" }, { status: 400 });
  }

  // Ensure the note belongs to this user via its task -> board relation
  const note = await prisma.note.findFirst({
    where: { id: params.noteId, task: { board: { userId: user.id } } },
    include: { task: { select: { id: true } } },
  });

  if (!note) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const markdown = novelJsonToMarkdown(contentJson);

  const updated = await prisma.note.update({
    where: { id: note.id },
    data: {
      title: title && title.length > 0 ? title : note.title,
      contentJson: JSON.stringify(contentJson),
      contentMarkdown: markdown,
    },
  });

  await updateNoteEmbeddings({
    noteId: updated.id,
    userId: user.id,
    contentMarkdown: updated.contentMarkdown,
  });

  return NextResponse.json({ updatedAt: updated.updatedAt.toISOString() });
}

