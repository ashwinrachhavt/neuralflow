import { Prisma } from "@prisma/client";
import { z } from "zod";
import { tool } from "ai";
import { prisma } from "@/lib/prisma";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { getOrCreateDefaultBoard } from "@/server/db/boards";

export const getTools = async () => {
  const user = await getCurrentUserOrThrow();
  const boardResult = await getOrCreateDefaultBoard(user.id);
  if (!boardResult.ok) {
    throw boardResult.error ?? new Error("Unable to resolve board");
  }

  const board = boardResult.value;
  const todoColumn =
    board.columns.find((column) => column.name.toLowerCase().includes("todo")) ??
    board.columns[0];

  if (!todoColumn) {
    throw new Error("No column found for the user board");
  }

  return {
    createTask: tool({
      description:
        "Create a new task in the database. Use this when the user explicitly asks to add something.",
      parameters: z.object({
        title: z.string(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
        estimateMinutes: z.number().optional(),
      }),
      execute: async (args: any) => {
        const { title, priority, estimateMinutes } = args;
        const data: Prisma.TaskUncheckedCreateInput = {
          boardId: board.id,
          columnId: todoColumn.id,
          title,
          priority,
          status: "TODO",
        };

        if (estimateMinutes !== undefined) {
          data.estimateMinutes = estimateMinutes;
        }

        const task = await prisma.task.create({
          data,
        });

        return { success: true, taskId: task.id, message: `Task "${title}" created.` };
      },
    } as any),
  };
};
