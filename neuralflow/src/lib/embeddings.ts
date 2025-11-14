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
