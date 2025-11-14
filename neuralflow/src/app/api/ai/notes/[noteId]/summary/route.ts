import { NextResponse } from 'next/server';
import { getOrCreateDbUser } from '@/lib/get-or-create-user';
import { prisma } from '@/server/db/client';
import { summarizeNote } from '@/lib/ai/agents/noteAgent';
import { logAgentRunStart, logAgentRunFinish } from '@/server/db/agentRuns';

type RouteContext = { params: { noteId: string } };

export async function POST(_req: Request, { params }: RouteContext) {
  const user = await getOrCreateDbUser();
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const note = await prisma.note.findFirst({ where: { id: params.noteId, task: { board: { userId: user.id } } } });
  if (!note) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const startedAt = Date.now();
  const run = await logAgentRunStart({ userId: user.id, type: 'note-summary', model: process.env.AI_MODEL }).catch(() => null);
  try {
    const output = await summarizeNote({ markdown: note.contentMarkdown });
    await logAgentRunFinish({ runId: run?.id, status: 'ok', durationMs: Date.now() - startedAt, output: { summaryChars: output.summary.length, bullets: output.bullets.length } }).catch(() => {});
    return NextResponse.json(output);
  } catch (e: any) {
    await logAgentRunFinish({ runId: run?.id, status: 'error', durationMs: Date.now() - startedAt, error: e?.message ?? String(e) }).catch(() => {});
    return NextResponse.json({ message: 'Failed to summarize' }, { status: 500 });
  }
}

