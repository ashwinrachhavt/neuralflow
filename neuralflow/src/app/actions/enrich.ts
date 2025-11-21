'use server';

import { generateObject } from 'ai';
import { openai } from '@/lib/ai/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUserOrThrow } from '@/lib/auth';

export async function enrichTask(taskId: string) {
  const user = await getCurrentUserOrThrow();
  const task = await prisma.task.findUnique({
    where: { id: taskId, userId: user.id },
    select: {
      title: true,
      descriptionMarkdown: true,
      estimateMinutes: true,
      tags: true,
    },
  });

  if (!task) throw new Error('Task not found');

  const schema = z.object({
    improvedTitle: z.string(),
    subtasks: z.array(z.string()).max(3),
    estimateMinutes: z.number(),
    tags: z.array(z.string()),
  });

  const prompt = [
    `Analyze this task: "${task.title}".`,
    `Description: "${task.descriptionMarkdown || ''}".`,
    '',
    '1. Make the title action-oriented (starts with a verb).',
    '2. Break it down into max 3 subtasks.',
    '3. Estimate time if missing.',
  ].join('\n');

  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema,
    prompt,
  });

  const breakdownLines = object.subtasks.map((subtask) => `- [ ] ${subtask}`);
  const hasExistingDescription = !!task.descriptionMarkdown?.trim();
  const enrichedDescription = `${hasExistingDescription ? `${task.descriptionMarkdown}\n\n` : ''}**AI Breakdown:**\n${breakdownLines.join('\n')}`;
  const mergedTags = Array.from(new Set([...(task.tags ?? []), ...object.tags]));

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title: object.improvedTitle,
      estimateMinutes: task.estimateMinutes ?? object.estimateMinutes,
      descriptionMarkdown: enrichedDescription,
      tags: mergedTags,
    },
  });

  return object;
}
