import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';
import { generateObject } from 'ai';
import { z } from 'zod';
import { textModel } from '@/lib/ai/config';

const LearningSchema = z.object({
  summary: z.string().describe('One-sentence what-you-learned summary'),
  tags: z.array(z.string()).default([]).describe('Short tags capturing the learning topic'),
  confidence: z.number().optional().describe('Optional confidence after completing, 0-1'),
});

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;
  const { taskId } = await req.json();
  if (!taskId) return NextResponse.json({ message: 'taskId required' }, { status: 400 });

  const task = await prisma.task.findFirst({
    where: { id: String(taskId), board: { userId } },
    select: {
      id: true, title: true, descriptionMarkdown: true, tags: true, topics: true, primaryTopic: true,
      type: true, priority: true, project: { select: { title: true } }, note: { select: { contentMarkdown: true } as any }
    },
  });
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

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
  return NextResponse.json({ learning: object });
}

