import type { Prisma } from "@prisma/client";
import { tool } from "ai";
import { z } from "zod";
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
      inputSchema: z.object({
        title: z.string().describe('Task title'),
        priority: z.enum(['LOW','MEDIUM','HIGH']).optional().describe('Priority level'),
        estimateMinutes: z.number().optional().describe('Estimated minutes to complete'),
      }),
      execute: async (args: any) => {
        const { title, priority = 'MEDIUM', estimateMinutes } = args as { title: string; priority?: 'LOW'|'MEDIUM'|'HIGH'; estimateMinutes?: number };
        const data: Prisma.TaskUncheckedCreateInput = {
          boardId: board.id,
          columnId: todoColumn.id,
          title,
          priority,
          status: "TODO",
        };

        if (typeof estimateMinutes === 'number') {
          data.estimateMinutes = estimateMinutes;
        }

        const task = await prisma.task.create({
          data,
        });

        return { success: true, taskId: task.id, message: `Task "${title}" created.` };
      },
    } as any),

    markTaskDone: tool({
      description: 'Mark a task as completed (moves to Done column and sets status DONE).',
      inputSchema: z.object({ taskId: z.string().describe('ID of the task') }),
      execute: async (args: any) => {
        const { taskId } = args as { taskId: string };
        // Ensure task belongs to the current user/board
        const task = await prisma.task.findFirst({ where: { id: taskId, boardId: board.id }, select: { id: true, boardId: true } });
        if (!task) {
          return { success: false, message: 'Task not found in your board.' };
        }

        // Find a Done column if it exists, else fallback to the last column
        let doneColumnId: string | null = null;
        try {
          const doneCol = await prisma.column.findFirst({ where: { boardId: board.id, name: { equals: 'Done', mode: 'insensitive' } as any }, select: { id: true } });
          if (doneCol) doneColumnId = doneCol.id;
          else {
            const lastCol = await prisma.column.findFirst({ where: { boardId: board.id }, orderBy: { position: 'desc' }, select: { id: true } });
            doneColumnId = lastCol?.id ?? null;
          }
        } catch { /* noop */ }

        const updated = await prisma.task.update({
          where: { id: taskId },
          data: { status: 'DONE', ...(doneColumnId ? { column: { connect: { id: doneColumnId } } } : {}) },
          select: { id: true, status: true, columnId: true }
        });

        return { success: true, message: 'Marked as done.', taskId: updated.id, status: updated.status, columnId: updated.columnId };
      }
    } as any),
  };
};
