import { streamText } from 'ai';
import { openai } from '@/lib/ai/client';
import { getUserOr401 } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { getRelatedItemsForTask } from "@/server/db/related";

export const maxDuration = 30;

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const user = await getUserOr401();
  if (!(user as any).id) return new Response('Unauthorized', { status: 401 });
  const userId = (user as any).id;

  const body = (await req.json().catch(() => ({}))) as any;
  const uiMessages = body?.messages ?? [];
  const model = body?.model;

  const task = await prisma.task.findFirst({
    where: { id: taskId, board: { userId } },
    select: {
      id: true,
      title: true,
      descriptionMarkdown: true,
      topics: true,
      primaryTopic: true,
      priority: true,
      status: true,
      type: true,
      estimatedPomodoros: true,
      estimateMinutes: true,
      dueDate: true,
      tags: true,
      column: { select: { name: true } },
      project: { select: { title: true } },
    },
  });

  if (!task) return new Response('Not found', { status: 404 });

  const note = await prisma.note.findFirst({
    where: { taskId: taskId },
    select: { contentMarkdown: true }
  });

  const system = [
    'You are an assistant embedded in a Todo card.',
    'Be concise and action-focused. Prefer a single paragraph or 2–3 bullets when needed.',
    'If enrich requested, propose 2–3 concrete subtasks with crisp outcomes. If summary, give 3 bullets max.',
  ].join('\n');

  const related = await getRelatedItemsForTask(taskId, userId);
  const relatedLines = related.slice(0, 6).map((r) => `- ${r.type}: ${r.title} (${r.id})`).join('\n');

  const context = [
    `Task: ${task.title}`,
    task.column?.name ? `Column: ${task.column.name}` : '',
    task.project?.title ? `Project: ${task.project.title}` : '',
    `Status: ${task.status} | Priority: ${task.priority}${typeof task.estimatedPomodoros === 'number' ? ` | Pomodoros: ${task.estimatedPomodoros}` : ''}${typeof task.estimateMinutes === 'number' ? ` | Estimate: ${task.estimateMinutes} min` : ''}`,
    task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleString()}` : '',
    (task.tags as any)?.length ? `Tags: ${(task.tags as any).join(', ')}` : '',
    task.primaryTopic ? `Primary Topic: ${task.primaryTopic}` : '',
    (task.topics as any)?.length ? `Topics: ${(task.topics as any).join(', ')}` : '',
    task.descriptionMarkdown ? `Description:\n${task.descriptionMarkdown}` : '',
    note?.contentMarkdown ? `Note:\n${note.contentMarkdown.slice(0, 800)}` : '',
    relatedLines ? `Related:\n${relatedLines}` : '',
    `Instruction: When acting on this card, prefer proposing the next tiny, verifiable step if the user asks for “what next”.`
  ].filter(Boolean).join('\n');

  const fullSystem = `${system}\n\nContext:\n${context}`;

  const modelMessages = (Array.isArray(uiMessages) ? uiMessages : []).map((m: any) => {
    const text = Array.isArray(m?.parts) ? m.parts.filter((p: any) => p?.type === 'text').map((p: any) => p.text).join('') : (m?.content ?? '');
    return { role: m?.role ?? 'user', content: text } as any;
  });

  const result = streamText({
    model: openai(model || 'gpt-4o'),
    messages: modelMessages,
    system: fullSystem,
  });

  return result.toUIMessageStreamResponse();
}
