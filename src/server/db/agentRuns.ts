import { prisma } from './client';

type StartArgs = { userId?: string; type: string; model?: string | null };
export async function logAgentRunStart({ userId, type, model }: StartArgs) {
  return prisma.agentRun.create({ data: { userId: userId ?? null, route: type, model: model ?? null, status: 'running' } });
}

export async function logAgentRunEvent(runId: string, kind: string, payload: unknown) {
  return prisma.aIEvent.create({ data: { runId, kind, payload: payload as any } });
}

type FinishArgs = { runId?: string | null; status: 'ok' | 'error'; error?: string; durationMs?: number; output?: unknown };
export async function logAgentRunFinish({ runId, status, error, durationMs, output }: FinishArgs) {
  if (!runId) return null;
  await prisma.agentRun.update({ where: { id: runId }, data: { status, error: error ?? null } });
  if (typeof durationMs === 'number') {
    await prisma.aIEvent.create({ data: { runId, kind: 'metrics', payload: { durationMs } as any } });
  }
  if (output !== undefined) {
    await prisma.aIEvent.create({ data: { runId, kind: 'output', payload: output as any } });
  }
  return true;
}

