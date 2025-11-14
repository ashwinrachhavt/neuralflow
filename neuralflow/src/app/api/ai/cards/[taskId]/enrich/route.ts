import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';
import { getByIdForUser } from '@/server/db/cards';
import { enrichCard } from '@/lib/ai/agents/cardAgent';
import { logAgentRunStart, logAgentRunFinish } from '@/server/db/agentRuns';

type RouteContext = { params: { taskId: string } };

export async function POST(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const task = await getByIdForUser(params.taskId, user.id).catch(() => null);
  if (!task) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId: user.id, type: 'card-enrich', model: process.env.AI_MODEL }).catch(() => null);

  try {
    const result = await enrichCard({ title: task.title, description: task.descriptionMarkdown });
    await prisma.task.update({ where: { id: task.id }, data: { descriptionMarkdown: result.descriptionMarkdown, enrichedAt: new Date() } });
    await logAgentRunFinish({ runId: run?.id, status: 'ok', durationMs: Date.now() - startedAt, output: { chars: result.descriptionMarkdown.length } }).catch(() => {});
    return NextResponse.json({ descriptionMarkdown: result.descriptionMarkdown });
  } catch (e: any) {
    await logAgentRunFinish({ runId: run?.id, status: 'error', durationMs: Date.now() - startedAt, error: e?.message ?? String(e) }).catch(() => {});
    return NextResponse.json({ message: 'Failed to enrich' }, { status: 500 });
  }
}

