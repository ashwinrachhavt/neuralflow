import { generateObject } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { textModel } from '@/lib/ai/config';

const LearningSchema = z.object({
  summary: z.string().describe('One-sentence what-you-learned summary'),
  tags: z.array(z.string()).default([]).describe('Short tags capturing the learning topic'),
  confidence: z.number().optional().describe('Optional confidence after completing, 0-1'),
});

export async function recordLearningOnTaskDone(userId: string, taskId: string) {
  // If schema not migrated yet, skip
  if (!(prisma as any).taskLearning) {
    return { created: false, reason: 'TaskLearning table missing (run migrations)' };
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId } },
    select: {
      id: true, title: true, descriptionMarkdown: true, tags: true, topics: true, primaryTopic: true,
      type: true, priority: true, project: { select: { title: true } }, note: { select: { contentMarkdown: true } as any }
    },
  });
  if (!task) return { created: false, reason: 'Task not found' } as const;

  const system = `You are a concise learning tracker. Given task context and notes, extract a single learning the user likely gained by completing this task. Keep it small and factual.`;
  const prompt = {
    task: {
      title: task.title,
      description: task.descriptionMarkdown,
      type: task.type,
      priority: task.priority,
      project: task.project?.title,
      tags: task.tags,
      topics: task.topics,
      primaryTopic: task.primaryTopic,
    },
    note: task.note ? (task.note as any).contentMarkdown : null,
  };

  const { object } = await generateObject({ model: textModel('gpt-4o-mini'), schema: LearningSchema, system, prompt: JSON.stringify(prompt) });

  const created = await (prisma as any).taskLearning.create({
    data: {
      userId,
      taskId,
      summary: object.summary,
      tags: object.tags || [],
      confidence: typeof object.confidence === 'number' ? object.confidence : null,
    },
    select: { id: true },
  });

  return { created: true, id: created.id } as const;
}

