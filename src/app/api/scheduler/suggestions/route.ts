import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserOr401 } from "@/lib/api-helpers";
import { computeFreeWindows } from "@/lib/scheduler/engine";
import { defaultRules, runRules, type SchedulerPrefs } from "@/lib/scheduler/rules-engine";

export async function GET() {
  const user = await getUserOr401();
  if (!(user as any).id) return user as unknown as NextResponse;
  const userId = (user as any).id as string;

  const now = new Date();
  // Load user preferences from ReporterProfile.trendNotes.schedulerPrefs (fallback to env/defaults)
  const profile = await prisma.reporterProfile.findUnique({ where: { userId: (user as any).id as string }, select: { trendNotes: true } });
  const prefs = ((profile?.trendNotes as any)?.schedulerPrefs || {}) as SchedulerPrefs;
  const workStartHour = Number(prefs.workStartHour ?? process.env.WORK_START_HOUR ?? 9);
  const endWorkHour = Number((prefs as any).workEndHour ?? process.env.WORK_END_HOUR ?? 17);
  const startOfDay = new Date(now); startOfDay.setHours(workStartHour,0,0,0);
  const endOfDay = new Date(now); endOfDay.setHours(21,0,0,0);

  // Fetch today’s events and user tasks + recent learnings (30d)
  const [events, tasks, recentLearnings] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: startOfDay, lt: endOfDay } },
      orderBy: { startAt: 'asc' },
      select: { startAt: true, endAt: true },
    }),
    prisma.task.findMany({
      where: { board: { userId }, status: { in: ['TODO','IN_PROGRESS'] } },
      select: { id: true, topics: true, primaryTopic: true },
      take: 300,
    }),
    (async () => {
      if (!((prisma as any).taskLearning)) return [] as { tags: string[] }[];
      return await (prisma as any).taskLearning.findMany({ where: { userId, createdAt: { gte: new Date(Date.now() - 1000*60*60*24*30) } }, select: { tags: true } });
    })(),
  ]);

  const free = computeFreeWindows(events.map(e => ({ startAt: e.startAt, endAt: e.endAt })), startOfDay, endOfDay, 20);

  // Topic counts for backlog
  const topicCounts: Record<string, number> = {};
  for (const t of tasks) {
    const tops = (t.topics as any as string[] | null) ?? [];
    const primary = (t.primaryTopic as any as string | null) ?? null;
    if (primary) topicCounts[primary] = (topicCounts[primary] || 0) + 1;
    for (const x of tops) topicCounts[x] = (topicCounts[x] || 0) + 1;
  }

  // Encourage recently learned strengths via tags
  const learnTagCounts: Record<string, number> = {};
  for (const l of recentLearnings) {
    const tags = (l.tags ?? []) as string[];
    tags.forEach((t: string) => {
      learnTagCounts[t] = (learnTagCounts[t] || 0) + 1;
    });
  }
  const boostedTopics = Object.entries(learnTagCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>k);
  const suggestions = runRules(defaultRules(), {
    now,
    userId,
    free,
    topicCounts,
    boostedTopics,
    prefs,
  });

  return NextResponse.json({ suggestions });
}
