import { prisma } from "@/lib/prisma";

type UpdateNoteEmbeddingsInput = {
  noteId: string;
  userId: string;
  contentMarkdown: string;
};

/**
 * Placeholder helper that will eventually fan out to OpenAI embeddings + pgvector upserts.
 */
export async function updateNoteEmbeddings({
  noteId,
  userId,
  contentMarkdown,
}: UpdateNoteEmbeddingsInput) {
  if (!contentMarkdown.trim()) {
    return;
  }

  // Tracked: chunk markdown, embed, and upsert into DB
  console.info(
    "[embeddings] queue update",
    JSON.stringify({ noteId, userId, length: contentMarkdown.length }),
  );

  await prisma.embedding.deleteMany({ where: { noteId } });

  // Placeholder entry so queries have at least one row to work with until the real embedding pipeline ships.
  await prisma.embedding.create({
    data: {
      noteId,
      userId,
      chunkText: contentMarkdown.slice(0, 512),
      embedding: { placeholder: true },
    },
  });
}

type UpdateTaskEmbeddingsInput = {
  taskId: string;
  userId: string;
  title: string;
  descriptionMarkdown?: string;
};

/**
 * Placeholder helper to upsert task embeddings (title + description) into the Embedding table.
 * Replace with real chunking + embedding model when wiring pgvector/Qdrant.
 */
export async function updateTaskEmbeddings({
  taskId,
  userId,
  title,
  descriptionMarkdown,
}: UpdateTaskEmbeddingsInput) {
  const text = `${title}\n\n${(descriptionMarkdown ?? '').trim()}`.trim();
  if (!text) return;

  console.info(
    "[embeddings] queue task update",
    JSON.stringify({ taskId, userId, length: text.length }),
  );

  await prisma.embedding.deleteMany({ where: { taskId } });

  await prisma.embedding.create({
    data: {
      taskId,
      userId,
      chunkText: text.slice(0, 512),
      embedding: { placeholder: true },
    },
  });
}
