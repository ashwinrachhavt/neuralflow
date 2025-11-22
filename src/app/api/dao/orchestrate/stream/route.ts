import { NextResponse } from 'next/server';
import { getUserOr401, readJson } from '@/lib/api-helpers';
import { runDaoOrchestrator } from '@/lib/ai/orchestrator';

export const dynamic = 'force-dynamic';

type Body = { brainDumpText?: string; quickTodoText?: string; boardId?: string };

export async function POST(req: Request) {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;

  const body = (await readJson<Body>(req)) ?? {};
  const { brainDumpText, quickTodoText, boardId } = body;

  // Reuse existing orchestrator to generate tasks, then stream them progressively as NDJSON
  const ctx = await runDaoOrchestrator({
    userId: (user as any).id,
    brainDumpText,
    quickTodoText,
    boardId,
  });

  const tasks = (ctx.enrichedTasks ?? ctx.generatedTasks ?? []).map((t: any) => ({
    title: t.title,
    descriptionMarkdown: t.descriptionMarkdown ?? '',
    priority: t.priority ?? 'MEDIUM',
    estimatePomodoros: t.estimatedPomodoros ?? null,
    tags: t.tags ?? [],
    kind: t.kind ?? undefined,
    depthScore: typeof t.depthScore === 'number' ? t.depthScore : undefined,
  }));

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      try {
        for (const task of tasks) {
          const line = JSON.stringify({ type: 'task', task }) + '\n';
          controller.enqueue(encoder.encode(line));
        }
        // Final envelope (optional)
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done', count: tasks.length }) + '\n'));
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
