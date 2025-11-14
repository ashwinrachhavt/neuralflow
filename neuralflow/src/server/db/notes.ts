import { prisma } from "./client";
import { NotFoundError } from "./result";

export async function getByTaskId(taskId: string) {
  const note = await prisma.note.findUnique({ where: { taskId } });
  if (!note) throw new NotFoundError();
  return note;
}

