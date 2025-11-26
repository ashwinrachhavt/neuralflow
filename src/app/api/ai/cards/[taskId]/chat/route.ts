import { streamText, convertToModelMessages } from 'ai';
import { openai } from '@/lib/ai/client';
import { getUserOr401 } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";

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
    select: { id: true, title: true, descriptionMarkdown: true, topics: true, primaryTopic: true }
  });

  if (!task) return new Response('Not found', { status: 404 });

  const note = await prisma.note.findFirst({
    where: { taskId: taskId },
    select: { contentMarkdown: true }
  });

  const system = [
    'You are an assistant embedded in a Todo card. Keep replies short and actionable.',
    'Use bullets and checklists sparingly. Default to one or two sentences.',
    'If user asks to enrich, suggest 2–3 concrete subtasks. If summary, give 3 bullets.',
  ].join('\n');

  const context = [
    `Task: ${task.title}`,
    task.primaryTopic ? `Primary Topic: ${task.primaryTopic}` : '',
    (task.topics as any)?.length ? `Topics: ${(task.topics as any).join(', ')}` : '',
    task.descriptionMarkdown ? `Description: ${task.descriptionMarkdown}` : '',
    note?.contentMarkdown ? `Note: ${note.contentMarkdown.slice(0, 800)}` : '',
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
