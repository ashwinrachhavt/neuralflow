import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runWeeklyReview } from '@/lib/ai/orchestrator';

export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { id: true }, take: 1000 });
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(now); start.setDate(now.getDate() - diffToMonday); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate() + 7); end.setHours(0,0,0,0);

  const results: { userId: string; ok: boolean }[] = [];
  for (const u of users) {
    try {
      await runWeeklyReview(u.id, start, end);
      results.push({ userId: u.id, ok: true });
    } catch {
      results.push({ userId: u.id, ok: false });
    }
  }
  return NextResponse.json({ ranFor: results.length, okCount: results.filter(r=>r.ok).length });
}

