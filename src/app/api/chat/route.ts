import { stepCountIs, streamText, convertToModelMessages } from 'ai';
import { openai } from '@/lib/ai/client';
import { getTools } from '@/lib/ai/tools';
import { getUserOr401 } from '@/lib/api-helpers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const user = await getUserOr401();
  // If not authenticated, the helper returns a NextResponse we should forward
  if (!(user as any).id) return user as unknown as Response;

  const body = (await req.json().catch(() => ({}))) as { messages?: any[] };
  const uiMessages = body.messages ?? [];
  const tools = await getTools();

  // Load a lightweight summary of the user's current TODO context
  const tasks = await prisma.task.findMany({
    where: { board: { userId: (user as any).id }, status: { in: ['TODO', 'IN_PROGRESS'] } as any },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    select: { id: true, title: true, status: true, priority: true, estimatedPomodoros: true }
  });

  const todoSummary = tasks
    .map((t, i) => `${i + 1}. (${t.id}) [${t.priority}] ${t.title}${t.estimatedPomodoros ? ` (${t.estimatedPomodoros} pom)` : ''} — ${t.status}`)
    .join('\n');

  const system = [
    'You are a concise productivity assistant that manages the user\'s smart todo list.',
    'Be brief and action-oriented. Prefer bullet points and concrete steps.',
    'If the user asks to add an item, call the createTask tool with a clear title.',
    'If the user asks to check something off, call the markTaskDone tool with the correct task id when unambiguous.',
    'After any tool use, always report a single-line result like: "Created task: <title>" or "Marked as done: <task id/title>".',
    'Do not expose internal reasoning. Summarize decisions at a high level only.',
    '',
    'Context: Current focus items (top 20):',
    todoSummary || '(no active todos)'
  ].join('\n');

  const modelMessages = (Array.isArray(uiMessages) ? uiMessages : []).map((m: any) => {
    const text = Array.isArray(m?.parts) ? m.parts.filter((p: any) => p?.type === 'text').map((p: any) => p.text).join('') : (m?.content ?? '');
    return { role: m?.role ?? 'user', content: text } as any;
  });

  return streamText({
    model: openai('gpt-4o'),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    system,
  }).toUIMessageStreamResponse();
}
