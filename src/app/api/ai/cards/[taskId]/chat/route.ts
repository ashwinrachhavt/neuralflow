import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { generateText } from "ai";
import { openai } from "@/lib/ai/client";

type Ctx = { params: Promise<{ taskId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { taskId } = await ctx.params;
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const body = await req.json().catch(() => ({}));
  const messages = (body?.messages as { role: 'user'|'assistant', content: string }[] | undefined) ?? [];
  const requestedModel = (body?.model as string | undefined) || null;

  const task = await prisma.task.findFirst({ where: { id: taskId, board: { userId } }, select: { id: true, title: true, descriptionMarkdown: true, topics: true, primaryTopic: true } });
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  const note = await prisma.note.findFirst({ where: { taskId: taskId }, select: { contentMarkdown: true } });

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

  const userTurn = messages[messages.length - 1]?.content || '';

  try {
    const safeModel = (() => {
      const m = (requestedModel || '').trim();
      if (!m) return 'gpt-4o-mini';
      if (/^gpt-5/i.test(m)) return 'gpt-4.1';
      return m;
    })();
    const { text } = await generateText({
      model: openai(safeModel),
      system,
      prompt: [context, '', 'User:', userTurn].join('\n')
    });
    return NextResponse.json({ reply: text.trim() });
  } catch (_e:any) {
    return NextResponse.json({ reply: 'Unable to respond right now. Try again shortly.' }, { status: 200 });
  }
}
