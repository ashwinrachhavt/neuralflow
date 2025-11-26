import { NextResponse } from 'next/server';
import { getUserOr401 } from '@/lib/api-helpers';
import { runWeeklyReview } from '@/lib/ai/orchestrator';

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  // Current week (Mon–Sun)
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7; // 0 for Monday
  const start = new Date(now); start.setDate(now.getDate() - diffToMonday); start.setHours(0,0,0,0);
  const end = new Date(start); end.setDate(start.getDate() + 7); end.setHours(0,0,0,0);

  const { analyzerResult, reporterResult } = await runWeeklyReview(userId, start, end);
  return NextResponse.json({ analyzer: analyzerResult, reporter: reporterResult });
}

