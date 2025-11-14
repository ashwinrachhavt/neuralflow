import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDbUser } from "@/lib/get-or-create-user";
import { novelJsonToMarkdown } from "@/lib/novel-to-markdown";
import { updateNoteEmbeddings } from "@/lib/embeddings";

type RouteContext = { params: { taskId: string } };

export async function POST(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, board: { userId: user.id } },
    include: { note: true },
  });
  if (!task) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 });
  }

  // Bootstrap a simple Novel/Tiptap-like JSON doc using task details.
  const seedParagraph = task.descriptionMarkdown?.trim()
    ? task.descriptionMarkdown.trim()
    : `Notes for: ${task.title}`;

  const contentJson = {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: task.title }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: seedParagraph }],
      },
    ],
  } as const;

  const contentMarkdown = novelJsonToMarkdown(contentJson);

  const nextTitle = task.title;

  const upserted = await prisma.$transaction(async tx => {
    const note = task.note
      ? await tx.note.update({
          where: { id: task.note.id },
          data: {
            title: nextTitle,
            contentJson: JSON.stringify(contentJson),
            contentMarkdown,
          },
        })
      : await tx.note.create({
          data: {
            taskId: task.id,
            title: nextTitle,
            contentJson: JSON.stringify(contentJson),
            contentMarkdown,
          },
        });

    await tx.task.update({
      where: { id: task.id },
      data: { enrichedAt: new Date() },
    });

    return note;
  });

  // Fire-and-forget embeddings update (still awaited here to keep it simple)
  await updateNoteEmbeddings({
    noteId: upserted.id,
    userId: user.id,
    contentMarkdown,
  });

  return NextResponse.json({ noteId: upserted.id });
}

